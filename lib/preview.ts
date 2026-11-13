import { notFound } from "next/navigation";

/**
 * Guards pages that exist for review only (the three directions, the share
 * card renderer). They build on preview deployments and locally, and return
 * 404 in production.
 */
export function previewOnly() {
  if (process.env.VERCEL_ENV === "production") notFound();
}
