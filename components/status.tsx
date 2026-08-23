import {
  STATUS_MEANING,
  statusLabel,
  type Project,
  type ProjectStatus,
} from "@/lib/projects";

/**
 * The status glyph: a small mark whose *shape* encodes the status, so the
 * archive stays readable in pure monochrome and a discontinued project is
 * never coloured like a warning.
 *
 * Live work is the only filled mark, and the only one that moves.
 */
export function StatusMark({
  status,
  className = "",
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`node node-${status} ${className}`}
    />
  );
}

/**
 * Glyph plus wording, e.g. "● ACTIVE" or "○ DISCONTINUED · MAY RETURN".
 *
 * `title` carries the plain-English meaning so the vocabulary is explained on
 * hover without a legend cluttering every card.
 */
export function StatusLabel({
  project,
  className = "",
}: {
  project: Project;
  className?: string;
}) {
  return (
    <span
      title={STATUS_MEANING[project.status]}
      className={`meta-sm inline-flex items-center gap-2 whitespace-nowrap ${className}`}
    >
      <StatusMark status={project.status} />
      {statusLabel(project)}
    </span>
  );
}
