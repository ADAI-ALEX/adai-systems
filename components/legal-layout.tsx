import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

/** Shared shell for the two legal pages. The wording lives in the pages themselves. */
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
    <div className="wrap">
      <header className="page-head">
        <p className="meta crumb">
          <Link href="/">Home</Link> / Legal · Updated {siteConfig.legal.lastUpdated}
        </p>
        <h1>{title}</h1>
        <p className="lede">{intro}</p>
      </header>
      <div className="prose" style={{ marginTop: "3rem" }}>
        {children}
      </div>
    </div>
  );
}
