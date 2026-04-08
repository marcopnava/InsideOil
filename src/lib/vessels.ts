import { db } from "@/lib/db";
import type { Vessel, Port, ShippingRoute } from "@prisma/client";

export type VesselWithRelations = Vessel & {
  route: (ShippingRoute & { originPort: Port; destPort: Port }) | null;
  originPort: Port | null;
  destPort: Port | null;
};

export async function getVessels(): Promise<VesselWithRelations[]> {
  return db.vessel.findMany({
    include: {
      route: { include: { originPort: true, destPort: true } },
      originPort: true,
      destPort: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getVesselById(
  id: string
): Promise<VesselWithRelations | null> {
  return db.vessel.findUnique({
    where: { id },
    include: {
      route: { include: { originPort: true, destPort: true } },
      originPort: true,
      destPort: true,
    },
  });
}

/** Simulate vessel movement — called periodically */
export async function tickVesselPositions(): Promise<void> {
  const vessels = await db.vessel.findMany({
    where: { status: { in: ["IN_TRANSIT", "DELAYED"] } },
    include: { route: true },
  });

  for (const v of vessels) {
    if (!v.route || v.progress == null) continue;

    const waypoints = v.route.waypoints as number[][];
    const speedFactor = v.isDelayed ? 0.3 : 1;
    const newProgress = Math.min(
      1,
      v.progress + 0.0002 * speedFactor // ~0.02% per tick
    );

    // Interpolate position along waypoints
    const totalSegs = waypoints.length - 1;
    const segFloat = newProgress * totalSegs;
    const segIdx = Math.min(Math.floor(segFloat), totalSegs - 1);
    const segProgress = segFloat - segIdx;

    const lng =
      waypoints[segIdx][0] +
      (waypoints[segIdx + 1][0] - waypoints[segIdx][0]) * segProgress;
    const lat =
      waypoints[segIdx][1] +
      (waypoints[segIdx + 1][1] - waypoints[segIdx][1]) * segProgress;

    const heading =
      (Math.atan2(
        waypoints[segIdx + 1][0] - waypoints[segIdx][0],
        waypoints[segIdx + 1][1] - waypoints[segIdx][1]
      ) *
        180) /
      Math.PI;

    const status = newProgress >= 0.98 ? "ARRIVING" : v.status;

    await db.vessel.update({
      where: { id: v.id },
      data: {
        lat,
        lng,
        heading: ((heading % 360) + 360) % 360,
        progress: newProgress,
        status,
      },
    });

    // Save snapshot
    await db.vesselSnapshot.create({
      data: { vesselId: v.id, lat, lng, speed: v.speed, heading },
    });
  }
}
