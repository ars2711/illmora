import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ilmora.ai";

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/login`, lastModified: new Date() },
    { url: `${baseUrl}/dashboard`, lastModified: new Date() },
    { url: `${baseUrl}/chat`, lastModified: new Date() },
    { url: `${baseUrl}/graph`, lastModified: new Date() },
    { url: `${baseUrl}/marketplace`, lastModified: new Date() },
    { url: `${baseUrl}/practice`, lastModified: new Date() },
    { url: `${baseUrl}/upload`, lastModified: new Date() },
  ];
}
