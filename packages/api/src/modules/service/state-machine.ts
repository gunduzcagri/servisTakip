const VALID_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ["INSPECTING", "CANCELLED"],
  INSPECTING: ["PRICE_OFFER", "CANCELLED"],
  PRICE_OFFER: ["APPROVED", "CANCELLED"],
  APPROVED: ["PARTS_WAITING", "REPAIRING", "CANCELLED"],
  PARTS_WAITING: ["REPAIRING", "CANCELLED"],
  REPAIRING: ["QC", "CANCELLED"],
  QC: ["READY", "REPAIRING"],
  READY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Kabul Edildi",
  INSPECTING: "Inceleniyor",
  PRICE_OFFER: "Fiyat Teklifi",
  APPROVED: "Onaylandi",
  CANCELLED: "Iptal Edildi",
  PARTS_WAITING: "Parca Bekleniyor",
  REPAIRING: "Onarimda",
  QC: "Kalite Kontrol",
  READY: "Teslime Hazir",
  DELIVERED: "Teslim Edildi",
};

export function generateTrackingNumber(lastNumber: number): string {
  return `SRV-${String(lastNumber + 1).padStart(5, "0")}`;
}
