import prisma from "../../common/utils/prisma";
import { AppError } from "../../common/utils/app-error";

export class CargoService {
  async getCargoCompanies() {
    return Object.keys(CargoCompany).map((key) => ({
      key,
      label: this.getCompanyLabel(key as string),
      logo: this.getCompanyLogo(key as string),
    }));
  }

  private getCompanyLabel(company: string): string {
    const labels: Record<string, string> = {
      ARAS: "Aras Kargo",
      YURTICI: "Yurtiçi Kargo",
      MNG: "MNG Kargo",
      PTT: "PTT Kargo",
      SURAT: "Sürat Kargo",
      UPS: "UPS Kargo",
      FEDEX: "FedEx",
      DHL: "DHL Express",
      TRENDYOL: "Trendyol Express",
      HEPJET: "Hepjet",
    };
    return labels[company] || company;
  }

  private getCompanyLogo(company: string): string {
    // Frontend'de logo URL'leri kullanılabilir
    return `/logos/${company.toLowerCase()}.png`;
  }

  async getConfigs() {
    return prisma.cargoConfig.findMany({
      orderBy: { company: "asc" },
    });
  }

  async getConfig(company: string) {
    return prisma.cargoConfig.findUnique({
      where: { company: company as any },
    });
  }

  async saveConfig(company: string, config: any) {
    return prisma.cargoConfig.upsert({
      where: { company: company as any },
      update: {
        ...config,
        updatedAt: new Date(),
      },
      create: {
        company: company as any,
        ...config,
      },
    });
  }

  async createShipment(data: {
    company: string;
    serviceRecordId?: string;
    invoiceId?: string;
    senderName?: string;
    senderPhone?: string;
    senderAddress?: string;
    senderCity?: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    recipientCity: string;
    packageCount?: number;
    weight?: number;
    dimensions?: string;
    notes?: string;
  }) {
    const company = data.company.toUpperCase();
    
    // Generate tracking number
    const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Get sender info from config if not provided
    const config = await this.getConfig(company);
    const senderName = data.senderName || config?.senderName || "ServisNet";
    const senderPhone = data.senderPhone || config?.senderPhone || "";
    const senderAddress = data.senderAddress || "";
    const senderCity = data.senderCity || config?.senderCity || "";

    // Get recipient from service record if available
    let recipientData = {
      name: data.recipientName,
      phone: data.recipientPhone,
      address: data.recipientAddress,
      city: data.recipientCity,
    };

    if (data.serviceRecordId) {
      const service = await prisma.serviceRecord.findUnique({
        where: { id: data.serviceRecordId },
        include: {
          customer: { select: { fullName: true, phone: true } },
        },
      });

      if (service?.customer) {
        recipientData.name = service.customer.fullName;
        recipientData.phone = service.customer.phone || data.recipientPhone;
      }
    }

    const shipment = await prisma.cargoShipment.create({
      data: {
        trackingNumber,
        company: company as any,
        status: "CREATED",
        serviceRecordId: data.serviceRecordId,
        invoiceId: data.invoiceId,
        senderName,
        senderPhone,
        senderAddress,
        senderCity,
        recipientName: recipientData.name,
        recipientPhone: recipientData.phone,
        recipientAddress: recipientData.address,
        recipientCity: recipientData.city,
        packageCount: data.packageCount || 1,
        weight: data.weight,
        dimensions: data.dimensions,
        notes: data.notes,
      },
    });

    // Try to create on cargo company API
    try {
      const cargoCode = await this.createOnCargoCompany(company, shipment);
      if (cargoCode) {
        await prisma.cargoShipment.update({
          where: { id: shipment.id },
          data: { cargoCode, barcode: cargoCode },
        });
      }
    } catch (err) {
      console.log("Kargo API hatasi (manuel takip gerekli):", err);
    }

    return shipment;
  }

  private async createOnCargoCompany(company: string, shipment: any): Promise<string | null> {
    const config = await this.getConfig(company);
    
    if (!config?.isActive || !config?.apiKey) {
      return null; // API configured degil, manuel takip
    }

    switch (company) {
      case "ARAS":
        return this.createArasShipment(config, shipment);
      case "YURTICI":
        return this.createYurticiShipment(config, shipment);
      case "MNG":
        return this.createMngShipment(config, shipment);
      case "PTT":
        return this.createPttShipment(config, shipment);
      case "SURAT":
        return this.createSuratShipment(config, shipment);
      default:
        return null;
    }
  }

  // Aras Kargo Integration
  private async createArasShipment(config: any, shipment: any): Promise<string | null> {
    // Aras Kargo API documentation'dan alinan sample
    const url = config.baseUrl || "https://ws.araskargo.com.tr/Services/REST/WebAPI.svc";
    
    try {
      const response = await fetch(`${url}/shipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          Receiver: {
            Name: shipment.recipientName,
            Phone: shipment.recipientPhone,
            Address: shipment.recipientAddress,
            City: shipment.recipientCity,
          },
          Sender: {
            Name: shipment.senderName,
            Phone: shipment.senderPhone,
            Address: shipment.senderAddress,
            City: shipment.senderCity,
          },
          PackageCount: shipment.packageCount,
          Weight: shipment.weight,
        }),
      });

      const data: any = await response.json();
      if (data?.barcode) {
        return data.barcode;
      }
    } catch (err) {
      console.error("Aras Kargo API error:", err);
    }
    return null;
  }

  // Yurtiçi Kargo Integration
  private async createYurticiShipment(config: any, shipment: any): Promise<string | null> {
    const url = config.baseUrl || "https://digitalservices.yurticikargo.com/Api";
    
    try {
      const response = await fetch(`${url}/Shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ApiKey": config.apiKey,
          "ApiSecret": config.apiSecret,
        },
        body: JSON.stringify({
          ReceiverPersonName: shipment.recipientName,
          ReceiverPhone: shipment.recipientPhone,
          ReceiverAddress: shipment.recipientAddress,
          ReceiverProvince: shipment.recipientCity,
          SenderPersonName: shipment.senderName,
          SenderPhone: shipment.senderPhone,
          SenderAddress: shipment.senderAddress,
          SenderProvince: shipment.senderCity,
          TotalPackages: shipment.packageCount,
          TotalWeight: shipment.weight,
        }),
      });

      const data: any = await response.json();
      if (data?.Barcode) {
        return data.Barcode;
      }
    } catch (err) {
      console.error("Yurtici Kargo API error:", err);
    }
    return null;
  }

  // MNG Kargo Integration
  private async createMngShipment(config: any, shipment: any): Promise<string | null> {
    const url = config.baseUrl || "https://kargotraci.mngkargo.com.tr/api";
    
    try {
      const response = await fetch(`${url}/CreateShipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`,
        },
        body: JSON.stringify({
          AliciAdi: shipment.recipientName,
          AliciTelefon: shipment.recipientPhone,
          AliciAdres: shipment.recipientAddress,
          AliciIl: shipment.recipientCity,
          GondericiAdi: shipment.senderName,
          GondericiTelefon: shipment.senderPhone,
          GondericiAdres: shipment.senderAddress,
          GondericiIl: shipment.senderCity,
          PaketSayisi: shipment.packageCount,
          Agirlik: shipment.weight,
        }),
      });

      const data: any = await response.json();
      if (data?.KargoTakipNo) {
        return data.KargoTakipNo;
      }
    } catch (err) {
      console.error("MNG Kargo API error:", err);
    }
    return null;
  }

  // PTT Kargo Integration
  private async createPttShipment(config: any, shipment: any): Promise<string | null> {
    // PTT Akademi Mail Merge API (ornek)
    const url = config.baseUrl || "https://ptt.gov.tr/api";
    
    try {
      const response = await fetch(`${url}/GonderiOlustur`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.apiKey,
        },
        body: JSON.stringify({
          AliciAd: shipment.recipientName,
          AliciTel: shipment.recipientPhone,
          AliciAdres: shipment.recipientAddress,
          AliciIl: shipment.recipientCity,
          GondericiAd: shipment.senderName,
          GondericiTel: shipment.senderPhone,
          GondericiAdres: shipment.senderAddress,
          GondericiIl: shipment.senderCity,
          Adet: shipment.packageCount,
          Agirlik: shipment.weight,
        }),
      });

      const data: any = await response.json();
      if (data?.BarkodNo) {
        return data.BarkodNo;
      }
    } catch (err) {
      console.error("PTT Kargo API error:", err);
    }
    return null;
  }

  // Sürat Kargo Integration
  private async createSuratShipment(config: any, shipment: any): Promise<string | null> {
    const url = config.baseUrl || "https://suratkargo.com.tr/api";
    
    try {
      const response = await fetch(`${url}/Shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ApiKey": config.apiKey,
        },
        body: JSON.stringify({
          Receiver: {
            Name: shipment.recipientName,
            Phone: shipment.recipientPhone,
            Address: shipment.recipientAddress,
            City: shipment.recipientCity,
          },
          Sender: {
            Name: shipment.senderName,
            Phone: shipment.senderPhone,
            Address: shipment.senderAddress,
            City: shipment.senderCity,
          },
          PackageCount: shipment.packageCount,
          Weight: shipment.weight,
        }),
      });

      const data: any = await response.json();
      if (data?.trackingCode) {
        return data.trackingCode;
      }
    } catch (err) {
      console.error("Surat Kargo API error:", err);
    }
    return null;
  }

  async getShipments(page: number = 1, limit: number = 20, company?: string, status?: string) {
    const where: any = {};
    if (company) where.company = company;
    if (status) where.status = status;

    const [shipments, total] = await Promise.all([
      prisma.cargoShipment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          serviceRecord: { select: { trackingNumber: true } },
          invoice: { select: { invoiceNumber: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cargoShipment.count({ where }),
    ]);

    return { shipments, total, page, limit };
  }

  async getShipmentById(id: string) {
    const shipment = await prisma.cargoShipment.findUnique({
      where: { id },
    });

    if (!shipment) throw AppError.notFound("Kargo gondersi bulunamadi");
    return shipment;
  }

  async updateStatus(id: string, status: string, trackingData?: any) {
    const update: any = {
      status: status as any,
    };

    if (status === "DELIVERED") {
      update.deliveredAt = new Date();
    }

    if (trackingData) {
      update.trackingHistory = trackingData;
    }

    return prisma.cargoShipment.update({
      where: { id },
      data: update,
    });
  }

  async trackShipment(company: string, trackingNumber: string) {
    const config = await this.getConfig(company);
    
    if (!config?.isActive) {
      // Manual tracking info from DB
      const shipment = await prisma.cargoShipment.findFirst({
        where: { company: company as any, trackingNumber },
      });
      return {
        status: shipment?.status,
        history: shipment?.trackingHistory || [],
      };
    }

    // Call cargo company tracking API
    switch (company) {
      case "ARAS":
        return this.trackAras(trackingNumber, config);
      case "YURTICI":
        return this.trackYurtici(trackingNumber, config);
      case "MNG":
        return this.trackMng(trackingNumber, config);
      case "PTT":
        return this.trackPtt(trackingNumber, config);
      case "SURAT":
        return this.trackSurat(trackingNumber, config);
      default:
        return { status: "UNKNOWN", history: [] };
    }
  }

  private async trackAras(trackingNumber: string, config: any) {
    try {
      const url = config.baseUrl || "https://ws.araskargo.com.tr/Services/REST/WebAPI.svc";
      const response = await fetch(`${url}/track/${trackingNumber}`, {
        headers: { "Authorization": `Bearer ${config.apiKey}` },
      });
      const data: any = await response.json();
      return { status: data?.status, history: data?.history || [] };
    } catch {
      return { status: "UNKNOWN", history: [] };
    }
  }

  private async trackYurtici(trackingNumber: string, config: any) {
    try {
      const url = config.baseUrl || "https://digitalservices.yurticikargo.com/Api";
      const response = await fetch(`${url}/TrackByBarcode/${trackingNumber}`, {
        headers: {
          "ApiKey": config.apiKey,
          "ApiSecret": config.apiSecret,
        },
      });
      const data: any = await response.json();
      return { status: data?.status, history: data?.trackingHistory || [] };
    } catch {
      return { status: "UNKNOWN", history: [] };
    }
  }

  private async trackMng(trackingNumber: string, config: any) {
    try {
      const url = config.baseUrl || "https://kargotraci.mngkargo.com.tr/api";
      const response = await fetch(`${url}/Track/${trackingNumber}`, {
        headers: {
          "Authorization": `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`,
        },
      });
      const data: any = await response.json();
      return { status: data?.status, history: data?.history || [] };
    } catch {
      return { status: "UNKNOWN", history: [] };
    }
  }

  private async trackPtt(trackingNumber: string, config: any) {
    try {
      const url = config.baseUrl || "https://ptt.gov.tr/api";
      const response = await fetch(`${url}/track/${trackingNumber}`, {
        headers: { "X-API-Key": config.apiKey },
      });
      const data: any = await response.json();
      return { status: data?.status, history: data?.events || [] };
    } catch {
      return { status: "UNKNOWN", history: [] };
    }
  }

  private async trackSurat(trackingNumber: string, config: any) {
    try {
      const url = config.baseUrl || "https://suratkargo.com.tr/api";
      const response = await fetch(`${url}/track/${trackingNumber}`, {
        headers: { "ApiKey": config.apiKey },
      });
      const data: any = await response.json();
      return { status: data?.status, history: data?.trackingDetails || [] };
    } catch {
      return { status: "UNKNOWN", history: [] };
    }
  }

  async deleteShipment(id: string) {
    return prisma.cargoShipment.delete({
      where: { id },
    });
  }
}

export const cargoService = new CargoService();

// Export enum for reference
const CargoCompany = {
  ARAS: "ARAS",
  YURTICI: "YURTICI",
  MNG: "MNG",
  PTT: "PTT",
  SURAT: "SURAT",
  UPS: "UPS",
  FEDEX: "FEDEX",
  DHL: "DHL",
  TRENDYOL: "TRENDYOL",
  HEPJET: "HEPJET",
};
