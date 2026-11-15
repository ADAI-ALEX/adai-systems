import Link from "next/link";
import { pageMeta } from "@/components/site/meta";
import { Arrow, Cta, Status } from "@/components/site/parts";
import { Process } from "@/components/site/services/process";
import { ProjectVisual, firstWithMedia } from "@/components/site/services/visual";
import { getProject } from "@/content/projects";
import { services } from "@/content/services";
import { copy } from "@/content/site";
import "./services.css";

export const metadata = pageMeta({
  title: "Services",
  description:
    "AI agents and voice, automation and internal tools, apps and products, research and prototypes. Four kinds of work, each backed by projects you can open.",
  path: "/services",
  card: "services",
});

export default function ServicesPage() {
  return (
    <>
      <header className="wrap page-head sv-head">
        <div>
          <h1>{copy.services.title}</h1>
          <p className="lede">{copy.services.body}</p>
        </div>
        <nav className="sv-index" aria-label="The four services">
          <ol>
            {services.map((service, index) => (
              <li key={service.slug} data-hue={service.slug}>
                <a href={`#${service.path}`}>
                  <span className="meta">0{index + 1}</span>
                  <span>{service.title}</span>
                  <span className="sv-index-go" aria-hidden="true">
                    ↓
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <div className="wrap sv-blocks">
        {services.map((service, index) => {
          const shown = firstWithMedia(service.proof);
          const others = service.proof.filter((slug) => slug !== shown.slug).map(getProject);
          const href = `/services/${service.path}`;
          return (
            <section
              key={service.slug}
              id={service.path}
              className="sv-block rise"
              data-hue={service.slug}
              aria-labelledby={`${service.path}-title`}
            >
              <div className="sv-block-copy">
                <h2 id={`${service.path}-title`}>
                  <Link href={href}>{service.title}</Link>
                </h2>
                <p className="sv-promise">{service.promise}</p>
                <p className="mute">{service.intro}</p>
                <ul className="sv-builds">
                  {service.builds.slice(0, 3).map((line) => {
                    const proof = getProject(line.proof);
                    return (
                      <li key={line.text}>
                        <span>{line.text}</span>
                        <Link className="meta" href={`/work/${proof.slug}`}>
                          {proof.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="actions">
                  <Link className="btn btn-hue" href={href}>
                    See what you get<span className="sv-sr">: {service.title}</span> <Arrow />
                  </Link>
                  <Link className="btn" href={`/start?type=${service.slug}`}>
                    Start a project<span className="sv-sr">: {service.title}</span>
                  </Link>
                </div>
              </div>

              <figure className="sv-block-proof">
                <Link href={`/work/${shown.slug}`} className="sv-block-media" aria-label={`${shown.title} case study`}>
                  <ProjectVisual project={shown} video={false} sizes="(min-width: 960px) 46vw, 92vw" priority={index === 0} />
                </Link>
                <figcaption>
                  <span>
                    <Link className="link" href={`/work/${shown.slug}`}>
                      {shown.title}
                    </Link>{" "}
                    <Status project={shown} />
                  </span>
                  <span className="sv-also">
                    Also: {others.map((project, i) => (
                      <span key={project.slug}>
                        {i ? ", " : ""}
                        <Link className="link" href={`/work/${project.slug}`}>
                          {project.title}
                        </Link>
                      </span>
                    ))}
                  </span>
                </figcaption>
              </figure>
            </section>
          );
        })}
      </div>

      <Process />

      <Cta />
    </>
  );
}
