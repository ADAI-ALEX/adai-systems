import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site/frame";
import { Arrow } from "@/components/site/parts";
import { byDateDesc } from "@/content/projects";
import "./(site)/site.css";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false },
};

/* This page has no stylesheet of its own: it reuses the shared classes, and the few rules it needs are inline. */
const list = {
  columns: "19rem 3",
  columnGap: "clamp(1.5rem, 4vw, 3rem)",
  borderTop: "1px solid var(--line)",
} as const;
const row = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "1rem",
  minHeight: "3rem",
  padding: "0.75rem 0",
  borderBottom: "1px solid var(--line)",
} as const;

export default function NotFound() {
  return (
    <SiteFrame>
      <header className="wrap page-head">
        <h1>Not here.</h1>
        <p className="lede">This page does not exist, or it has moved. Everything the studio has made is listed below.</p>
        <div className="actions" style={{ marginTop: "2rem" }}>
          <Link className="btn btn-primary" href="/">
            Home <Arrow />
          </Link>
          <Link className="btn" href="/work">
            See the work
          </Link>
        </div>
      </header>

      <nav className="section wrap" aria-label="Every project">
        <ul style={list}>
          {byDateDesc.map((project) => (
            <li key={project.slug} data-hue={project.aspect} style={{ breakInside: "avoid" }}>
              <Link href={`/work/${project.slug}`} style={row}>
                <span style={{ display: "inline-flex", alignItems: "baseline", gap: "0.75rem", fontWeight: 560 }}>
                  <span
                    aria-hidden="true"
                    style={{ flex: "none", width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "var(--hue)" }}
                  />
                  {project.title}
                </span>
                <span className="meta" style={{ whiteSpace: "nowrap" }}>
                  {project.dateLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </SiteFrame>
  );
}
