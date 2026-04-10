// AIS ship type ranges per ITU-R M.1371
export function aisShipTypeName(type: number | null | undefined): string {
  if (type == null) return "Unknown";
  if (type >= 80 && type <= 89) return "Tanker";
  if (type >= 70 && type <= 79) return "Cargo";
  if (type >= 60 && type <= 69) return "Passenger";
  if (type >= 40 && type <= 49) return "High-speed craft";
  if (type >= 30 && type <= 39) return "Fishing";
  if (type === 52) return "Tug";
  if (type === 50) return "Pilot vessel";
  if (type === 51) return "SAR vessel";
  if (type === 55) return "Law enforcement";
  if (type >= 90 && type <= 99) return "Other";
  return "Unknown";
}

export const NAV_STATUS_NAME: Record<number, string> = {
  0: "Under way using engine",
  1: "At anchor",
  2: "Not under command",
  3: "Restricted manoeuvrability",
  4: "Constrained by draught",
  5: "Moored",
  6: "Aground",
  7: "Engaged in fishing",
  8: "Under way sailing",
  15: "Not defined",
};

export function isTanker(shipType: number | null | undefined) {
  return shipType != null && shipType >= 80 && shipType <= 89;
}

export function isCargoVessel(shipType: number | null | undefined) {
  return shipType != null && shipType >= 70 && shipType <= 79;
}

// VLCC heuristic — true tanker class identification needs DWT, but draught and length help.
// AIS doesn't carry DWT, so we use draught >= 17m as a strong VLCC proxy (Suezmax draught ~16m, VLCC 20-22m).
export function isLikelyVLCC(shipType: number | null | undefined, draught: number | null | undefined) {
  return isTanker(shipType) && draught != null && draught >= 17;
}
