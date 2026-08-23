import Link from "next/link";
import { Container } from "./section";
import { SystemDiagram } from "./system-diagram";
import {
  activeProjects,
  edges,
  projects,
  projectsByDate,
  researchProjects,
} from "@/lib/projects";

/** Live readout rather than written copy — these numbers come from the archive. */
const readout = [
  { label: "Projects", value: String(projects.length).padStart(2, "0") },
  { label: "Active", value: String(activeProjects.length).padStart(2, "0") },
  { label: "Research", value: String(researchProjects.length).padStart(2, "0") },
  { label: "Since", value: projectsByDate[0]?.dateLabel.split(" — ")[0] ?? "" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-rule">
      {/* Blueprint ground, faded out towards the bottom so the section below
          starts on clean paper. */}
      <div
        aria-hidden="true"
        className="grid-field pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_88%)]"
      />

      <Container className="relative">
        <div className="flex items-center justify-between gap-6 border-b border-rule py-4">
          <span className="meta-sm text-ink-faint">Index</span>
          <span className="meta-sm text-ink-muted">
            <span className="sm:hidden">Est. 2024</span>
            <span className="hidden sm:inline">
              Independent technology studio
            </span>
          </span>
        </div>

        <div className="pb-14 pt-16 sm:pt-20 lg:pb-24 lg:pt-28">
          <h1 className="enter max-w-[16ch] text-[clamp(2.85rem,9vw,7.25rem)] font-semibold leading-[0.94] tracking-[-0.045em] text-ink">
            Building intelligent software.
          </h1>

          {/* The supporting copy and the map, side by side. The graph gets a
              column of its own rather than bleeding off the edge: shown whole,
              it reads as the object the page is about, and section 04 below
              turns the same drawing into something you can use. */}
          <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] lg:items-start lg:gap-16">
            <div>
              <p className="enter max-w-[46ch] text-lg leading-relaxed text-ink-muted [--enter-delay:120ms] sm:text-xl">
                ADAI Systems is an independent technology studio building AI
                systems, software products and experimental research.
                <span className="text-ink"> A system for building systems.</span>
              </p>

              <div className="enter mt-9 flex flex-wrap items-center gap-3 [--enter-delay:220ms]">
                <Link
                  href="#work"
                  className="press group inline-flex h-12 items-center gap-3 rounded-full bg-ink pl-6 pr-5 text-[13px] font-medium tracking-[-0.01em] text-ink-inverse transition-colors hover:bg-black"
                >
                  Explore the system
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-y-0.5"
                  >
                    ↓
                  </span>
                </Link>
                <Link
                  href="#studio"
                  className="press inline-flex h-12 items-center rounded-full border border-rule-strong bg-paper-raised px-6 text-[13px] font-medium tracking-[-0.01em] text-ink transition-colors hover:border-ink"
                >
                  What this is
                </Link>
              </div>
            </div>

            {/* Annotated like a figure, because that is what it is. */}
            <figure className="enter min-w-0 [--enter-delay:320ms]">
              <SystemDiagram className="h-auto w-full" />
              <figcaption className="meta-sm mt-2 flex flex-wrap gap-x-4 gap-y-1 text-ink-faint">
                <span>Fig. 01</span>
                <span>Project graph</span>
                <span>
                  {projects.length} nodes · {edges.length} relations
                </span>
              </figcaption>
            </figure>
          </div>
        </div>

        {/* System readout. A hairline table rather than a row of badges: the
            numbers are counted from the archive, so they cannot drift. */}
        <dl className="enter grid grid-cols-2 border-t border-rule [--enter-delay:320ms] sm:grid-cols-4">
          {readout.map((item, index) => (
            <div
              key={item.label}
              className={`flex flex-col gap-2 py-5 sm:py-6 ${
                index > 0 ? "sm:border-l sm:border-rule sm:pl-6" : ""
              } ${index === 1 ? "border-l border-rule pl-6 sm:pl-6" : ""} ${
                index > 1 ? "border-t border-rule sm:border-t-0" : ""
              } ${index === 3 ? "border-l border-rule pl-6" : ""}`}
            >
              <dt className="meta-sm text-ink-faint">{item.label}</dt>
              <dd className="font-mono text-[15px] tracking-tight text-ink">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
