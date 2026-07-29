import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed basliyor...");

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { id: "default-branch" },
    update: {},
    create: {
      id: "default-branch",
      name: "Merkez Sube",
      address: "Ana Sube Adresi",
      phone: "0212 123 45 67",
      isHeadquarters: true,
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@servisnet.com" },
    update: {},
    create: {
      email: "admin@servisnet.com",
      passwordHash: adminPassword,
      fullName: "Sistem Yoneticisi",
      phone: "0555 111 22 33",
      role: UserRole.ADMIN,
      branchId: branch.id,
    },
  });

  // Create technician user
  const techPassword = await bcrypt.hash("tech123", 10);
  await prisma.user.upsert({
    where: { email: "teknisyen@servisnet.com" },
    update: {},
    create: {
      email: "teknisyen@servisnet.com",
      passwordHash: techPassword,
      fullName: "Ahmet Teknisyen",
      phone: "0555 222 33 44",
      role: UserRole.TECHNICIAN,
      branchId: branch.id,
    },
  });

  const custPassword = await bcrypt.hash("musteri123", 10);
  await prisma.user.upsert({
    where: { email: "musteri@servisnet.com" },
    update: {},
    create: {
      email: "musteri@servisnet.com",
      passwordHash: custPassword,
      fullName: "Mehmet Musteri",
      phone: "0555 333 44 55",
      role: UserRole.CUSTOMER,
    },
  });

  // Sector templates
  await prisma.sectorTemplate.upsert({
    where: { id: "template-phone" },
    update: {},
    create: {
      id: "template-phone",
      name: "Telefon / Tablet Servisi",
      isSystem: true,
      fields: [
        { key: "brand", label: "Marka", type: "select", options: ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "Diger"] },
        { key: "model", label: "Model", type: "text", placeholder: "iPhone 15 Pro" },
        { key: "fault_type", label: "Ariza Tipi", type: "select", options: ["Ekran degisimi", "Batarya", "Sarj soketi", "Anakart", "Kamera", "Ses", "Diger"] },
        { key: "imei", label: "IMEI", type: "text" },
        { key: "os_version", label: "iOS / Android Versiyon", type: "text" },
        { key: "warranty_status", label: "Garanti Durumu", type: "select", options: [" Yetkili Servis Garantili", "Garanti Disi", "Apple Care", "Samsung Care+"] },
        { key: "device_password", label: "Cihaz Sifresi (Guvenli)", type: "password" },
      ],
    },
  });

  await prisma.sectorTemplate.upsert({
    where: { id: "template-computer" },
    update: {},
    create: {
      id: "template-computer",
      name: "Bilgisayar / Laptop Servisi",
      isSystem: true,
      fields: [
        { key: "brand", label: "Marka", type: "select", options: ["Dell", "HP", "Lenovo", "MacBook", "Asus", "Acer", "Diger"] },
        { key: "model", label: "Model", type: "text", placeholder: "ThinkPad X1 Carbon" },
        { key: "processor", label: "Islemci", type: "select", options: ["i3", "i5", "i7", "i9", "Ryzen 3", "Ryzen 5", "Ryzen 7", "M1", "M2", "M3"] },
        { key: "ram", label: "RAM", type: "text", placeholder: "16GB" },
        { key: "storage", label: "Disk", type: "text", placeholder: "512GB SSD" },
        { key: "fault_type", label: "Ariza Tipi", type: "select", options: ["Acilmiyor", "Yavas", "Isiniyor", "Ekran kararik", "Klavye arizasi", "Pil bitmesi", "Diger"] },
      ],
    },
  });

  console.log("Seed tamamlandi.");
  console.log("");
  console.log("Test hesaplari:");
  console.log("  Admin:      admin@servisnet.com / admin123");
  console.log("  Teknisyen:  teknisyen@servisnet.com / tech123");
  console.log("  Musteri:    musteri@servisnet.com / musteri123");
  console.log("");
  console.log("Takip No (demo): SRV-00001 (olusturulduysa)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
