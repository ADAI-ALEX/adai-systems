import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/section";
import { ProjectGraph } from "@/components/project-graph";
import { RelatedWork } from "@/components/related-work";
import { StatusLabel } from "@/components/status";
import { stamp } from "@/components/project-card";
import {
  STATUS_MEANING,
  getProject,
  projects,
  projectsByDate,
  statusLabel,
} from "@/lib/projects";
import { siteConfig } from "@/lib/site-config";

export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return {};

  return {
    title: `${project.title} · ${statusLabel(project)}`,
    description: project.summary,
    alternates: { canonical: `/work/${project.id}` },
    openGraph: {
      type: "article",
      siteName: siteConfig.name,
      title: `${project.title} — ${siteConfig.name}`,
      description: project.summary,
      url: `/work/${project.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} — ${siteConfig.name}`,
      description: project.summary,
    },
  };
}

/**
 * Wording for a project's public destination.
 *
 * A live product links out plainly. An archived one links out with the state of
 * what is on the other end said first, so nobody follows the link expecting a
 * product still in development. A private project gets no link at all and says
 * so — there is no waitlist, no demo and no screenshot to invent.
 */
function destinationNote(status: string, mayReturn: boolean): string {
  if (status === "private") {
    return "There is no public build. This entry exists because the work is part of the studio's history.";
  }
  if (status === "on-hold") {
    return "Paused, with nothing publicly released.";
  }
  if (status === "discontinued") {
    return mayReturn
      ? "The site is still up. The product is no longer in development, and may return."
      : "The product is no longer in development.";
  }
  if (status === "research") {
    return "Research rather than a product. Nothing was released publicly.";
  }
  return "Live, and in active development.";
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const index = projectsByDate.findIndex((p) => p.id === project.id);
  const previous = projectsByDate[index - 1];
  const next = projectsByDate[index + 1];
  const note = destinationNote(project.status, Boolean(project.mayReturn));

  const specs = [
    { label: "Status", value: statusLabel(project) },
    { label: "Period", value: project.dateLabel },
    { label: "Type", value: project.typeLabel },
    { label: "Built around", value: project.tags.join(" · ") },
  ];

  return (
    <article className="pb-20 sm:pb-24">
      <div className="border-b border-rule">
        <Container>
          <div className="flex items-center justify-between gap-6 py-4">
            <Link
              href="/#work"
              className="meta-sm text-ink-muted transition-colors hover:text-ink"
            >
              ← The archive
            </Link>
            <span className="meta-sm text-ink-faint">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(projectsByDate.length).padStart(2, "0")}
            </span>
          </div>
        </Container>
      </div>

      <Container>
        <header className="pb-14 pt-14 sm:pt-20">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="meta-sm text-ink-faint">
              {stamp(project.start)}
            </span>
            <span className="meta-sm text-ink-faint">{project.typeLabel}</span>
            <StatusLabel project={project} className="text-ink" />
          </div>

          <h1 className="mt-8 text-[clamp(2.5rem,8vw,5.5rem)] font-semibold leading-[0.96] tracking-[-0.042em] text-ink">
            {project.title}
          </h1>

          <p className="mt-8 max-w-[54ch] text-[1.125rem] leading-relaxed text-ink-muted sm:text-[1.25rem]">
            {project.summary}
          </p>
        </header>

        <div className="grid gap-12 border-t border-rule pt-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div>
            <div className="flex max-w-[62ch] flex-col gap-6">
              {project.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="text-[1.0625rem] leading-[1.75] text-ink"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Destination. Present only when something real is on the other
                end; otherwise the state of the work is stated instead. */}
            <div className="mt-12 rounded-2xl border border-rule bg-paper-raised p-7">
              <p className="meta-sm text-ink-faint">
                {project.url ? "Destination" : "Availability"}
              </p>

              {project.url ? (
                <>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group mt-4 inline-flex items-baseline gap-3 text-[1.125rem] font-semibold tracking-[-0.02em] text-ink underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-ink"
                  >
                    {project.urlLabel ?? project.url}
                    <span
                      aria-hidden="true"
                      className="text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-ink"
                    >
                      ↗
                    </span>
                  </a>
                  {note ? (
                    <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink-muted">
                      {note}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-4 text-[1.125rem] font-semibold tracking-[-0.02em] text-ink">
                    {statusLabel(project)}
                  </p>
                  <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink-muted">
                    {note || STATUS_MEANING[project.status]}
                  </p>
                </>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <dl className="border-t border-rule">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex flex-col gap-2 border-b border-rule py-4"
                >
                  <dt className="meta-sm text-ink-faint">{spec.label}</dt>
                  <dd className="text-[0.9375rem] leading-relaxed text-ink">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <p className="meta-sm text-ink-faint">Position in the system</p>
              <div className="mt-4 rounded-2xl border border-rule bg-paper-raised p-4">
                <ProjectGraph project={project} />
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-16">
          <RelatedWork project={project} />
        </div>

        {/* Move along the archive without going back to the index. */}
        <nav
          aria-label="Archive"
          className="mt-16 grid gap-4 border-t border-rule pt-8 sm:grid-cols-2"
        >
          {previous ? (
            <Link
              href={`/work/${previous.id}`}
              className="group flex flex-col gap-2 rounded-2xl border border-rule bg-paper-raised p-6 transition-colors hover:border-ink-faint"
            >
              <span className="meta-sm text-ink-faint">← Earlier</span>
              <span className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                {previous.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/work/${next.id}`}
              className="group flex flex-col items-end gap-2 rounded-2xl border border-rule bg-paper-raised p-6 text-right transition-colors hover:border-ink-faint sm:col-start-2"
            >
              <span className="meta-sm text-ink-faint">Later →</span>
              <span className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                {next.title}
              </span>
            </Link>
          ) : null}
        </nav>
      </Container>
    </article>
  );
}
