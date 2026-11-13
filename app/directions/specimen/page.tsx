import type { Metadata } from "next";
import { previewOnly } from "@/lib/preview";
import Image from "next/image";
import { Anybody, Hanken_Grotesk } from "next/font/google";
import { Kinetic } from "@/components/specimen/kinetic";
import { Marquee, SpecArchive } from "@/components/specimen/parts";
import {
  byDate,
  counts,
  domains,
  featured,
  getProject,
  research,
  selected,
  stevie,
  type Project,
} from "@/content/projects";
import { copy, site } from "@/content/site";
import "./specimen.css";

const display = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "swap" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Direction B: Specimen",
  description: "ADAI Systems as a type specimen that reacts to the cursor.",
};

const lockout = getProject("lockout");
const glimmer = getProject("glimmer");
const sums = stevie[7];

function Links({ project }: { project: Project }) {
  if (!project.links?.length) return null;
  return (
    <p className="links">
      {project.links.map((link) => (
        <a className="btn" key={link.href} href={link.href}>
          {link.label} <span aria-hidden="true">↗</span>
        </a>
      ))}
    </p>
  );
}

function Facts({ project }: { project: Project }) {
  if (!project.facts?.length) return null;
  return (
    <dl className="facts">
      {project.facts.map((fact) => (
        <div key={fact.label}>
          <dd>{fact.value}</dd>
          <dt>{fact.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export default function SpecimenDirection() {
  previewOnly();
  return (
    <div className={`${display.variable} ${body.variable} spec`}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="top">
        <a className="brand" href="#top">
          ADAI Systems
        </a>
        <nav aria-label="Sections">
          <a href="#now">Now</a>
          <a href="#work">Work</a>
          <a href="#archive">Archive</a>
          <a href="#research">Research</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <Kinetic lines={["BUILDING", "INTELLIGENT", "SOFTWARE."]} label={site.headline} />
          <div className="hero-foot">
            <p className="intro">
              {copy.intro} <mark>{site.line}</mark>
            </p>
            <ul className="tally">
              <li>
                <b>{counts.total}</b> projects
              </li>
              <li>
                <b>{counts.running}</b> running now
              </li>
              <li>
                <b>{counts.openSource}</b> open source
              </li>
              <li>
                Since <b>{site.foundedShort}</b>
              </li>
            </ul>
            <p className="hero-actions">
              <a className="btn btn-fill" href="#work">
                See the work <span aria-hidden="true">↓</span>
              </a>
              <a className="btn" href={`mailto:${site.email}`}>
                Email Alex
              </a>
            </p>
          </div>
        </section>

        <section id="now" className="band">
          <header className="head">
            <h2>{copy.now.title}</h2>
            <p>{copy.now.body}</p>
          </header>

          <article className="tile tile-hot">
            <div className="tile-copy">
              <p className="kicker">
                {lockout.statusLabel} · {lockout.kindLabel}
              </p>
              <h3>{lockout.title}</h3>
              <p className="pitch">{lockout.pitch}</p>
              <p>{lockout.summary}</p>
              <ul className="points">
                {lockout.points?.map((point) => <li key={point}>{point}</li>)}
              </ul>
              <Facts project={lockout} />
              <Links project={lockout} />
            </div>
            <div className="phones">
              {lockout.media?.slice(0, 3).map((shot) => (
                <Image
                  key={shot.src}
                  src={shot.src}
                  alt={shot.alt}
                  width={shot.width}
                  height={shot.height}
                  sizes="(min-width: 900px) 16vw, 30vw"
                />
              ))}
            </div>
          </article>

          <article className="tile tile-ink">
            <Image
              className="shot"
              src={glimmer.media![0].src}
              alt={glimmer.media![0].alt}
              width={glimmer.media![0].width}
              height={glimmer.media![0].height}
              sizes="(min-width: 900px) 92vw, 100vw"
            />
            <div className="tile-split">
              <div className="tile-copy">
                <p className="kicker">
                  {glimmer.statusLabel} · {glimmer.kindLabel}
                </p>
                <h3>{glimmer.title}</h3>
                <p className="pitch">{glimmer.pitch}</p>
                <p>{glimmer.summary}</p>
                <Facts project={glimmer} />
                <Links project={glimmer} />
              </div>
              <figure className="quote">
                <blockquote>
                  <p className="ask">{sums.prompt}</p>
                  <p className="answer">{sums.reply}</p>
                </blockquote>
                <figcaption>
                  STEVIE, Glimmer&apos;s first model. A real reply to a held-out prompt, first sample, unedited. It
                  has the voice and knows when to stop talking. It does not have the sense.
                </figcaption>
                <p className="small">{glimmer.disclosure}</p>
              </figure>
            </div>
          </article>
        </section>

        <section id="work" className="band">
          <header className="head">
            <h2>{copy.work.title}</h2>
            <p>{copy.work.body}</p>
          </header>

          <article className="tile tile-sun">
            <Image
              className="shot pixel"
              src={featured.media![0].src}
              alt={featured.media![0].alt}
              width={featured.media![0].width}
              height={featured.media![0].height}
              sizes="(min-width: 900px) 55vw, 100vw"
            />
            <div className="tile-copy">
              <p className="kicker">
                {featured.statusLabel} · {featured.dateLabel}
              </p>
              <h3>{featured.title}</h3>
              <p className="pitch">{featured.pitch}</p>
              <p>{featured.summary}</p>
              <Facts project={featured} />
              <p className="small">{featured.disclosure}</p>
              <Links project={featured} />
            </div>
          </article>

          <ol className="list">
            {selected.map((project, index) => (
              <li key={project.slug}>
                <span className="num" aria-hidden="true">
                  {String(index + 2).padStart(2, "0")}
                </span>
                <h3>{project.title}</h3>
                <div>
                  <p className="pitch">{project.pitch}</p>
                  <p className="small">
                    {project.statusLabel} · {project.stack.join(", ")}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="archive" className="band">
          <header className="head">
            <h2>{copy.archive.title}</h2>
            <p>{copy.archive.body}</p>
          </header>
          <Marquee items={byDate.map((project) => project.chapter)} />
          <SpecArchive />
        </section>

        <section id="domains" className="band">
          <header className="head">
            <h2>{copy.domains.title}</h2>
            <p>{copy.domains.body}</p>
          </header>
          <ul className="domains">
            {domains.map((domain) => (
              <li key={domain.label}>
                <h3>
                  {domain.label}
                  <sup>{domain.slugs.length}</sup>
                </h3>
                <p>{domain.note}</p>
                <p className="small">{domain.slugs.map((slug) => getProject(slug).title).join(", ")}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="research" className="band band-ink">
          <header className="head">
            <h2>{copy.research.title}</h2>
            <p>{copy.research.body}</p>
          </header>
          <div className="lab">
            {research.map((project) => {
              const shot = project.media?.[0];
              return (
                <article key={project.slug}>
                  <p className="kicker">
                    {project.statusLabel} · {project.dateLabel}
                  </p>
                  <h3>{project.title}</h3>
                  {shot ? (
                    <figure>
                      {shot.src.endsWith(".gif") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" />
                      ) : (
                        <Image src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} sizes="(min-width: 900px) 22vw, 90vw" />
                      )}
                      {project.disclosure ? <figcaption>{project.disclosure}</figcaption> : null}
                    </figure>
                  ) : null}
                  <p>{project.summary}</p>
                  {project.links?.map((link) => (
                    <a className="text-link" key={link.href} href={link.href}>
                      {link.label} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </article>
              );
            })}
          </div>
        </section>

        <section id="contact" className="band band-hot">
          <h2>{copy.hire.lead}</h2>
          <p className="intro">{copy.hire.body}</p>
          <a className="mail" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <p className="small">{site.contactLine}</p>
        </section>
      </main>

      <footer className="foot">
        <p>{site.operator}</p>
        <nav aria-label="Footer">
          <a href={site.links.lockout}>Lockout ↗</a>
          <a href={site.links.fitdawg}>FitDawg ↗</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </footer>
    </div>
  );
}
