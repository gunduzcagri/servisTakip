import prisma from "../../common/utils/prisma";
import { AppError } from "../../common/utils/app-error";
import { SendSmsInput, SmsProviderInput } from "./sms.dto";

interface SmsProviderConfig {
  name: string;
  provider: "NETGSM" | "TWILIO" | "BULKSMS";
  isActive: boolean;
  config: Record<string, any>;
}

export class SmsService {
  private async getActiveProvider(): Promise<SmsProviderConfig | null> {
    const configs = await prisma.smsProviderConfig.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (configs.length === 0) return null;
    return configs[0] as any;
  }

  async getAllProviders() {
    return prisma.smsProviderConfig.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async getProviderById(id: string) {
    const provider = await prisma.smsProviderConfig.findUnique({
      where: { id },
    });

    if (!provider) throw AppError.notFound("SMS saglayici bulunamadi");
    return provider;
  }

  async createProvider(input: SmsProviderInput) {
    const existing = await prisma.smsProviderConfig.findUnique({
      where: { name: input.name },
    });

    if (existing) throw AppError.validation("Bu isimde bir saglayici zaten var");

    return prisma.smsProviderConfig.create({
      data: input,
    });
  }

  async updateProvider(id: string, input: Partial<SmsProviderInput>) {
    const provider = await prisma.smsProviderConfig.findUnique({
      where: { id },
    });

    if (!provider) throw AppError.notFound("SMS saglayici bulunamadi");

    if (input.name && input.name !== provider.name) {
      const dupe = await prisma.smsProviderConfig.findUnique({
        where: { name: input.name },
      });
      if (dupe) throw AppError.validation("Bu isimde bir saglayici zaten var");
    }

    return prisma.smsProviderConfig.update({
      where: { id },
      data: input,
    });
  }

  async setActiveProvider(id: string) {
    await prisma.smsProviderConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    return prisma.smsProviderConfig.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deleteProvider(id: string) {
    return prisma.smsProviderConfig.delete({
      where: { id },
    });
  }

  async sendSms(input: SendSmsInput) {
    const provider = await this.getActiveProvider();

    if (!provider) {
      console.log("Aktif SMS saglayici yok, SMS gonderilemedi");
      return this.logSms(input.recipient, input.message, "FAILED", null, null, "No active provider", input.referenceType, input.referenceId);
    }

    try {
      let result: { success: boolean; messageId?: string; segments?: number; cost?: number };

      switch (provider.provider) {
        case "NETGSM":
          result = await this.sendViaNetGSM(provider.config, input);
          break;
        case "TWILIO":
          result = await this.sendViaTwilio(provider.config, input);
          break;
        case "BULKSMS":
          result = await this.sendViaBulkSms(provider.config, input);
          break;
        default:
          throw new Error("Bilinmeyen SMS saglayici");
      }

      if (result.success) {
        await this.logSms(
          input.recipient,
          input.message,
          "SENT",
          provider.provider,
          result.messageId || null,
          null,
          null,
          input.referenceType,
          input.referenceId,
          result.segments || 1,
          result.cost !== undefined ? result.cost : null
        );
        return { success: true, messageId: result.messageId };
      } else {
        throw new Error("SMS gonderim basarisiz");
      }
    } catch (err: any) {
      await this.logSms(
        input.recipient,
        input.message,
        "FAILED",
        provider.provider,
        null,
        err.code || "UNKNOWN",
        err.message || "Bilinmeyen hata",
        input.referenceType,
        input.referenceId
      );
      console.error("SMS gonderim hatasi:", err);
      return { success: false, error: err.message };
    }
  }

  private async sendViaNetGSM(config: Record<string, any>, input: SendSmsInput) {
    const { usercode, password, sender } = config;

    if (!usercode || !password) {
      throw new Error("NetGSM kullanici adi veya sifre eksik");
    }

    const url = "https://api.netgsm.com.tr/sms/send";
    
    const params = new URLSearchParams({
      usercode,
      password,
      msg: input.message,
      gsmnumber: input.recipient,
      sender: sender || "ServisNet",
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const text = await response.text();
    const parts = text.split("|");

    if (parts[0] === "00" || parts[0] === "01") {
      return {
        success: true,
        messageId: parts[1] || `netgsm_${Date.now()}`,
        segments: Math.ceil(input.message.length / 160),
      };
    }

    throw new Error(`NetGSM Hata: ${text}`);
  }

  private async sendViaTwilio(config: Record<string, any>, input: SendSmsInput) {
    const { accountSid, authToken, fromNumber } = config;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio ayarlari eksik");
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const params = new URLSearchParams({
      To: input.recipient.startsWith("+") ? input.recipient : `+90${input.recipient}`,
      From: fromNumber,
      Body: input.message,
    });

        const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data: any = await response.json();

    if (!response.ok) {
      const error = data.message || "Twilio gonderim hatasi";
      throw { code: data.code || "TWILIO_ERROR", message: error };
    }

    return {
      success: true,
      messageId: data.sid,
      segments: data.numSegments ? parseInt(data.numSegments) : 1,
      cost: data.price ? parseFloat(data.price) : undefined,
    };
  }

  private async sendViaBulkSms(config: Record<string, any>, input: SendSmsInput) {
    const { username, password, virtualSender } = config;

    if (!username || !password) {
      throw new Error("BulkSMS kullanici adi veya sifre eksik");
    }

    const url = "https://api.bulksms.com/v1/messages";
    
    const body = {
      messages: [
        {
          recipient: input.recipient.startsWith("+") ? input.recipient : `+90${input.recipient}`,
          sender: virtualSender || "ServisNet",
          body: input.message,
        },
      ],
    };

    const auth = Buffer.from(`${username}:${password}`).toString("base64");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data: any = await response.json();

    if (data.messages && data.messages.length > 0) {
      const msg = data.messages[0];
      if (msg.status === "SUCCESSFUL") {
        return {
          success: true,
          messageId: msg.id || `bulksms_${Date.now()}`,
        };
      }
      throw { code: msg.status_code || "BULKSMS_ERROR", message: msg.description || "BulkSMS gonderim hatasi" };
    }

    throw new Error("BulkSMS yanit hatasi");
  }

  private async logSms(
    recipient: string,
    message: string,
    status: string,
    provider: string | null = null,
    messageId: string | null = null,
    errorCode: string | null = null,
    errorMessage: string | null = null,
    referenceType: string | null = null,
    referenceId: string | null = null,
    segments: number = 1,
    cost: number | null = null
  ) {
    return prisma.smsLog.create({
      data: {
        recipient,
        message,
        status,
        provider: provider as any,
        messageId,
        errorCode,
        errorMessage,
        segments: segments as any,
        cost: cost as any,
        referenceType,
        referenceId,
      },
    });
  }

  async getSmsLogs(page: number = 1, limit: number = 50, status?: string, recipient?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (recipient) where.recipient = { contains: recipient };

    const [logs, total] = await Promise.all([
      prisma.smsLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.smsLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  async getSmsStats(fromDate?: Date, toDate?: Date) {
    const where: any = {};
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const total = await prisma.smsLog.count({ where });
    const sent = await prisma.smsLog.count({ where: { ...where, status: "SENT" } });
    const failed = await prisma.smsLog.count({ where: { ...where, status: "FAILED" } });

    const costResult = await prisma.smsLog.aggregate({
      where: { ...where, status: "SENT" },
      _sum: { cost: true },
    });

    return {
      total,
      sent,
      failed,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : "0",
      totalCost: costResult._sum.cost || 0,
    };
  }
}

export const smsService = new SmsService();
