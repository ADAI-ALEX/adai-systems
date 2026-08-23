import Link from "next/link";
import { StatusLabel } from "./status";
import type { Project } from "@/lib/projects";

/** "2026-08" -> "08 / 2026". The archive's index number for a project. */
export function stamp(start: string): string {
  const [year, month] = start.split("-");
  return `${month} / ${year}`;
}

/**
 * One project in the directory, in one of two shapes.
 *
 * `block` stacks — for the two large "currently building" cards, which sit
 * side by side and want a tall column each.
 *
 * `row` splits the body into a title column and a description column. The
 * timeline hangs full-width cards off a spine, and a stacked layout left the
 * right two-thirds of every card empty: a catalogue entry, not a poster.
 *
 * `dimmed` is set by the explorer while a *different* project is hovered or
 * focused and this one is not connected to it. That is the whole relationship
 * mechanic: touch a node, and the work it came from stays lit while everything
 * unrelated recedes.
 */
export function ProjectCard({
  project,
  dimmed = false,
  size = "default",
  layout = "block",
  onActivate,
  onClear,
}: {
  project: Project;
  dimmed?: boolean;
  size?: "default" | "large";
  layout?: "block" | "row";
  onActivate?: () => void;
  onClear?: () => void;
}) {
  const large = size === "large";
  const row = layout === "row";

  const explore = (
    <span
      aria-hidden="true"
      className="meta-sm flex shrink-0 items-center gap-2 text-ink transition-transform duration-300 group-hover:translate-x-1"
    >
      Explore <span className="text-[13px] leading-none">→</span>
    </span>
  );

  const tags = (
    <p className="meta-sm min-w-0 text-ink-faint">
      {project.tags.slice(0, 3).join(" · ")}
    </p>
  );

  return (
    <Link
      href={`/work/${project.id}`}
      onMouseEnter={onActivate}
      onMouseLeave={onClear}
      onFocus={onActivate}
      onBlur={onClear}
      aria-label={`${project.title} — ${project.typeLabel}`}
      className={`group relative flex h-full flex-col rounded-2xl border border-rule bg-paper-raised transition-[border-color,opacity] duration-300 hover:border-ink-faint focus-visible:border-ink ${
        large ? "p-7 sm:p-9" : "p-6 sm:p-7"
      } ${dimmed ? "opacity-35" : "opacity-100"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="meta-sm text-ink-faint">{stamp(project.start)}</span>
        <StatusLabel project={project} className="text-ink-muted" />
      </div>

      {row ? (
        <div className="mt-7 grid flex-1 gap-x-12 gap-y-5 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          <div>
            <h3 className="text-[1.5rem] font-semibold leading-[1.06] tracking-[-0.03em] text-ink">
              {project.title}
            </h3>
            <p className="meta-sm mt-3 text-ink-faint">{project.typeLabel}</p>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <p className="max-w-[52ch] text-[1.0625rem] leading-relaxed text-ink-muted">
              {project.short}
            </p>
            <div className="flex items-end justify-between gap-8">
              {tags}
              {explore}
            </div>
          </div>
        </div>
      ) : (
        <>
          <h3
            className={`mt-7 font-semibold tracking-[-0.03em] text-ink ${
              large
                ? "text-[clamp(1.75rem,3.4vw,2.5rem)] leading-[1.02]"
                : "text-[1.5rem] leading-[1.06]"
            }`}
          >
            {project.title}
          </h3>

          <p className="meta-sm mt-3 text-ink-faint">{project.typeLabel}</p>

          <p
            className={`mt-5 text-ink-muted ${
              large
                ? "max-w-[46ch] text-[1.0625rem] leading-relaxed"
                : "text-[0.9375rem] leading-relaxed"
            }`}
          >
            {large ? project.summary : project.short}
          </p>

          <div className="mt-auto flex items-end justify-between gap-8 pt-8">
            {tags}
            {explore}
          </div>
        </>
      )}
    </Link>
  );
}
