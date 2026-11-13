import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/components/site/meta";
import { Cta, Facts, Panel, Shot, Status } from "@/components/site/parts";
import { linksOf, neighboursOf, projects, stevie } from "@/content/projects";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};
  return pageMeta({
    title: project.title,
    description: `${project.pitch} ${project.statusLabel}. ${project.dateLabel}.`,
    path: `/work/${project.slug}`,
    card: project.slug,
  });
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();

  const story = project.story ?? {};
  const [lead, ...rest] = project.media ?? [];
  const phones = project.media?.every((media) => media.type === "phone");
  const related = linksOf(project.slug);
  const { previous, next } = neighboursOf(project.slug);

  return (
    <>
      <header className="case-head">
        <div>
          <p className="crumb">
            <Link href="/">home</Link> / <Link href="/work">work</Link> / {project.slug}
          </p>
          <h1>{project.title}</h1>
          <p className="pitch">{project.pitch}</p>
        </div>
        <dl className="sheet">
          <div>
            <dt>status</dt>
            <dd>
              <Status project={project} />
            </dd>
          </div>
          <div>
            <dt>when</dt>
            <dd>{project.dateLabel.toLowerCase()}</dd>
          </div>
          <div>
            <dt>kind</dt>
            <dd>{project.kindLabel.toLowerCase()}</dd>
          </div>
          <div>
            <dt>stack</dt>
            <dd>{project.stack.join(", ")}</dd>
          </div>
          {project.links?.length ? (
            <div>
              <dt>links</dt>
              <dd className="links" style={{ marginTop: 0 }}>
                {project.links.map((link) => (
                  <a key={link.href} href={link.href}>
                    {link.label} <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </header>

      {lead && !phones ? (
        <div className="block">
          <figure>
            <Shot media={lead} sizes="(min-width: 1536px) 1472px, 95vw" priority />
            {lead.type === "concept" && project.disclosure ? <figcaption>{project.disclosure}</figcaption> : null}
          </figure>
        </div>
      ) : null}

      <div className="block">
        <div className="case-body">
          <section>
            <h2>what it is</h2>
            <p>{project.summary}</p>
          </section>

          {story.problem ? (
            <section>
              <h2>why it exists</h2>
              <p>{story.problem}</p>
            </section>
          ) : null}

          {story.built?.length ? (
            <section>
              <h2>what was built</h2>
              <ul className="points">
                {story.built.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {story.how?.length ? (
            <section>
              <h2>how it works</h2>
              <ul className="points">
                {story.how.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {project.facts?.length ? (
            <section>
              <h2>the numbers</h2>
              <Facts project={project} />
            </section>
          ) : null}
        </div>
      </div>

      {phones || rest.length ? (
        <section className="block reveal" aria-label="Screens">
          <Panel title="screens">
            <div className={phones ? "gallery gallery-phones" : "gallery"}>
              {(phones ? project.media! : rest).map((media) => (
                <figure key={media.src} className={media.type === "phone" ? "phone" : undefined}>
                  <Shot
                    media={media}
                    className=""
                    sizes={phones ? "(min-width: 640px) 14vw, 45vw" : "(min-width: 640px) 46vw, 95vw"}
                  />
                </figure>
              ))}
            </div>
            {project.slug !== "holographic-display" && project.disclosure ? (
              <p className="note">{project.disclosure}</p>
            ) : null}
          </Panel>
        </section>
      ) : null}

      {project.slug === "glimmer" ? (
        <section className="block reveal" aria-labelledby="stevie-title">
          <Panel title="stevie">
            <div className="transcript">
              <div>
                <h2 id="stevie-title" className="display" style={{ fontSize: "clamp(1.75rem, 3.4vw, 3rem)" }}>
                  Meet STEVIE
                </h2>
                <p className="note">
                  Replies to held-out evaluation prompts. Each one is the first sample, unedited, exactly as published
                  in the repository.
                </p>
              </div>
              <dl>
                {stevie.map((exchange) => (
                  <div key={exchange.prompt}>
                    <dt>{exchange.prompt}</dt>
                    <dd>{exchange.reply}</dd>
                  </div>
                ))}
              </dl>
              <div className="gallery">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/work/glimmer/pretrain-loss.svg"
                    alt="STEVIE's pretraining loss curve falling from about 9 to 2.4 over 16,000 steps."
                    width={900}
                    height={420}
                    loading="lazy"
                  />
                </figure>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/work/glimmer/transformer.svg"
                    alt="Diagram of STEVIE's transformer: token embeddings, six pre-norm blocks with rotary attention and SwiGLU, and a tied output head."
                    width={560}
                    height={420}
                    loading="lazy"
                  />
                </figure>
              </div>
            </div>
          </Panel>
        </section>
      ) : null}

      <div className="block">
        <div className="case-body">
          {story.outcome ? (
            <section>
              <h2>where it stands</h2>
              <p>{story.outcome}</p>
            </section>
          ) : null}
          {story.honest?.length ? (
            <section>
              <h2>said plainly</h2>
              <ul className="points points-warn">
                {story.honest.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      {related.length ? (
        <section className="block reveal" aria-label="Linked projects">
          <Panel title="linked to">
            <ul className="related">
              {related.map(({ project: other, why }) => (
                <li key={other.slug}>
                  <Link className="link" href={`/work/${other.slug}`} style={{ justifySelf: "start" }}>
                    {other.title}
                  </Link>
                  <span className="t-dim">{why}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      ) : null}

      <nav className="block pager" aria-label="More projects">
        {previous ? (
          <Link href={`/work/${previous.slug}`}>
            <small>← earlier · {previous.dateLabel.toLowerCase()}</small>
            <strong>{previous.title}</strong>
          </Link>
        ) : null}
        {next ? (
          <Link className="next" href={`/work/${next.slug}`}>
            <small>later · {next.dateLabel.toLowerCase()} →</small>
            <strong>{next.title}</strong>
          </Link>
        ) : null}
      </nav>

      <Cta />
    </>
  );
}
