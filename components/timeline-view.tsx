import { ProjectCard, stamp } from "./project-card";
import type { Project } from "@/lib/projects";

/** Splits the (already chronological) list into year groups for the rail. */
function byYear(list: Project[]) {
  const groups: { year: string; items: Project[] }[] = [];

  for (const project of list) {
    const year = project.start.slice(0, 4);
    const last = groups.at(-1);
    if (last?.year === year) last.items.push(project);
    else groups.push({ year, items: [project] });
  }

  return groups;
}

/**
 * The archive as it actually happened: oldest first, grouped by year, hung off
 * a single hairline spine.
 *
 * This is the default view at every screen size. It is the one that survives
 * having no hover and no pointer — on a phone it is simply a vertical history,
 * which is the right shape for the content rather than a shrunken diagram.
 */
export function TimelineView({
  projects,
  activeId,
  connected,
  onActivate,
  onClear,
}: {
  projects: Project[];
  activeId: string | null;
  /** Ids one hop from `activeId`, including itself. */
  connected: Set<string>;
  onActivate: (id: string) => void;
  onClear: () => void;
}) {
  const groups = byYear(projects);

  if (projects.length === 0) {
    return (
      <p className="meta py-16 text-center text-ink-faint">
        No projects match this filter
      </p>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <section key={group.year} aria-label={group.year}>
          <div className="flex items-baseline gap-5 border-t border-rule pt-3">
            <span className="font-mono text-[13px] tracking-tight text-ink-faint">
              {group.year}
            </span>
            <span className="meta-sm text-ink-faint">
              {group.items.length}{" "}
              {group.items.length === 1 ? "project" : "projects"}
            </span>
          </div>

          <ul className="mt-2">
            {group.items.map((project) => {
              const dimmed = Boolean(activeId) && !connected.has(project.id);

              return (
                <li
                  key={project.id}
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)] md:grid-cols-[7rem_2.5rem_minmax(0,1fr)]"
                >
                  {/* Date rail — desktop only; on narrow screens the stamp on
                      the card itself carries the date. */}
                  <div className="hidden pr-6 pt-8 text-right md:block">
                    <span
                      className={`meta-sm transition-opacity duration-300 ${
                        dimmed ? "text-ink-faint opacity-40" : "text-ink-muted"
                      }`}
                    >
                      {stamp(project.start)}
                    </span>
                  </div>

                  {/* Spine, node and the short connector out to the card. */}
                  <div aria-hidden="true" className="relative">
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-rule" />
                    <span
                      className={`node node-${project.status} absolute left-1/2 top-[2.35rem] -translate-x-1/2 text-ink shadow-[0_0_0_4px_var(--paper)] transition-opacity duration-300 ${
                        dimmed ? "opacity-40" : ""
                      }`}
                    />
                    <span className="absolute left-1/2 top-[2.6rem] h-px w-[calc(50%-0.25rem)] bg-rule" />
                  </div>

                  <div className="min-w-0 py-4">
                    <ProjectCard
                      project={project}
                      layout="row"
                      dimmed={dimmed}
                      onActivate={() => onActivate(project.id)}
                      onClear={onClear}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
