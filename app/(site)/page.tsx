import Link from "next/link";
import { pageMeta } from "@/components/site/meta";
import { Arrow, Cta, Facts, Links, Shot, Status } from "@/components/site/parts";
import { ServiceRows } from "@/components/site/service-rows";
import { Player } from "@/components/site/video";
import { Web } from "@/components/site/web";
import { counts, getProject, projects, stevie } from "@/content/projects";
import { process } from "@/content/services";
import { copy, site } from "@/content/site";
import "./home.css";

export const metadata = pageMeta({ description: site.description, path: "/", card: "home" });

const margin = getProject("margin");
const lockout = getProject("lockout");
const glimmer = getProject("glimmer");
const jeb = getProject("jeb-depot");
const sums = stevie[7];

const proof = [
  { value: "Live", label: "on the App Store", href: site.links.lockoutAppStore },
  { value: String(counts.openSource), label: "open-source repositories", href: "/work" },
  { value: "NASA", label: "Space Apps 2026 entry", href: "/work/margin" },
  { value: String(projects.length), label: `projects since ${site.foundedShort}`, href: "/work" },
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <Web mode="hero" />
        <div className="wrap hero-copy">
          <h1>{site.headline}</h1>
          <p className="lede">{copy.hero.sub}</p>
          <div className="actions">
            <Link className="btn btn-primary" href="/start">
              {copy.hero.primary} <Arrow />
            </Link>
            <Link className="btn" href="/work">
              {copy.hero.secondary}
            </Link>
          </div>
          <p className="meta hero-hint">Drag the web. Select anything on it to open it.</p>
        </div>
      </section>

      <section className="wrap proof" aria-label="At a glance">
        <ul>
          {proof.map((item) => (
            <li key={item.label}>
              <Link href={item.href}>
                <strong className="display">{item.value}</strong>
                <span className="meta">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section wrap rise" aria-labelledby="services-title">
        <header className="section-head">
          <h2 id="services-title">{copy.services.title}</h2>
          <p className="lede">{copy.services.body}</p>
        </header>
        <ServiceRows />
      </section>

      <section className="section wrap" aria-labelledby="showcase-title">
        <header className="section-head rise">
          <h2 id="showcase-title">{copy.showcase.title}</h2>
          <p className="lede">{copy.showcase.body}</p>
        </header>

        <article className="show show-wide rise" data-hue={margin.aspect}>
          <Player video={margin.video!} />
          <div className="show-body">
            <div>
              <Status project={margin} />
              <h3 className="display">
                <Link href="/work/margin">{margin.title}</Link>
              </h3>
              <p className="show-pitch">{margin.pitch}</p>
            </div>
            <div>
              <p className="mute">{margin.summary}</p>
              <Facts project={margin} max={3} />
              <Links project={margin} caseStudy />
            </div>
          </div>
        </article>

        <div className="show-pair">
          <article className="show rise" data-hue={lockout.aspect}>
            <Link className="show-media phones" href="/work/lockout" aria-label="Lockout case study">
              {lockout.media!.slice(0, 3).map((shot) => (
                <Shot key={shot.src} media={shot} sizes="(min-width: 960px) 14vw, 30vw" />
              ))}
            </Link>
            <div className="show-body">
              <Status project={lockout} />
              <h3 className="display">
                <Link href="/work/lockout">{lockout.title}</Link>
              </h3>
              <p className="show-pitch">{lockout.pitch}</p>
              <p className="mute">{lockout.summary}</p>
              <Links project={lockout} caseStudy />
            </div>
          </article>

          <article className="show rise" data-hue={glimmer.aspect}>
            <Link className="show-media frame frame-zoom" href="/work/glimmer" aria-label="Glimmer case study">
              <Shot media={glimmer.media![0]} sizes="(min-width: 960px) 44vw, 92vw" />
            </Link>
            <div className="show-body">
              <Status project={glimmer} />
              <h3 className="display">
                <Link href="/work/glimmer">{glimmer.title}</Link>
              </h3>
              <p className="show-pitch">{glimmer.pitch}</p>
              <figure className="quote">
                <blockquote>
                  <p className="meta">You: {sums.prompt}</p>
                  <p className="quote-reply">{sums.reply}</p>
                </blockquote>
                <figcaption>
                  STEVIE, Glimmer&apos;s first model: 13.8 million parameters, trained from scratch on one laptop. A real
                  reply, unedited. It has the voice. It does not have the sense.
                </figcaption>
              </figure>
              <Links project={glimmer} caseStudy />
            </div>
          </article>
        </div>

        <article className="show show-split rise" data-hue={jeb.aspect}>
          <Link className="show-media frame frame-zoom" href="/work/jeb-depot" aria-label="JEB Depot case study">
            <Shot media={jeb.media![0]} sizes="(min-width: 960px) 56vw, 92vw" />
          </Link>
          <div className="show-body">
            <Status project={jeb} />
            <h3 className="display">
              <Link href="/work/jeb-depot">{jeb.title}</Link>
            </h3>
            <p className="show-pitch">{jeb.pitch}</p>
            <Facts project={jeb} />
            <p className="small">{jeb.disclosure}</p>
            <Links project={jeb} caseStudy />
          </div>
        </article>

        <p className="show-more rise">
          <Link className="btn" href="/work">
            See all {projects.length} projects <Arrow />
          </Link>
        </p>
      </section>

      <section className="section wrap rise" aria-labelledby="process-title">
        <header className="section-head">
          <h2 id="process-title">{copy.process.title}</h2>
          <p className="lede">{copy.process.body}</p>
        </header>
        <ol className="steps">
          {process.map((step, index) => (
            <li key={step.title}>
              <span className="meta">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p className="mute">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <Cta />
    </>
  );
}
