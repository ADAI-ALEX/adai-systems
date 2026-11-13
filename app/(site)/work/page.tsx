import Link from "next/link";
import { Archive } from "@/components/site/archive";
import { pageMeta } from "@/components/site/meta";
import { Cta, Panel } from "@/components/site/parts";
import { byDate, counts, domains, getProject } from "@/content/projects";
import { copy, site } from "@/content/site";

export const metadata = pageMeta({
  title: "The archive",
  description: `Every project ADAI Systems has built since ${site.founded}: products, demos, tools and research, in the order it happened.`,
  path: "/work",
  card: "work",
});

export default function WorkPage() {
  return (
    <>
      <header className="page-head">
        <p className="crumb">
          <Link href="/">home</Link> / work
        </p>
        <h1>{copy.archive.title}</h1>
        <p className="lede">{copy.archive.body}</p>
      </header>

      <section className="block" aria-label="Lineage">
        <Panel title="lineage">
          <ol className="lineage">
            {byDate.map((project) => (
              <li key={project.slug}>{project.chapter.toLowerCase()}</li>
            ))}
          </ol>
        </Panel>
        <Panel title={`ls -lt work/  (${counts.total})`}>
          <Archive />
        </Panel>
      </section>

      <section className="block reveal" aria-labelledby="domains-title">
        <header className="block-head">
          <h2 id="domains-title">{copy.domains.title}</h2>
          <p>{copy.domains.body}</p>
        </header>
        <Panel title="domains">
          <ul className="gauges">
            {domains.map((domain) => (
              <li key={domain.label}>
                <span>{domain.label.toLowerCase()}</span>
                <span className="gauge-bar" aria-hidden="true">
                  {"█".repeat(domain.slugs.length)}
                  <i>{"░".repeat(4 - domain.slugs.length)}</i>
                </span>
                <span className="gauge-proof t-dim">
                  {domain.slugs.map((slug, index) => (
                    <span key={slug}>
                      {index ? ", " : ""}
                      <Link href={`/work/${slug}`}>{getProject(slug).title}</Link>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Cta />
    </>
  );
}
