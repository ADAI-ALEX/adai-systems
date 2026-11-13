import Link from "next/link";
import { pageMeta } from "@/components/site/meta";
import { Cta, Links, Panel, Shot, Status } from "@/components/site/parts";
import { getProject, research } from "@/content/projects";
import { copy } from "@/content/site";

export const metadata = pageMeta({
  title: "Research",
  description:
    "Experiments from ADAI Systems: reinforcement learning, acoustic levitation, spatial capture and a study of volumetric displays.",
  path: "/research",
  card: "research",
});

const glimmer = getProject("glimmer");

export default function ResearchPage() {
  return (
    <>
      <header className="page-head">
        <p className="crumb">
          <Link href="/">home</Link> / research
        </p>
        <h1>{copy.research.title}</h1>
        <p className="lede">{copy.research.body}</p>
      </header>

      <section className="block" aria-label="Research projects">
        {research.map((project) => {
          const shot = project.media?.[0];
          return (
            <Panel key={project.slug} title={project.slug} as="article">
              <div className={shot ? "split" : undefined}>
                <div>
                  <h2 className="display" style={{ fontSize: "clamp(1.75rem, 3.6vw, 3.25rem)" }}>
                    <Link className="title-link" href={`/work/${project.slug}`}>
                      {project.title}
                    </Link>
                  </h2>
                  <p className="meta">
                    <Status project={project} />{" "}
                    <span className="t-dim">
                      · {project.kindLabel.toLowerCase()} · {project.dateLabel.toLowerCase()}
                    </span>
                  </p>
                  <p className="pitch">{project.pitch}</p>
                  <p style={{ maxWidth: "70ch" }}>{project.summary}</p>
                  {project.story?.outcome ? <p className="note">{project.story.outcome}</p> : null}
                  <Links project={project} caseStudy />
                </div>
                {shot ? (
                  <figure className="thumb">
                    <Shot media={shot} className="" sizes="(min-width: 992px) 45vw, 95vw" />
                    {shot.type === "concept" && project.disclosure ? <figcaption>{project.disclosure}</figcaption> : null}
                  </figure>
                ) : null}
              </div>
            </Panel>
          );
        })}
      </section>

      <section className="block reveal" aria-label="Also research">
        <Panel title="see also">
          <h3>
            <Link className="title-link" href="/work/glimmer">
              {glimmer.title}
            </Link>
          </h3>
          <p className="pitch">{glimmer.pitch}</p>
          <p className="t-dim">The studio&apos;s largest piece of research is also one of the two things it is building now.</p>
          <Links project={glimmer} caseStudy />
        </Panel>
      </section>

      <Cta />
    </>
  );
}
