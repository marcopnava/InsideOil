"use client";

interface Props {
  mmsi: number | string;
  imo?: number | string | null;
  size?: "xs" | "sm";
}

/**
 * Tiny inline buttons that deep-link a vessel to external AIS providers.
 * 100% legal — these are public vessel detail pages, no scraping or embedding.
 *
 * Use next to a vessel name in any table:
 *   <td>{name} <ExternalVesselLinks mmsi={v.mmsi} imo={v.imo} /></td>
 */
export function ExternalVesselLinks({ mmsi, imo, size = "xs" }: Props) {
  const mmsiStr = String(mmsi);
  const imoStr = imo ? String(imo) : null;

  const links = [
    {
      label: "MT",
      title: "MarineTraffic — full vessel detail page (free for browsing)",
      href: `https://www.marinetraffic.com/en/ais/details/ships/mmsi:${mmsiStr}`,
    },
    {
      label: "VF",
      title: "VesselFinder — vessel position and history",
      href: imoStr
        ? `https://www.vesselfinder.com/vessels/details/${imoStr}`
        : `https://www.vesselfinder.com/vessels?name=${mmsiStr}`,
    },
    {
      label: "FM",
      title: "FleetMon — vessel particulars",
      href: `https://www.fleetmon.com/vessels/?s=${mmsiStr}`,
    },
    {
      label: "MST",
      title: "MyShipTracking — open vessel tracker",
      href: `https://www.myshiptracking.com/vessels/mmsi-${mmsiStr}`,
    },
  ];

  const sz = size === "xs" ? "text-[8px] px-1 py-[1px]" : "text-[9px] px-1.5 py-[2px]";

  return (
    <span className="inline-flex items-center gap-[3px] ml-1.5 align-middle">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          title={l.title}
          className={`${sz} font-bold rounded bg-black/6 text-text2 hover:bg-black hover:text-white transition-colors no-underline`}
        >
          {l.label}
        </a>
      ))}
    </span>
  );
}
