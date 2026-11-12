import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

/**
 * Holding shell for the two legal pages while the redesign is in progress.
 * The legal copy itself is untouched. Phase 5 replaces this shell with the
 * chosen direction's layout.
 */
export function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="legal">
      <p className="legal-meta">
        <Link href="/">ADAI Systems</Link>
        <span>Updated {siteConfig.legal.lastUpdated}</span>
      </p>
      <h1>{title}</h1>
      <p className="legal-intro">{intro}</p>
      <div className="legal-body">{children}</div>
    </main>
  );
}
