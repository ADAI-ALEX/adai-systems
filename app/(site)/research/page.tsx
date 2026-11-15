import Link from "next/link";
import { pageMeta } from "@/components/site/meta";
import { Arrow, Cta, Links, Shot, Status } from "@/components/site/parts";
import { getProject, research, type Project } from "@/content/projects";
import { getService } from "@/content/services";
import { copy } from "@/content/site";
import "./research.css";

export const metadata = pageMeta({
  title: "Research",
  description:
    "Research from ADAI Systems: reinforcement learning, an acoustic levitation simulator, a volumetric display study and a room scanner, each written up with its limits.",
  path: "/research",
  card: "research",
});

const service = getService("research");
const alsoLed = [getProject("glimmer"), getProject("margin")];
const pad = (index: number) => String(index + 1).padStart(2, "0");

/** Real media when the project has it. A typographic panel when it does not: never a stand-in image. */
function StudyMedia({ project }: { project: Project }) {
  const media = project.media ?? [];
  if (media.length > 1) {
    return (
      <div className="study-media study-pair">
        {media.map((shot) => (
          <figure key={shot.src}>
            <div className="frame">
              <Shot media={shot} sizes="(min-width: 960px) 26vw, 46vw" />
            </div>
          </figure>
        ))}
      </div>
    );
  }
  if (media.length === 1) {
    return (
      <figure className="study-media">
        <div className="frame">
          <Shot media={media[0]} sizes="(min-width: 960px) 52vw, 92vw" />
        </div>
        {project.disclosure ? <figcaption className="study-disclosure">{project.disclosure}</figcaption> : null}
      </figure>
    );
  }
  const steps = (project.story?.how ?? project.story?.built ?? []).slice(0, 3);
  return (
    <div className="study-media study-type" aria-label={`${project.title}, how it works`} role="group">
      <p className="study-type-kind display">{project.kindLabel}</p>
      <ol className="study-type-steps">
        {steps.map((step, index) => (
          <li key={step}>
            <span className="meta hue">{pad(index)}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="meta">{project.stack.join(" · ")}</p>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <div className="research" data-hue="research">
      <header className="wrap page-head research-head">
        <div>
          <h1>{copy.research.title}</h1>
          <p className="lede">{copy.research.body}</p>
          <div className="actions">
            <Link className="btn" href={`/services/${service.path}`}>
              {service.title} <Arrow />
            </Link>
          </div>
        </div>
        <nav className="research-index" aria-label="The studies on this page">
          <ol>
            {research.map((project, index) => (
              <li key={project.slug}>
                <a href={`#${project.slug}`}>
                  <span className="meta hue">{pad(index)}</span>
                  <span className="research-index-title">{project.title}</span>
                  <span className="meta">{project.dateLabel}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <div className="wrap studies">
        {research.map((project, index) => (
          <article
            key={project.slug}
            id={project.slug}
            className="study rise"
            data-flip={index % 2 === 1}
            aria-labelledby={`${project.slug}-title`}
          >
            <header className="study-head">
              <p className="study-meta">
                <span className="meta hue">{pad(index)}</span>
                <Status project={project} />
                <span className="meta">{project.dateLabel}</span>
                <span className="meta">{project.kindLabel}</span>
              </p>
              <h2 id={`${project.slug}-title`}>
                <Link href={`/work/${project.slug}`}>{project.title}</Link>
              </h2>
              <p className="study-pitch">{project.pitch}</p>
            </header>
            <StudyMedia project={project} />
            <div className="study-body">
              <p className="mute">{project.summary}</p>
              {project.story?.outcome ? (
                <p className="study-outcome">
                  <span className="meta">Outcome</span>
                  {project.story.outcome}
                </p>
              ) : null}
              <ul className="tags" aria-label="Stack">
                {project.stack.map((item) => (
                  <li className="tag" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
              <Links project={project} caseStudy />
            </div>
          </article>
        ))}
      </div>

      <section className="section wrap rise" aria-labelledby="also-title">
        <header className="section-head">
          <h2 id="also-title">Also research-led</h2>
          <p className="lede">The two largest projects began as questions too. Each has its own case study.</p>
        </header>
        <div className="also">
          {alsoLed.map((project) => (
            <article key={project.slug} className="also-item" data-hue={project.aspect}>
              <Link className="frame frame-zoom" href={`/work/${project.slug}`} aria-label={`${project.title} case study`}>
                <Shot media={project.media![0]} sizes="(min-width: 960px) 44vw, 92vw" />
              </Link>
              <div className="also-body">
                <Status project={project} />
                <h3 className="display">
                  <Link href={`/work/${project.slug}`}>{project.title}</Link>
                </h3>
                <p className="mute">{project.pitch}</p>
                <Links project={project} caseStudy />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section wrap rise" aria-label="The research service">
        <Link className="research-service" href={`/services/${service.path}`}>
          <span className="research-service-title display">{service.title}</span>
          <span className="research-service-promise">{service.promise}</span>
          <span className="research-service-intro">{service.intro}</span>
          <span className="research-service-go meta hue">
            See the service <Arrow />
          </span>
        </Link>
      </section>

      <Cta
        lead="Have a question that needs a prototype?"
        body="Tell me what you want to find out and what the answer would change. You get a working prototype or a straight answer, with the limits written down."
      />
    </div>
  );
}
