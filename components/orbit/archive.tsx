"use client";

import { useArchive } from "@/components/shared/use-archive";

/** The archive as a timeline on a single spine, filterable. */
export function OrbitArchive() {
  const { active, setActive, visible, filters, total } = useArchive();

  return (
    <div className="timeline">
      <div className="toggles" role="group" aria-label="Filter the archive">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={active === filter.id}
            onClick={() => setActive(filter.id)}
          >
            {filter.label}
          </button>
        ))}
        <span aria-live="polite">
          Showing {visible.length} of {total}
        </span>
      </div>
      <ol>
        {visible.map((project) => (
          <li key={project.slug} data-status={project.status}>
            <span className="t-date">{project.dateLabel}</span>
            <span className="t-disc" aria-hidden="true" />
            <div>
              <h3>{project.title}</h3>
              <p className="t-state">
                {project.statusLabel} · {project.kindLabel}
              </p>
              <p>{project.pitch}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
