import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number) => ({ url: `${site.url}${path}`, lastModified: now, priority });
  return [
    page("", 1),
    page("/work", 0.9),
    ...projects.map((project) =>
      page(`/work/${project.slug}`, project.status === "live" || project.status === "active" ? 0.8 : 0.6),
    ),
    page("/research", 0.7),
    page("/studio", 0.7),
    page("/contact", 0.7),
    page("/privacy", 0.2),
    page("/terms", 0.2),
  ];
}
