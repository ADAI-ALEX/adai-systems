import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/components/site/meta";
import {
  Arrow,
  Cta,
  Facts,
  Links,
  Shot,
  Status,
} from "@/components/site/parts";
import { Player } from "@/components/site/video";
import { Gallery } from "@/components/site/work/gallery";
import { Stevie } from "@/components/site/work/stevie";
import {
  linksOf,
  neighboursOf,
  projects,
  type Media,
  type Project,
} from "@/content/projects";
import { getService } from "@/content/services";
// The video player is styled in home.css.
import "../../home.css";
import "./case.css";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

function find(slug: string): Project {
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  return project;
}

export async function generateMetadata({ params }: Params) {
  const project = find((await params).slug);
  return pageMeta({
    title: project.title,
    description: `${project.pitch} ${project.kindLabel}, ${project.dateLabel}.`,
    path: `/work/${project.slug}`,
    card: project.slug,
  });
}

/** Picks the lead: the video, else the first image that is not a phone capture, else a row of phones. */
function lead(project: Project): {
  kind: "video" | "image" | "phones" | "none";
  image?: Media;
  phones?: Media[];
  rest: Media[];
} {
  const media = project.media ?? [];
  if (project.video) return { kind: "video", rest: media };
  const image = media.find((item) => item.type !== "phone");
  if (image)
    return {
      kind: "image",
      image,
      rest: media.filter((item) => item !== image),
    };
  if (media.length)
    return { kind: "phones", phones: media.slice(0, 3), rest: media.slice(3) };
  return { kind: "none", rest: [] };
}

export default async function CasePage({ params }: Params) {
  const project = find((await params).slug);
  const { story = {}, aspect } = project;
  const service = aspect ? getService(aspect) : null;
  const top = lead(project);
  const captioned =
    top.image?.type === "concept" && Boolean(project.disclosure);
  const linked = linksOf(project.slug);
  const { previous, next } = neighboursOf(project.slug);
  const glimmer = project.slug === "glimmer";
  const tall = top.image ? top.image.width / top.image.height < 1.3 : false;

  const rows: { id: string; title: string; body: ReactNode }[] = [];
  rows.push({
    id: "what",
    title: "What it is",
    body: <p className="cs-big">{project.summary}</p>,
  });
  if (story.problem)
    rows.push({
      id: "why",
      title: "Why it exists",
      body: <p>{story.problem}</p>,
    });
  if (story.built?.length) {
    rows.push({
      id: "built",
      title: "What was built",
      body: (
        <ul className="ticks cs-list">
          {story.built.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ),
    });
  }
  if (story.how?.length) {
    rows.push({
      id: "how",
      title: "How it works",
      body: (
        <>
          {story.how.length === 1 ? (
            <p>{story.how[0]}</p>
          ) : (
            <ol className="cs-steps">
              {story.how.map((line, at) => (
                <li key={line}>
                  <span className="meta" aria-hidden="true">
                    {String(at + 1).padStart(2, "0")}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ol>
          )}
          {glimmer ? (
            <figure className="cs-figure cs-figure-narrow">
              <Image
                src="/work/glimmer/transformer.svg"
                alt="Diagram of the decoder-only transformer behind STEVIE: token ids pass through an 8,192 by 384 token embedding, then six transformer blocks, each RMSNorm, causal self-attention with 6 heads of 64, RMSNorm and a SwiGLU feed-forward layer from 384 to 1,024 and back, with residual connections. A final RMSNorm feeds a language-model head tied to the embedding. 13.8M parameters, a 512-token context, an 8,192-token vocabulary, f32 on Metal."
                width={760}
                height={720}
                unoptimized
              />
            </figure>
          ) : null}
        </>
      ),
    });
  }
  if (project.facts?.length) {
    rows.push({
      id: "numbers",
      title: "The numbers",
      body: (
        <>
          <Facts project={project} />
          {glimmer ? (
            <figure className="cs-figure">
              <Image
                src="/work/glimmer/pretrain-loss.svg"
                alt="Chart of STEVIE's pretraining loss against optimiser step on an M1 Pro GPU (13.8M parameters, 131M tokens). The training loss falls steeply from about 9 in the first few hundred steps. From there it and the validation loss flatten out together, ending near 2.4 after more than 15,000 steps."
                width={900}
                height={420}
                unoptimized
              />
            </figure>
          ) : null}
        </>
      ),
    });
  }
  if (story.outcome)
    rows.push({
      id: "stands",
      title: "Where it stands",
      body: <p className="cs-big">{story.outcome}</p>,
    });
  if (story.honest?.length) {
    rows.push({
      id: "plainly",
      title: "Said plainly",
      body: (
        <ul className="ticks cs-list cs-honest">
          {story.honest.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ),
    });
  }

  return (
    <article className="cs" data-hue={aspect}>
      <header className="wrap page-head cs-head">
        <p className="meta crumb">
          <Link href="/">Home</Link> / <Link href="/work">Work</Link> /{" "}
          <span aria-current="page">{project.title}</span>
        </p>
        <h1>{project.title}</h1>
        <p className="cs-pitch">{project.pitch}</p>

        <dl className="cs-sheet">
          <div>
            <dt className="meta">Status</dt>
            <dd>
              <Status project={project} />
            </dd>
          </div>
          <div>
            <dt className="meta">When</dt>
            <dd>{project.dateLabel}</dd>
          </div>
          <div>
            <dt className="meta">Kind</dt>
            <dd>{project.kindLabel}</dd>
          </div>
          <div className="cs-sheet-stack">
            <dt className="meta">Stack</dt>
            <dd>
              <ul className="tags">
                {project.stack.map((item) => (
                  <li className="tag" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          {project.links?.length ? (
            <div className="cs-sheet-links">
              <dt className="meta">Links</dt>
              <dd>
                <Links project={project} />
              </dd>
            </div>
          ) : null}
        </dl>

        {service ? (
          <Link className="cs-service" href={`/services/${service.path}`}>
            <span className="cs-service-dot" aria-hidden="true" />
            <span>
              <strong>{service.title}</strong>{" "}
              <span className="mute">{service.promise}</span>
            </span>
            <Arrow />
          </Link>
        ) : null}
      </header>

      <section className="wrap cs-lead" aria-label="Media">
        {top.kind === "video" && project.video ? (
          <Player video={project.video} />
        ) : null}

        {top.kind === "image" && top.image ? (
          <figure className={tall ? "cs-stage" : "frame"}>
            <Shot
              media={top.image}
              priority
              sizes={
                tall
                  ? "(min-width: 960px) 40vw, 92vw"
                  : "(min-width: 1440px) 1340px, 94vw"
              }
            />
            {captioned ? <figcaption>{project.disclosure}</figcaption> : null}
          </figure>
        ) : null}

        {top.kind === "phones" && top.phones ? (
          <div className="cs-stage cs-stage-phones phones">
            {top.phones.map((shot, at) => (
              <Shot
                key={shot.src}
                media={shot}
                priority={at === 0}
                sizes="(min-width: 960px) 18vw, 28vw"
              />
            ))}
          </div>
        ) : null}

        {top.kind === "none" ? (
          <div className="cs-plate" aria-hidden="true">
            <span className="meta">{project.kindLabel}</span>
            <span className="cs-plate-word display">{project.chapter}</span>
          </div>
        ) : null}

        {project.disclosure && !captioned ? (
          <p className="cs-note">{project.disclosure}</p>
        ) : null}
      </section>

      <div className="wrap cs-story">
        {rows.map((row) => (
          <section
            className="cs-row rise"
            key={row.id}
            aria-labelledby={`cs-${row.id}`}
          >
            <h2 id={`cs-${row.id}`}>{row.title}</h2>
            <div className="cs-row-body">{row.body}</div>
          </section>
        ))}
      </div>

      {glimmer ? (
        <section className="section wrap rise" aria-labelledby="stevie-title">
          <header className="section-head">
            <h2 id="stevie-title">Ask STEVIE</h2>
            <p className="lede">
              Glimmer&apos;s first model. 13.8 million parameters, trained from
              scratch on one 16 GB MacBook Pro.
            </p>
          </header>
          <Stevie />
        </section>
      ) : null}

      {top.rest.length ? (
        <section className="section wrap rise" aria-labelledby="screens-title">
          <header className="cs-gallery-head">
            <h2 id="screens-title">
              {top.kind === "none" ? "Screens" : "More screens"}
            </h2>
            <p className="meta">
              {top.rest.length} {top.rest.length === 1 ? "capture" : "captures"}
              . Select one to see it larger.
            </p>
          </header>
          <Gallery items={top.rest} title={project.title} />
        </section>
      ) : null}

      {linked.length ? (
        <section className="section wrap rise" aria-labelledby="linked-title">
          <header className="cs-gallery-head">
            <h2 id="linked-title">Connected work</h2>
            <p className="meta">
              {linked.length} {linked.length === 1 ? "project" : "projects"} on
              the web
            </p>
          </header>
          <ul className="cs-linked">
            {linked.map(({ project: other, why }) => (
              <li key={other.slug} data-hue={other.aspect}>
                <Link href={`/work/${other.slug}`}>
                  <span className="cs-linked-title">{other.title}</span>
                  <span className="cs-linked-why">{why}</span>
                  <span className="cs-linked-meta meta">{other.dateLabel}</span>
                  <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="wrap cs-pager" aria-label="Older and newer projects">
        {previous ? (
          <Link
            className="cs-page"
            href={`/work/${previous.slug}`}
            rel="prev"
            data-hue={previous.aspect}
          >
            <span className="meta">
              <span aria-hidden="true">←</span> Older
            </span>
            <span className="cs-page-title">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            className="cs-page cs-page-next"
            href={`/work/${next.slug}`}
            rel="next"
            data-hue={next.aspect}
          >
            <span className="meta">
              Newer <span aria-hidden="true">→</span>
            </span>
            <span className="cs-page-title">{next.title}</span>
          </Link>
        ) : null}
      </nav>

      {service ? (
        <Cta
          lead="Need something like this?"
          body={`This is ${service.title.replace(/^[A-Z][a-z]/, (start) => start.toLowerCase())} work. Tell me what you need and what it has to do, and I will tell you plainly whether I can build it.`}
        />
      ) : (
        <Cta />
      )}
    </article>
  );
}
