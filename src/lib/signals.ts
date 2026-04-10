/**
 * Aggregator: computes all institutional signals and persists snapshots so the
 * UI never has to wait on slow on-demand calculation.
 */

import { db } from "@/lib/db";
import { detectFloatingStorage } from "@/lib/floating-storage";
import { computeContangoArb } from "@/lib/contango-arb";
import { computeOpecCompliance } from "@/lib/opec-compliance";
import { getLatestCurve, curveStructure } from "@/lib/forward-curve";
import { getLatestBDTI } from "@/lib/bdti";
import { computeChokepointFlow } from "@/lib/chokepoints";

export async function computeAndStoreSignals() {
  const generatedAt = new Date();

  const [storage, arbBrent, arbWti, opec, brentCurve, wtiCurve, bdti, chokepoints] = await Promise.all([
    detectFloatingStorage().catch((e) => ({ error: String(e) })),
    computeContangoArb("BRENT").catch((e) => ({ error: String(e) })),
    computeContangoArb("WTI").catch((e) => ({ error: String(e) })),
    computeOpecCompliance().catch((e) => ({ error: String(e) })),
    getLatestCurve("BRENT").catch(() => []),
    getLatestCurve("WTI").catch(() => []),
    getLatestBDTI().catch(() => null),
    computeChokepointFlow().catch((e) => ({ error: String(e) })),
  ]);

  const brentStructure = brentCurve.length > 0 ? curveStructure(brentCurve) : null;
  const wtiStructure = wtiCurve.length > 0 ? curveStructure(wtiCurve) : null;

  const payload = {
    storage,
    arbitrage: { brent: arbBrent, wti: arbWti },
    opec,
    structure: { brent: brentStructure, wti: wtiStructure },
    bdti,
    chokepoints,
  };

  await db.signalSnapshot.create({
    data: {
      type: "COMPOSITE",
      payload: payload as object,
      generatedAt,
    },
  });

  return { stored: true, generatedAt: generatedAt.toISOString() };
}

export async function getLatestSignals() {
  const row = await db.signalSnapshot.findFirst({
    where: { type: "COMPOSITE" },
    orderBy: { generatedAt: "desc" },
  });
  return row;
}
