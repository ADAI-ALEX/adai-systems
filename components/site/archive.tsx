"use client";

import Link from "next/link";
import { useArchive } from "@/components/shared/use-archive";

/** The archive as a directory listing. Every row opens its case study. */
export function Archive() {
  const { active, setActive, visible, filters, total } = useArchive();

  return (
    <div className="ls">
      <div className="chips filters" role="group" aria-label="Filter the archive">
        {filters.map((filter) => (
          <button key={filter.id} type="button" aria-pressed={active === filter.id} onClick={() => setActive(filter.id)}>
            {filter.label.toLowerCase()}
          </button>
        ))}
        <span className="count" aria-live="polite">
          {visible.length} of {total}
        </span>
      </div>
      <table className="ls-table">
        <caption className="sr-only">Every project, newest first</caption>
        <thead>
          <tr>
            <th scope="col">when</th>
            <th scope="col">name</th>
            <th scope="col">kind</th>
            <th scope="col">status</th>
            <th scope="col" className="ls-wide">
              what
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((project) => (
            <tr key={project.slug}>
              <td className="t-dim">{project.start.replace("-", ".")}</td>
              <th scope="row">
                <Link href={`/work/${project.slug}`}>{project.title}</Link>
              </th>
              <td className="t-dim">{project.kindLabel.toLowerCase()}</td>
              <td>
                <span className={`dot dot-${project.status}`} aria-hidden="true" />
                {project.statusLabel.toLowerCase()}
              </td>
              <td className="ls-wide t-dim">{project.pitch}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
