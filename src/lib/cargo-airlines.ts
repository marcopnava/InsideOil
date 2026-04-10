/**
 * ICAO callsign prefixes of operators with significant pure-cargo or combi fleets.
 * Source: ICAO Doc 8585 (operator designators) — public.
 *
 * This list is intentionally conservative: only operators where the MAJORITY
 * of flights are freight or where the airline has a dedicated cargo division
 * with its own ICAO prefix.
 */
export const CARGO_AIRLINE_ICAO: Record<string, string> = {
  // Integrators (express)
  FDX: "FedEx Express",
  FX: "FedEx Express",
  UPS: "UPS Airlines",
  DHL: "DHL Aviation",
  DHK: "DHL Air UK",
  DAE: "DHL Aero Expreso",
  ABW: "AirBridgeCargo",
  CKS: "Kalitta Air",
  CKK: "Kalitta Charters",
  CLX: "Cargolux",
  CV: "Cargolux",
  GTI: "Atlas Air",
  GSS: "Atlas Air (charter)",
  PAC: "Polar Air Cargo",
  ABX: "ABX Air",
  ATN: "Air Transport International",
  CMP: "Compass Cargo",
  // Asia
  CAO: "Air China Cargo",
  CKE: "China Cargo Airlines",
  CSS: "China Postal Airlines",
  YZR: "YTO Cargo Airlines",
  SQC: "Singapore Airlines Cargo",
  CPA: "Cathay Pacific Cargo",
  HKC: "Air Hong Kong",
  ANA: "All Nippon Airways Cargo",
  NCA: "Nippon Cargo Airlines",
  KAC: "Korean Air Cargo",
  AAR: "Asiana Cargo",
  EVA: "EVA Air Cargo",
  CAL: "China Airlines Cargo",
  THY: "Turkish Cargo",
  // Middle East
  UAE: "Emirates SkyCargo",
  QTR: "Qatar Airways Cargo",
  ETD: "Etihad Cargo",
  SVA: "Saudia Cargo",
  // Europe
  GEC: "Lufthansa Cargo",
  GTI2: "Atlas Air",
  ICE: "Icelandair Cargo",
  MPH: "Martinair Cargo",
  AFL: "AeroLogic",
  BOX: "AeroLogic",
  ASL: "ASL Airlines",
  ABR: "ASL Airlines Belgium",
  // Russia / CIS
  VDA: "Volga-Dnepr",
  ABS: "Air Bridge Cargo (RU)",
  RCH: "Reach (US Air Mobility)",
  // Africa / LatAm
  ETH: "Ethiopian Cargo",
  MSS: "MASkargo",
  TPA: "Tampa Cargo",
  CMV: "Centurion Air Cargo",
  // Other significant cargo
  GIA: "Garuda Cargo",
  MAS: "MASkargo",
  KAL: "Korean Air Cargo",
  TAY: "TNT Airways",
  TNT: "TNT",
  NPT: "West Atlantic UK",
  NCR: "National Air Cargo",
  ICV: "Cargolux Italia",
  CLI: "Cargolux Italia",
  CLU: "Cargolux",
  AYC: "Finnair Cargo",
  WGN: "Western Global Airlines",
  AJK: "Allied Air",
  SOO: "Southern Air",
};

export function isCargoCallsign(callsign: string | null | undefined): boolean {
  if (!callsign) return false;
  const cs = callsign.trim().toUpperCase();
  if (cs.length < 3) return false;
  // ICAO callsigns are 3-letter prefix + flight number, e.g. "FDX1234"
  // Test the longest prefixes first to avoid e.g. "FX" matching FedEx mainline.
  for (let len = 3; len >= 2; len--) {
    const prefix = cs.slice(0, len);
    if (CARGO_AIRLINE_ICAO[prefix]) return true;
  }
  return false;
}
