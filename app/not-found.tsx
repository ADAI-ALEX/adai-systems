import type { Metadata } from "next";
import Link from "next/link";
import { SiteFrame } from "@/components/site/frame";
import { Panel } from "@/components/site/parts";
import { byDateDesc } from "@/content/projects";
import "./(site)/site.css";

export const metadata: Metadata = { title: "Not found", robots: { index: false } };

export default function NotFound() {
  return (
    <SiteFrame>
      <header className="page-head">
        <p className="crumb">
          <span className="t-warn">404</span> / no such file or directory
        </p>
        <h1>Nothing here.</h1>
        <p className="lede">That address does not match anything the studio has published. Everything that exists is below.</p>
        <p className="actions">
          <Link className="btn btn-solid" href="/">
            Go home
          </Link>
          <Link className="btn" href="/work">
            Open the archive
          </Link>
        </p>
      </header>
      <section className="block" aria-label="Every project">
        <Panel title="ls work/">
          <ul className="rows">
            {byDateDesc.map((project) => (
              <li key={project.slug}>
                <h3>
                  <Link className="title-link" href={`/work/${project.slug}`}>
                    {project.title}
                  </Link>
                </h3>
                <p className="meta t-dim">{project.dateLabel.toLowerCase()}</p>
                <p>{project.pitch}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </section>
    </SiteFrame>
  );
}
