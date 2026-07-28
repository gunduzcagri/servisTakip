# 🔧 Servis Takip Uygulaması — Detaylı Proje Planı

> **Proje Adı Önerisi:** ServisNet / TeknikTakip  
> **Hazırlanma Tarihi:** 2026-07-28  
> **Hedef:** Çok sektörlü, bulut tabanlı, tam entegre servis yönetim platformu

---

## 📋 İçindekiler

1. [Vizyon ve Hedef Kitle](#1-vizyon-ve-hedef-kitlesi)
2. [Kullanıcı Rolleri ve Yetkiler](#2-kullanıcı-rolleri-ve-yetkiler)
3. [Çok Sektörlü Hazır Kurulum Kalıpları](#3-çok-sektörlü-hazır-kurulum-kalıpları)
4. [Müşteri Bilgilendirme Sistemi](#4-müşteri-bilgilendirme-sistemi)
5. [Servis Çalışanları Paneli](#5-servis-çalışanları-paneli-teknisyen-arayüzü)
6. [Müşteri Portalı Detayları](#6-müşteri-portalı-detayları)
7. [Ek Gelişmiş Özellikler](#7-eklenen-gelişmiş-özellikler)
8. [Teknik Mimari Önerisi](#8-teknik-mimari-önerisi)
9. [Geliştirme Aşamaları (Yol Haritası)](#9-geliştirme-aşamaları-yol-haritası)
10. [Başarı Metrikleri (KPI)](#10-başarı-metrikleri-kpi)

---

## 1. Vizyon ve Hedef Kitlesi

| Özellik | Açıklama |
|---------|----------|
| **Vizyon** | Her sektöre uyarlanabilir, bulut tabanlı, tam entegre servis yönetim platformu |
| **Hedef Kitle** | Teknik servisler, yetkili servisler, küçük-orta ölçekli tamir atölyeleri |
| **Platform** | Web + Mobil (Responsive) |

---

## 2. Kullanıcı Rolleri ve Yetkiler

```
┌─────────────────────────────────────────────────────────────┐
│  YÖNETİCİ (Admin)                                           │
│  • Sistem ayarları, sektör kalıpları, kullanıcı yönetimi    │
│  • Raporlar, finansal takip, şube yönetimi                  │
├─────────────────────────────────────────────────────────────┤
│  SERVİS ÇALIŞANI (Teknisyen)                                │
│  • Cihaz kabulü, durum güncelleme, yapılan işlem kaydı      │
│  • Parça kullanımı, fotoğraf yükleme, not ekleme            │
├─────────────────────────────────────────────────────────────┤
│  MÜŞTERİ (Bireysel / Kurumsal)                              │
│  • Durum sorgulama, detay görme, geçmiş servis kayıtları    │
│  • Bildirim tercihleri, değerlendirme, ödeme takibi         │
├─────────────────────────────────────────────────────────────┤
│  KASİYER / SATIŞ PERSONELİ                                  │
│  • Fiyat teklifi, ödeme alma, fatura kesme                  │
│  • Cihaz teslim, garanti belgesi oluşturma                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Çok Sektörlü Hazır Kurulum Kalıpları

Her sektör için önceden tanımlanmış **"Sektör Şablonu"** bulunacak. Yönetici kurulumda sektör seçtiğinde ilgili alanlar otomatik yüklenir. Yönetici kendi sektör şablonunu da oluşturabilir.

### 3.1 Telefon / Tablet Servisi

| Alan | Örnek Değerler |
|------|----------------|
| Marka | Apple, Samsung, Xiaomi, Huawei |
| Model | iPhone 15 Pro, Galaxy S24 |
| Arıza Tipi | Ekran değişimi, batarya, şarj soketi, anakart |
| Parça | OLED ekran, batarya, arka kapak, Taptic Engine |
| Teknik Detay | IMEI, iOS/Android versiyon, şifre (güvenli) |
| Garanti Durumu | Apple Care, Samsung Care+, yetkili dışı |

### 3.2 Beyaz Eşya Servisi

| Alan | Örnek Değerler |
|------|----------------|
| Marka | Arçelik, Beko, Bosch, Siemens |
| Model | 6144 YS Çamaşır Makinesi |
| Ürün Grubu | Buzdolabı, çamaşır mak., bulaşık mak., fırın |
| Arıza | Soğutmuyor, ses yapıyor, su akıtıyor |
| Parça | Kompresör, termostat, kapak contası, motor |
| Garanti | Yetkili, genişletilmiş, bitmiş |

### 3.3 Televizyon Servisi

| Alan | Örnek Değerler |
|------|----------------|
| Marka | LG, Samsung, Sony, Philips |
| Panel Tipi | OLED, QLED, LED, NanoCell |
| Ekran Boyutu | 55\", 65\", 75\" |
| Arıza | Görüntü yok, ses yok, çizgi, piksel ölü |
| Parça | Anakart, T-CON board, power board, panel |

### 3.4 Bilgisayar / Laptop Servisi

| Alan | Örnek Değerler |
|------|----------------|
| Marka | Dell, HP, Lenovo, MacBook |
| İşlemci | i5, i7, Ryzen 5 |
| RAM / Disk | 16GB / 512GB SSD |
| Arıza | Açılmıyor, yavaş, ısınıyor, ekran kararık |
| Parça | Anakart, ekran kartı, batarya, klavye |

### 3.5 Klima / Kombi Servisi

| Alan | Örnek Değerler |
|------|----------------|
| Marka | Daikin, Mitsubishi, Vaillant, Bosch |
| Kapasite | 12000 BTU, 18000 BTU |
| Arıza | Soğutmuyor, su akıtıyor, gaz kaçağı |
| Bakım Tipi | Yıllık bakım, gaz dolumu, filtre değişimi |

### 3.6 Otomotiv / LPG Servisi

| Alan | Örnek Değerler |
|------|----------------|
| Marka | Fiat, Toyota, VW |
| Model / Yıl | Egea / 2020 |
| Plaka | 34 ABC 123 |
| Arıza | LPG beyni, enjektör, regülatör |
| Kilometre | 85.000 km |

> **Önemli Not:** Yönetici kendi sektör şablonunu da oluşturabilir. Alan ekleme / silme / düzenleme tamamen özelleştirilebilir.

---

## 4. Müşteri Bilgilendirme Sistemi

### 4.1 Otomatik Bildirim Kanalları

| Kanal | Kullanım Amacı |
|-------|----------------|
| 📱 **SMS** | Kısa durum mesajları: \"Cihazınız onarıma alındı. Takip No: #12345\" |
| 📧 **E-posta** | Detaylı durum raporu + tahmini teslim tarihi |
| 💬 **WhatsApp** | Otomatik mesaj + durum kartı (rich media) |
| 🔔 **Push Bildirim** | Uygulama içi anlık bildirim |

### 4.2 Bildirim Tetikleyicileri

| Durum | Açıklama |
|-------|----------|
| Kabul Edildi | Cihaz servise alındı |
| İnceleniyor | Teknisyen incelemeye başladı |
| Fiyat Onayı | Onarım maliyeti müşteriye sunuldu |
| Onaylandı | Müşteri onarımı onayladı |
| Parça Bekleniyor | Sipariş verildi, tahmini geliş tarihi |
| Onarımda | Teknisyen tamir ediyor |
| Kalite Kontrol | Test aşamasında |
| Hazır / Teslim | Cihaz alınmaya hazır |
| Kapatıldı | Servis tamamlandı, teslim edildi |

### 4.3 Müşteri Sorgulama Sistemi

- **Takip Numarası** ile sorgulama (giriş yapmadan)
- **Telefon Numarası + SMS Doğrulama** ile sorgulama
- Giriş yapmış müşteriler **tüm geçmiş kayıtlarını** görebilir
- **Canlı durum çubuğu** (adım adım ilerleme görseli)

---

## 5. Servis Çalışanları Paneli (Teknisyen Arayüzü)

### 5.1 Günlük Gösterge Paneli (Dashboard)

```
┌────────────────────────────────────────┐
│  📋 Bugünkü İşlemler: 12             │
│  ⏳ Bekleyen: 3                      │
│  🔧 Onarımda: 5                      │
│  ✅ Tamamlanan: 4                    │
└────────────────────────────────────────┘
```

### 5.2 Teknisyen İş Akışı

1. **Cihaz Kabulü** → Barkod / QR okutarak hızlı kayıt
2. **İlk Tespit** → Arıza tespiti, fotoğraf çekimi
3. **Fiyat Teklifi** → Otomatik fiyat hesaplama, müşteriye onay gönder
4. **Onarım** → Yapılan işlemler, kullanılan parçalar, harcanan süre
5. **Kalite Kontrol** → Test sonuçları, garanti belgesi
6. **Teslimat** → Müşteri imzası, ödeme alma

### 5.3 Teknisyen Özellikleri

| Özellik | Açıklama |
|---------|----------|
| Fotoğraf / Video Ekleme | Cihazın geldiği hali, arıza detayı, onarım sonrası |
| Sesli Not | Teknisyen sesli not bırakabilir |
| Parça Stok Kontrolü | Anlık stok durumu, otomatik düşüm |
| Zaman Takibi | Her aşama için harcanan süre (verimlilik raporu) |

---

## 6. Müşteri Portalı Detayları

### 6.1 Giriş Yapmadan

- Takip numarası ile sadece **durum ve tahmini tarih** görme
- Servis noktası bilgisi ve harita

### 6.2 Giriş Yapmış Müşteri

| Özellik | Açıklama |
|---------|----------|
| Tüm Cihazlarım | Geçmiş ve aktif tüm servis kayıtları |
| Detay Görme | Yapılan işlemler, değişen parçalar, maliyet |
| Fatura & Garanti | PDF indirme, garanti süresi takibi |
| Değerlendirme | Servis sonrası 1-5 yıldız + yorum |
| Tekrar Servis | Aynı cihaz için garanti kapsamında talep |
| Bildirim Tercihleri | SMS / e-posta / Push açma-kapama |

---

## 7. Eklenen Gelişmiş Özellikler

### 7.1 🏷️ Barkod / QR Kod Sistemi

- Her cihaza otomatik **QR + Barkod** üretimi
- Teknisyen telefonuyla okutarak **anında kayıt açma**
- Müşteri QR'yi okutarak **durum sorgulama** (girişsiz)

### 7.2 💰 Otomatik Fiyatlandırma ve Teklif

- Sektöre özel **fiyat listesi** yönetimi
- Parça maliyeti + işçilik = otomatik teklif
- Müşteriye **SMS / e-posta ile onay linki** gönderme
- **Onaylanmadan onarıma başlama engeli** (opsiyonel)

### 7.3 📦 Stok ve Depo Yönetimi

- Parça giriş-çıkış takibi
- Kritik stok uyarısı (örn: \"iPhone ekranı 3 adet kaldı\")
- Tedarikçi yönetimi ve sipariş takibi
- Çok şubeli yapıda **şube bazlı stok**

### 7.4 📊 Raporlama ve Analitik

- Aylık ciro raporu
- En çok gelen arıza tipleri (pasta grafik)
- Teknisyen performans karşılaştırması
- Ortalama onarım süresi
- Müşteri memnuniyeti (NPS skoru)
- Parça maliyet analizi
- Garanti dönüşüm oranı

### 7.5 🔒 Garanti ve Sözleşme Yönetimi

- Otomatik **garanti belgesi** oluşturma (PDF)
- Garanti bitiş tarihi takibi
- Garanti kapsamı dışı / içi otomatik ayırma
- **Garanti uzatma** teklifi (satış fırsatı)

### 7.6 🌐 Çok Şubeli Yapı

- Merkez yönetim + şubeler
- Şube bazlı yetkilendirme
- Şubeler arası **cihaz transferi**
- Merkezi raporlama

### 7.7 🤖 Yapay Zeka Asistanı (Opsiyonel Gelecek Özelliği)

- **Arıza tahmini:** \"iPhone ekranı kararık\" → En olası nedenler
- **Otomatik yönlendirme:** Arıza tipine göre uygun teknisyene atama
- **Tahmini teslim süresi:** Geçmiş verilere dayalı AI tahmini

### 7.8 📱 Mobil Uygulama

- Teknisyenler için **Android / iOS** uygulama
- Offline mod (internet yokken kayıt, sync olduğunda gönder)
- Kamera ile barkod okuma
- Müşteri için **sadece sorgulama uygulaması**

### 7.9 🔗 Entegrasyonlar

| Sistem | Entegrasyon |
|--------|-------------|
| Muhasebe Programı | Logo, Mikro, Zirve (API ile fatura aktarımı) |
| E-İrsaliye / E-Fatura | Gelir İdaresi entegrasyonu |
| SMS Gateway | Netgsm, İleti Merkezi |
| WhatsApp Business API | Otomatik mesaj gönderimi |
| Google Calendar | Randevu entegrasyonu |

### 7.10 👥 Müşteri CRM

- Müşteri kartı (geçmiş alışveriş, servis geçmişi)
- Sadakat puanı sistemi
- Otomatik hatırlatma: \"Telefonunuzun garantisi bitmek üzere\"
- Toplu SMS / e-posta kampanyası

---

## 8. Teknik Mimari Önerisi

```
┌─────────────────────────────────────────────┐
│           PRESENTATION LAYER                │
│  React / Vue.js (Web)  │  Flutter (Mobil)  │
├─────────────────────────────────────────────┤
│              API GATEWAY                    │
│  RESTful API / GraphQL (Node.js / .NET)   │
├─────────────────────────────────────────────┤
│            BUSINESS LOGIC                   │
│  • Servis Yönetimi                          │
│  • Bildirim Motoru                          │
│  • Raporlama Motoru                         │
│  • Yetkilendirme (JWT)                      │
├─────────────────────────────────────────────┤
│              DATA LAYER                     │
│  PostgreSQL (Ana veri)                      │
│  Redis (Cache / Oturum)                     │
│  MinIO / AWS S3 (Fotoğraf/Dosya)          │
├─────────────────────────────────────────────┤
│           INFRASTRUCTURE                    │
│  Docker / Kubernetes (Cloud)              │
│  Nginx (Load Balancer)                    │
└─────────────────────────────────────────────┘
```

---

## 9. Geliştirme Aşamaları (Yol Haritası)

| Faz | Süre | İçerik |
|-----|------|--------|
| **Faz 1 — MVP** | 6-8 hafta | Temel kayıt, durum takibi, SMS bildirim, 2 sektör şablonu |
| **Faz 2 — Genişletme** | 4-6 hafta | Tüm sektör şablonları, müşteri portalı, raporlama |
| **Faz 3 — Mobil** | 4-5 hafta | Teknisyen mobil uygulaması, barkod sistemi |
| **Faz 4 — Entegrasyon** | 3-4 hafta | Muhasebe, e-fatura, WhatsApp entegrasyonu |
| **Faz 5 — İleri** | Sürekli | AI özellikleri, çok şubeli, CRM |

---

## 10. Başarı Metrikleri (KPI)

| Metrik | Hedef |
|--------|-------|
| Ortalama servis süresi | %30 azaltma |
| Müşteri memnuniyet skoru | 4.5 / 5 |
| Teknisyen başına günlük işlem | Artış |
| Fiyat teklif onay oranı | Artış |
| Garanti dönüşüm oranı | Artış |

---
