import Link from "next/link";
import { Container, SectionHead } from "./section";
import { Reveal } from "./reveal";
import { stamp } from "./project-card";
import { StatusLabel } from "./status";
import { researchProjects } from "@/lib/projects";

/**
 * The half of the studio that never shipped.
 *
 * Deliberately drawn as a list of entries rather than as cards, and on ink
 * rather than paper: research is a different kind of object from a product,
 * and the page should not pretend otherwise. A discontinued experiment is
 * evidence of depth, so nothing here is styled as a failure — no warning
 * colours, no strikethrough, no apology.
 */
export function Research() {
  return (
    <section
      id="research"
      className="scroll-mt-20 bg-surface-dark py-20 text-ink-inverse sm:py-24 lg:py-28"
    >
      <Container>
        <SectionHead
          index="05"
          label="Research"
          tone="dark"
          title="Not everything becomes a product."
          intro="Some projects exist to answer a question. These are the ones that stayed questions — private, paused, or finished the moment they had taught the studio what it wanted to know."
        />

        <ul className="mt-12 border-t border-white/15">
          {researchProjects.map((project, index) => (
            <Reveal key={project.id} delay={index * 60} as="li">
              <Link
                href={`/work/${project.id}`}
                className="group grid gap-x-8 gap-y-3 border-b border-white/15 py-7 transition-colors hover:bg-white/[0.04] md:grid-cols-[6.5rem_minmax(0,1fr)_auto] md:items-baseline"
              >
                <span className="meta-sm text-white/60">
                  {stamp(project.start)}
                </span>

                <div className="min-w-0">
                  <h3 className="text-[1.375rem] font-semibold tracking-[-0.025em] text-white sm:text-[1.5rem]">
                    {project.title}
                  </h3>
                  <p className="meta-sm mt-2 text-white/60">
                    {project.typeLabel}
                  </p>
                  <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-white/75">
                    {project.short}
                  </p>
                </div>

                <div className="flex items-center gap-5 md:justify-end">
                  <StatusLabel
                    project={project}
                    className="whitespace-nowrap text-white/60"
                  />
                  <span
                    aria-hidden="true"
                    className="text-white/60 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white"
                  >
                    →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
