/**
 * OPEC+ production quotas (kb/d) — last published reference targets.
 * Update manually as the OPEC+ JMMC announces new targets.
 *
 * Source: OPEC monthly press releases (public).
 * Last update: 2026-02 ministerial decision.
 */
export interface OpecQuota {
  country: string;
  flagPrefix: string[]; // AIS country flag codes (MMSI MID)
  quotaKbd: number; // thousand barrels per day
  loadingTerminals: string[]; // OilTerminal.id whitelist
}

export const OPEC_QUOTAS: OpecQuota[] = [
  { country: "Saudi Arabia", flagPrefix: ["SA"], quotaKbd: 9_000, loadingTerminals: ["RAS_TANURA", "JUAYMAH", "YANBU"] },
  { country: "Iraq",         flagPrefix: ["IQ"], quotaKbd: 4_000, loadingTerminals: ["BASRA"] },
  { country: "UAE",          flagPrefix: ["AE"], quotaKbd: 3_220, loadingTerminals: ["JEBEL_DHANNA", "FUJAIRAH"] },
  { country: "Kuwait",       flagPrefix: ["KW"], quotaKbd: 2_413, loadingTerminals: ["MINA_AL_AHMADI"] },
  { country: "Iran",         flagPrefix: ["IR"], quotaKbd: 3_300, loadingTerminals: ["KHARG"] }, // exempt but tracked
  { country: "Russia",       flagPrefix: ["RU"], quotaKbd: 9_500, loadingTerminals: ["UST_LUGA", "PRIMORSK", "NOVOROSSIYSK", "KOZMINO"] },
  { country: "Nigeria",      flagPrefix: ["NG"], quotaKbd: 1_500, loadingTerminals: ["BONNY", "FORCADOS", "ESCRAVOS"] },
  { country: "Angola",       flagPrefix: ["AO"], quotaKbd: 1_110, loadingTerminals: ["SOYO"] },
  { country: "Congo",        flagPrefix: ["CG"], quotaKbd: 277,   loadingTerminals: ["DJENO"] },
  { country: "Venezuela",    flagPrefix: ["VE"], quotaKbd: 800,   loadingTerminals: ["JOSE"] }, // exempt
];

/**
 * Estimated cargo size assumptions for loading-detection scoring.
 * VLCC ≈ 2.0 Mbbl, Suezmax ≈ 1.0 Mbbl, Aframax ≈ 0.7 Mbbl.
 * From draught (proxy for class):
 *   ≥17m → VLCC
 *   ≥14m → Suezmax
 *   else → Aframax/Panamax
 */
export function tankerCargoBbl(draught: number | null | undefined): number {
  if (draught == null) return 1_000_000; // default Suezmax
  if (draught >= 17) return 2_000_000;
  if (draught >= 14) return 1_000_000;
  return 700_000;
}
