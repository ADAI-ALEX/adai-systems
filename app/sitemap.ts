import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: siteConfig.url, lastModified: now, priority: 1 },
    ...projects.map((project) => ({
      url: `${siteConfig.url}/work/${project.id}`,
      lastModified: now,
      priority: project.status === "active" ? 0.8 : 0.6,
    })),
    { url: `${siteConfig.url}/privacy`, lastModified: now, priority: 0.2 },
    { url: `${siteConfig.url}/terms`, lastModified: now, priority: 0.2 },
  ];
}
