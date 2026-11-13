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
    <>
      <header className="page-head">
        <p className="crumb">
          <Link href="/">home</Link> / legal · updated {siteConfig.legal.lastUpdated}
        </p>
        <h1>{title}</h1>
        <p className="lede">{intro}</p>
      </header>
      <div className="block">
        <div className="prose">{children}</div>
      </div>
    </>
  );
}
