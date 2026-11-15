import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/components/site/meta";
import { Arrow, Cta, Status } from "@/components/site/parts";
import { Process } from "@/components/site/services/process";
import { ProjectThumb, ProjectVisual } from "@/components/site/services/visual";
import { getProject, type Project } from "@/content/projects";
import { services, type Service } from "@/content/services";
import "../services.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return services.map((service) => ({ path: service.path }));
}

/** Search-facing words for each service. The facts behind them live in content/. */
const pages: Record<string, { title: string; description: string; lead: string; body: string }> = {
  agents: {
    title: "AI agents and voice agents",
    description:
      "Phone agents, chat agents and assistants that work against your own data and do the task. Speech can run on your own machines where privacy matters.",
    lead: "Calls an agent could take?",
    body: "Tell me what your team answers every day and where the answers live. I will tell you plainly whether an agent can do it, and what it would take.",
  },
  automation: {
    title: "Automation and internal tools",
    description:
      "Small, dependable tools that take repetitive work off your team. They watch a folder, a queue or a booking page, do the job and leave a record you can read.",
    lead: "Work you do by hand every week?",
    body: "Describe the task, where it starts and where it ends. If software can take it over, I will say how, and what stays on your machines.",
  },
  products: {
    title: "iPhone and web app development",
    description:
      "iPhone apps, web apps and the backend behind them, taken from idea to launch: design, build, tests, payments, store review and release. Lockout is live on the App Store.",
    lead: "An app you want to exist?",
    body: "Tell me what it is for and who opens it. I build all of it, test it properly and see it through store review.",
  },
  research: {
    title: "Research and prototypes",
    description:
      "Machine learning experiments, feasibility studies and working prototypes, measured and written up honestly, so you know whether it can be done before you commit a budget.",
    lead: "Not sure it can be done?",
    body: "Send the idea as it stands. The answer is a working prototype or a straight no, with the limits written down.",
  },
};

function find(path: string): Service {
  const service = services.find((item) => item.path === path);
  if (!service) notFound();
  return service;
}

export async function generateMetadata({ params }: { params: Promise<{ path: string }> }) {
  const service = find((await params).path);
  const words = pages[service.slug];
  return pageMeta({
    title: words.title,
    description: words.description,
    path: `/services/${service.path}`,
    card: `service-${service.path}`,
  });
}

/** Lines in a row that are proved by the same project, so the project is named once beside them. */
function groupBuilds(service: Service): { project: Project; lines: { n: number; text: string }[] }[] {
  const groups: { project: Project; lines: { n: number; text: string }[] }[] = [];
  service.builds.forEach((line, index) => {
    const entry = { n: index + 1, text: line.text };
    const last = groups.at(-1);
    if (last && last.project.slug === line.proof) last.lines.push(entry);
    else groups.push({ project: getProject(line.proof), lines: [entry] });
  });
  return groups;
}

export default async function ServicePage({ params }: { params: Promise<{ path: string }> }) {
  const service = find((await params).path);
  const words = pages[service.slug];
  const groups = groupBuilds(service);
  const proof = service.proof.map(getProject);
  const [lead, ...rest] = proof;
  const others = services.filter((item) => item.slug !== service.slug);

  return (
    <div className="sv-page" data-hue={service.slug}>
      <header className="wrap page-head sv-hero">
        <nav className="crumb meta" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/services">Services</Link>
            </li>
            <li aria-current="page">{service.title}</li>
          </ol>
        </nav>
        <h1>{service.title}</h1>
        <div className="sv-hero-body">
          <p className="sv-hero-promise display">{service.promise}</p>
          <div>
            <p className="lede">{service.intro}</p>
            <div className="actions">
              <Link className="btn btn-primary" href={`/start?type=${service.slug}`}>
                Start a project <Arrow />
              </Link>
              <a className="btn" href="#proof">
                See the work
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className="section wrap rise" aria-labelledby="get-title">
        <header className="section-head">
          <h2 id="get-title">What you get</h2>
          <p className="lede">Each line is something already built. The project beside it is the proof.</p>
        </header>
        <ol className="sv-get">
          {groups.map((group) => (
            <li key={group.lines[0].text} className="sv-get-row">
              <ul className="sv-get-lines">
                {group.lines.map((line) => (
                  <li key={line.text}>
                    <span className="meta">0{line.n}</span>
                    <span>{line.text}</span>
                  </li>
                ))}
              </ul>
              <Link className="sv-get-proof" href={`/work/${group.project.slug}`} data-hue={group.project.aspect}>
                <ProjectThumb project={group.project} />
                <span className="sv-get-name">
                  <span className="meta">Proved by</span>
                  <span className="sv-get-title">{group.project.title}</span>
                  <Status project={group.project} />
                </span>
                <span className="sv-get-go" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="section wrap rise sv-fit" aria-labelledby="fit-title">
        <h2 id="fit-title">A good fit if</h2>
        <ul className="sv-fit-list">
          {service.fit.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="sv-fit-next">
          <p className="mute">Sound like you? A few lines is enough to start.</p>
          <Link className="btn btn-hue" href={`/start?type=${service.slug}`}>
            Write the brief <Arrow />
          </Link>
        </div>
      </section>

      <section id="proof" className="section wrap" aria-labelledby="proof-title">
        <header className="section-head rise">
          <h2 id="proof-title">Proof</h2>
          <p className="lede">
            {proof.length} projects you can open and read. What was built, how it works and where it ended up.
          </p>
        </header>
        <ProofCard project={lead} wide />
        <div className="sv-proof-grid" data-count={rest.length}>
          {rest.map((project) => (
            <ProofCard key={project.slug} project={project} />
          ))}
        </div>
      </section>

      <Process />

      <section className="section wrap rise" aria-labelledby="others-title">
        <header className="section-head">
          <h2 id="others-title">The other three</h2>
          <p className="lede">Most projects cross more than one. Bring the whole problem.</p>
        </header>
        <ul className="sv-others">
          {others.map((item) => (
            <li key={item.slug} data-hue={item.slug}>
              <Link href={`/services/${item.path}`}>
                <span className="sv-others-title">{item.title}</span>
                <span className="mute">{item.promise}</span>
                <span className="sv-others-go" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Cta lead={words.lead} body={words.body} />
    </div>
  );
}

function ProofCard({ project, wide = false }: { project: Project; wide?: boolean }) {
  const href = `/work/${project.slug}`;
  const media = (
    <ProjectVisual project={project} detail={wide} sizes={wide ? "(min-width: 960px) 52vw, 92vw" : "(min-width: 960px) 30vw, 92vw"} />
  );
  return (
    <article className={`sv-card rise${wide ? " sv-card-wide" : ""}`} data-hue={project.aspect}>
      {project.video ? (
        <div className="sv-card-media">{media}</div>
      ) : (
        <Link className="sv-card-media" href={href} aria-label={`${project.title} case study`}>
          {media}
        </Link>
      )}
      <div className="sv-card-body">
        <Status project={project} />
        <h3 className={wide ? "display" : undefined}>
          <Link href={href}>{project.title}</Link>
        </h3>
        <p className="sv-card-pitch">{project.pitch}</p>
        {wide ? <p className="mute">{project.summary}</p> : null}
        <p className="links">
          <Link className="link" href={href}>
            Read the case study<span className="sv-sr">: {project.title}</span>
          </Link>
        </p>
      </div>
    </article>
  );
}
