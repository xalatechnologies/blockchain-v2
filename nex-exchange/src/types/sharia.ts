export interface ShariaCompliance {
  isHalal: boolean;
  certification?: string; // AAOIFI, etc.
  complianceNotes?: string[];
  riskLevel: "low" | "medium" | "high";
}

export interface TokenShariaInfo extends ShariaCompliance {
  tokenAddress: string;
  hasRiba: boolean; // Interest-bearing
  hasGharar: boolean; // Excessive uncertainty
  hasMaysir: boolean; // Gambling
  assetBacked: boolean; // Asset-backed (like Dirhamat)
  profitSharing: boolean; // Profit/loss sharing (Musharakah/Mudarabah)
}

export interface ZakatCalculation {
  totalAssets: number;
  nisabThreshold: number; // Equivalent to 85g gold
  zakatAmount: number; // 2.5% of assets above nisab
  eligibleAssets: number;
}

