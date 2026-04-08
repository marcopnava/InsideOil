import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/trade/", "/tracking/", "/briefing/"],
      },
    ],
    sitemap: "https://insideoil.it/sitemap.xml",
  };
}
