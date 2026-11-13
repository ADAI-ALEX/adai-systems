import Link from "next/link";
import { LineageMap } from "@/components/site/map";
import { pageMeta } from "@/components/site/meta";
import { Cta, Facts, Links, Panel, Shot, Status } from "@/components/site/parts";
import { Shell } from "@/components/site/shell";
import { counts, domains, featured, getProject, research, selected } from "@/content/projects";
import { copy, site } from "@/content/site";

export const metadata = pageMeta({ description: site.description, path: "/", card: "home" });

const lockout = getProject("lockout");
const glimmer = getProject("glimmer");
const pad = (value: number) => String(value).padStart(2, "0");

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>{site.headline}</h1>
          <p className="lede">{copy.intro}</p>
          <p className="tagline">
            <span aria-hidden="true">▸ </span>
            {site.line}
          </p>
          <p className="actions">
            <Link className="btn btn-solid" href="/work">
              See the work
            </Link>
            <a className="btn" href={`mailto:${site.email}`}>
              Email Alex
            </a>
          </p>
          <dl className="stats">
            <div>
              <dt>projects</dt>
              <dd>{pad(counts.total)}</dd>
            </div>
            <div>
              <dt>running</dt>
              <dd>{pad(counts.running)}</dd>
            </div>
            <div>
              <dt>open source</dt>
              <dd>{pad(counts.openSource)}</dd>
            </div>
            <div>
              <dt>research</dt>
              <dd>{pad(counts.research)}</dd>
            </div>
          </dl>
        </div>
        <Panel title="guest@adai: ~" className="panel-shell">
          <Shell />
        </Panel>
      </section>

      <section className="block reveal" aria-labelledby="now-title">
        <header className="block-head">
          <h2 id="now-title">{copy.now.title}</h2>
          <p>{copy.now.body}</p>
        </header>
        <div className="stack">
          <Panel title="lockout" as="article">
            <div className="split">
              <div>
                <h3>
                  <Link className="title-link" href="/work/lockout">
                    {lockout.title}
                  </Link>
                </h3>
                <p className="meta">
                  <Status project={lockout} /> <span className="t-dim">· {lockout.kindLabel.toLowerCase()}</span>
                </p>
                <p className="pitch">{lockout.pitch}</p>
                <p>{lockout.summary}</p>
                <ul className="points">
                  {lockout.points?.map((point) => <li key={point}>{point}</li>)}
                </ul>
                <Facts project={lockout} />
                <Links project={lockout} caseStudy />
              </div>
              <div className="phones">
                {lockout.media?.slice(0, 3).map((shot) => (
                  <Shot key={shot.src} media={shot} className="" sizes="(min-width: 992px) 15vw, 30vw" />
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="glimmer" as="article">
            <div className="lead-shot">
              <Shot media={glimmer.media![0]} sizes="(min-width: 1536px) 1440px, 95vw" />
              <div className="split">
                <div>
                  <h3>
                    <Link className="title-link" href="/work/glimmer">
                      {glimmer.title}
                    </Link>
                  </h3>
                  <p className="meta">
                    <Status project={glimmer} /> <span className="t-dim">· {glimmer.kindLabel.toLowerCase()}</span>
                  </p>
                  <p className="pitch">{glimmer.pitch}</p>
                  <p>{glimmer.summary}</p>
                </div>
                <div>
                  <Facts project={glimmer} />
                  <ul className="points">
                    {glimmer.points?.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                  <p className="note">{glimmer.disclosure}</p>
                  <Links project={glimmer} caseStudy />
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <section className="block reveal" aria-labelledby="work-title">
        <header className="block-head">
          <h2 id="work-title">{copy.work.title}</h2>
          <p>{copy.work.body}</p>
        </header>
        <Panel title="jeb-depot" as="article">
          <div className="split split-wide">
            <Shot media={featured.media![0]} sizes="(min-width: 992px) 58vw, 95vw" />
            <div>
              <h3>
                <Link className="title-link" href="/work/jeb-depot">
                  {featured.title}
                </Link>
              </h3>
              <p className="meta">
                <Status project={featured} /> <span className="t-dim">· {featured.dateLabel.toLowerCase()}</span>
              </p>
              <p className="pitch">{featured.pitch}</p>
              <p>{featured.summary}</p>
              <Facts project={featured} />
              <p className="note">{featured.disclosure}</p>
              <Links project={featured} caseStudy />
            </div>
          </div>
        </Panel>
        <Panel title="more">
          <ul className="rows">
            {selected.map((project) => (
              <li key={project.slug}>
                <h3>
                  <Link className="title-link" href={`/work/${project.slug}`}>
                    {project.title}
                  </Link>
                </h3>
                <p className="meta">
                  <Status project={project} />
                </p>
                <p>{project.pitch}</p>
                <p className="stack-line">{project.stack.join(" · ")}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <section className="block reveal" aria-labelledby="map-title">
        <header className="block-head">
          <h2 id="map-title">How one thing led to the next</h2>
          <p>
            {counts.total} projects since {site.founded}. Each line is the reason one led to another.
          </p>
        </header>
        <Panel title="lineage">
          <LineageMap />
        </Panel>
        <Link className="btn more" href="/work">
          Open the full archive →
        </Link>
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

      <section className="block reveal" aria-labelledby="research-title">
        <header className="block-head">
          <h2 id="research-title">{copy.research.title}</h2>
          <p>{copy.research.body}</p>
        </header>
        <div className="cards">
          {research.map((project) => (
            <Panel key={project.slug} title={project.slug} as="article">
              <h3>
                <Link className="title-link" href={`/work/${project.slug}`}>
                  {project.title}
                </Link>
              </h3>
              <p className="meta">
                <Status project={project} /> <span className="t-dim">· {project.dateLabel.toLowerCase()}</span>
              </p>
              <p>{project.pitch}</p>
            </Panel>
          ))}
        </div>
        <Link className="btn more" href="/research">
          Read the research →
        </Link>
      </section>

      <Cta />
    </>
  );
}

