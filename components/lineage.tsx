import Link from "next/link";
import { Reveal } from "./reveal";
import { projectsByDate } from "@/lib/projects";

/**
 * The studio's evolution as a single line: agency, to platform, to research, to
 * products, to whatever is currently open.
 *
 * Built from the archive in date order, so it cannot drift out of step with
 * the timeline directly beneath it. Each step is a link into the project it
 * names.
 */
export function Lineage() {
  return (
    <Reveal className="mt-12 border-y border-rule py-6">
      <p className="meta-sm mb-5 text-ink-faint">Lineage</p>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-3">
        {projectsByDate.map((project, index) => (
          <li key={project.id} className="flex items-center gap-3">
            {index > 0 ? (
              <span aria-hidden="true" className="text-ink-faint">
                →
              </span>
            ) : null}
            <Link
              href={`/work/${project.id}`}
              title={project.title}
              className="meta whitespace-nowrap text-ink-muted transition-colors hover:text-ink"
            >
              {project.chapter}
            </Link>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
