"use client";

import { useMemo, useState } from "react";
import { NetworkView } from "./network-view";
import { TimelineView } from "./timeline-view";
import {
  neighbours,
  projectsByDate,
  researchProjects,
  type Project,
} from "@/lib/projects";

const RESEARCH_IDS = new Set(researchProjects.map((project) => project.id));

/**
 * Six ways to cut the archive.
 *
 * "Archived" covers discontinued and on-hold together, because the difference
 * between them matters on a project page and not in a filter bar.
 */
const filters: { id: string; label: string; match: (p: Project) => boolean }[] =
  [
    { id: "all", label: "All", match: () => true },
    { id: "active", label: "Active", match: (p) => p.status === "active" },
    {
      id: "products",
      label: "Products",
      match: (p) => p.type === "consumer" || p.type === "platform",
    },
    { id: "research", label: "Research", match: (p) => RESEARCH_IDS.has(p.id) },
    {
      id: "archived",
      label: "Archived",
      match: (p) => p.status === "discontinued" || p.status === "on-hold",
    },
    { id: "private", label: "Private", match: (p) => p.status === "private" },
  ];

type View = "timeline" | "network";

/**
 * The project explorer: one archive, two readings of it.
 *
 * `activeId` is the single piece of state that makes the directory feel like a
 * system rather than a list. Hovering or focusing any project — in either view
 * — lights that project and everything one edge away from it, and recedes the
 * rest. The relationship is the same data in both views; only the drawing
 * changes.
 */
export function Explorer() {
  const [filterId, setFilterId] = useState("all");
  const [view, setView] = useState<View>("timeline");
  const [activeId, setActiveId] = useState<string | null>(null);

  const filter = filters.find((f) => f.id === filterId) ?? filters[0];
  const visible = useMemo(
    () => projectsByDate.filter(filter.match),
    [filter],
  );
  const visibleIds = useMemo(
    () => new Set(visible.map((project) => project.id)),
    [visible],
  );

  /** The lit set: the active project plus its direct neighbours. */
  const connected = useMemo(() => {
    if (!activeId) return new Set<string>();
    const set = neighbours(activeId);
    set.add(activeId);
    return set;
  }, [activeId]);

  return (
    <div>
      <div className="mt-10 flex flex-col gap-5 border-y border-rule py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        {/* Filters. Scrolls rather than wraps on narrow screens so the row
            stays one line and the bar keeps its height. */}
        <div
          role="group"
          aria-label="Filter projects"
          className="-mx-5 flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {filters.map((option) => {
            const count = projectsByDate.filter(option.match).length;
            const current = option.id === filterId;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilterId(option.id)}
                aria-pressed={current}
                className={`meta flex shrink-0 items-baseline gap-1.5 whitespace-nowrap border-b-2 pb-1 pt-1 transition-colors ${
                  current
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-faint hover:text-ink-muted"
                }`}
              >
                {option.label}
                <span className="meta-sm text-ink-faint">
                  {String(count).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>

        {/* View toggle. Timeline is the default everywhere. */}
        <div
          role="group"
          aria-label="View"
          className="flex shrink-0 self-start rounded-full border border-rule p-1 lg:self-auto"
        >
          {(["timeline", "network"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              aria-pressed={view === option}
              className={`meta-sm rounded-full px-4 py-2 transition-colors ${
                view === option
                  ? "bg-ink text-ink-inverse"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {view === "timeline" ? (
          <TimelineView
            projects={visible}
            activeId={activeId}
            connected={connected}
            onActivate={setActiveId}
            onClear={() => setActiveId(null)}
          />
        ) : (
          <NetworkView
            visibleIds={visibleIds}
            activeId={activeId}
            connected={connected}
            onActivate={setActiveId}
            onClear={() => setActiveId(null)}
          />
        )}
      </div>
    </div>
  );
}
