"use client";

import { useState } from "react";
import { useArchive } from "@/components/shared/use-archive";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The lineage as a running band. It can be paused, and rests under reduced motion. */
export function Marquee({ items }: { items: string[] }) {
  const [paused, setPaused] = useState(false);
  const strip = (hidden: boolean) => (
    <ol aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
  return (
    <div className="marquee" data-paused={paused}>
      <div className="marquee-track">
        {strip(false)}
        {strip(true)}
      </div>
      <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
        {paused ? "Play" : "Pause"}
        <span className="sr-only"> the lineage band</span>
      </button>
    </div>
  );
}

/** The archive as an index, grouped by year, filterable. */
export function SpecArchive() {
  const { active, setActive, visible, filters, total } = useArchive();
  const years = [...new Set(visible.map((project) => project.start.slice(0, 4)))];

  return (
    <div className="index">
      <div className="chips" role="group" aria-label="Filter the archive">
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
          {visible.length} of {total}
        </span>
      </div>
      {years.map((year) => (
        <section className="year" key={year} aria-label={year}>
          <p className="year-mark" aria-hidden="true">
            {year}
          </p>
          <ul>
            {visible
              .filter((project) => project.start.startsWith(year))
              .map((project) => (
                <li key={project.slug}>
                  <span className="when">{MONTHS[Number(project.start.slice(5)) - 1]}</span>
                  <h3>{project.title}</h3>
                  <span className="state" data-status={project.status}>
                    {project.statusLabel}
                  </span>
                  <p>{project.pitch}</p>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
