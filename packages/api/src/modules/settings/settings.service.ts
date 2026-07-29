import prisma from "../../common/utils/prisma";
import nodemailer from "nodemailer";

interface SmtpSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_secure: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from_name: string;
  smtp_from_email: string;
}

export class SettingsService {
  async getSmtp(): Promise<SmtpSettings> {
    const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from_name", "smtp_from_email"];
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } },
    });

    const result: Record<string, string> = {};
    for (const key of keys) {
      const setting = settings.find((s) => s.key === key);
      result[key] = setting?.value || "";
    }

    return { ...result, smtp_pass: result.smtp_pass ? "********" : "" } as SmtpSettings;
  }

  async saveSmtp(values: Record<string, string>) {
    const entries: { key: string; value: string }[] = [];

    const fields = [
      "smtp_host", "smtp_port", "smtp_secure", "smtp_user",
      "smtp_from_name", "smtp_from_email",
    ];

    for (const key of fields) {
      if (values[key] !== undefined) {
        entries.push({ key, value: values[key]?.toString() || "" });
      }
    }

    if (values.smtp_pass && values.smtp_pass !== "********") {
      entries.push({ key: "smtp_pass", value: values.smtp_pass });
    }

    for (const entry of entries) {
      await prisma.systemSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      });
    }

    return this.getSmtp();
  }

  async testSmtp(values: { to: string }) {
    const smtp = await this.getSmtp();
    const allSettings = await prisma.systemSetting.findMany({
      where: { key: { in: ["smtp_pass"] } },
    });
    const actualPass = allSettings.find((s) => s.key === "smtp_pass")?.value || "";

    if (!smtp.smtp_host || !smtp.smtp_user) {
      throw new Error("SMTP yapilandirilmadi");
    }

    const transporter = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: parseInt(smtp.smtp_port || "587"),
      secure: smtp.smtp_secure === "true",
      auth: {
        user: smtp.smtp_user,
        pass: actualPass,
      },
    });

    await transporter.sendMail({
      from: `"${smtp.smtp_from_name || "ServisNet"}" <${smtp.smtp_from_email || smtp.smtp_user}>`,
      to: values.to,
      subject: "ServisNet - SMTP Testi",
      html: "<p>SMTP yapilandirmaniz basariyla tamamlandi!</p>",
    });

    return { success: true };
  }
}

export const settingsService = new SettingsService();
