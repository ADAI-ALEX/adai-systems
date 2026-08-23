import Link from "next/link";
import { StatusLabel } from "./status";
import { stamp } from "./project-card";
import { relatedProjects, type Project } from "@/lib/projects";

/**
 * The edges of the graph, written out.
 *
 * A project page is the third view of the same relationships the timeline and
 * the network draw — which is what stops the archive being a list of unrelated
 * things that happened to the same studio.
 */
export function RelatedWork({ project }: { project: Project }) {
  const related = relatedProjects(project);
  if (related.length === 0) return null;

  return (
    <section className="border-t border-rule pt-10">
      <h2 className="meta text-ink-muted">Related work</h2>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((other) => (
          <li key={other.id}>
            <Link
              href={`/work/${other.id}`}
              className="group flex h-full flex-col rounded-2xl border border-rule bg-paper-raised p-6 transition-colors hover:border-ink-faint"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="meta-sm text-ink-faint">
                  {stamp(other.start)}
                </span>
                <StatusLabel project={other} className="text-ink-muted" />
              </div>
              <h3 className="mt-6 text-[1.125rem] font-semibold tracking-[-0.02em] text-ink">
                {other.title}
              </h3>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-muted">
                {other.short}
              </p>
              <span
                aria-hidden="true"
                className="meta-sm mt-auto flex items-center gap-2 pt-6 text-ink transition-transform duration-300 group-hover:translate-x-1"
              >
                Open <span className="text-[13px] leading-none">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
