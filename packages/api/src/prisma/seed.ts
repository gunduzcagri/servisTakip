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

  // Beyaz Esya Servisi
  await prisma.sectorTemplate.upsert({
    where: { id: "template-appliance" },
    update: {},
    create: {
      id: "template-appliance",
      name: "Beyaz Esya Servisi",
      isSystem: true,
      fields: [
        { key: "brand", label: "Marka", type: "select", options: ["Arcelik", "Beko", "Bosch", "Siemens", "Vestel", "Profilo", "Diger"] },
        { key: "model", label: "Model", type: "text", placeholder: "6144 YS" },
        { key: "product_group", label: "Urun Grubu", type: "select", options: ["Buzdolabi", "Camasir Makinesi", "Bulasik Makinesi", "Firin", "Kurutma Makinesi", "Diger"] },
        { key: "fault_type", label: "Ariza", type: "select", options: ["Sogutmuyor", "Ses yapiyor", "Su akitiyor", "Calismiyor", "Kapi acilmiyor", "Ekran hatasi", "Diger"] },
        { key: "serial_no", label: "Seri No", type: "text" },
        { key: "warranty", label: "Garanti", type: "select", options: ["Yetkili Servis Garantili", "Genisletilmis Garanti", "Garantisi Bitmis"] },
      ],
    },
  });

  // Televizyon Servisi
  await prisma.sectorTemplate.upsert({
    where: { id: "template-tv" },
    update: {},
    create: {
      id: "template-tv",
      name: "Televizyon Servisi",
      isSystem: true,
      fields: [
        { key: "brand", label: "Marka", type: "select", options: ["LG", "Samsung", "Sony", "Philips", "TCL", "Vestel", "Diger"] },
        { key: "model", label: "Model", type: "text" },
        { key: "panel_type", label: "Panel Tipi", type: "select", options: ["OLED", "QLED", "LED", "NanoCell", "LCD"] },
        { key: "screen_size", label: "Ekran Boyutu", type: "select", options: ["32\"", "43\"", "50\"", "55\"", "65\"", "75\"", "85\""] },
        { key: "fault_type", label: "Ariza", type: "select", options: ["Goruntu yok", "Ses yok", "Cizgi var", "Ekran kirik", "Acilmiyor", "Piksel olu", "Diger"] },
      ],
    },
  });

  // Klima / Kombi Servisi
  await prisma.sectorTemplate.upsert({
    where: { id: "template-hvac" },
    update: {},
    create: {
      id: "template-hvac",
      name: "Klima / Kombi Servisi",
      isSystem: true,
      fields: [
        { key: "brand", label: "Marka", type: "select", options: ["Daikin", "Mitsubishi", "Vaillant", "Bosch", "Baymak", "Demirdokum", "Diger"] },
        { key: "model", label: "Model", type: "text" },
        { key: "device_type", label: "Cihaz Tipi", type: "select", options: ["Klima", "Kombi", "Petek", "Termosifon"] },
        { key: "capacity", label: "Kapasite", type: "select", options: ["9000 BTU", "12000 BTU", "18000 BTU", "24000 BTU", "20.000 kcal", "24.000 kcal", "30.000 kcal"] },
        { key: "fault_type", label: "Ariza / Islem", type: "select", options: ["Sogutmuyor", "Isitmiyor", "Su akitiyor", "Gaz kacagi", "Ariza kodu", "Yillik bakim", "Gaz dolumu", "Diger"] },
      ],
    },
  });

  // Otomotiv / LPG Servisi
  await prisma.sectorTemplate.upsert({
    where: { id: "template-auto" },
    update: {},
    create: {
      id: "template-auto",
      name: "Otomotiv / LPG Servisi",
      isSystem: true,
      fields: [
        { key: "brand", label: "Marka", type: "select", options: ["Fiat", "Toyota", "VW", "Renault", "Ford", "Hyundai", "Diger"] },
        { key: "model", label: "Model", type: "text", placeholder: "Egea" },
        { key: "year", label: "Yil", type: "text", placeholder: "2020" },
        { key: "plate", label: "Plaka", type: "text", placeholder: "34 ABC 123" },
        { key: "mileage", label: "Kilometre", type: "text", placeholder: "85.000 km" },
        { key: "fault_type", label: "Ariza", type: "select", options: ["LPG beyni", "Enjektor", "Regulator", "Motor arizasi", "Elektrik arizasi", "Fren sistemi", "Diger"] },
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
