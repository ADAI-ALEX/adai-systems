"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { labelBounds, placedEdges, placedProjects } from "@/lib/graph";
import { getProject, statusLabel } from "@/lib/projects";

/** Where the graph sits when it is wider than the screen and has to be panned. */
const NARROW_WIDTH = 880;

/**
 * The archive as relationships rather than as chronology.
 *
 * Edges are hairline curves; nodes are real links, so every one of them is
 * focusable, tabbable and openable in a new tab — the diagram is navigation,
 * not a picture of navigation. Hovering or focusing a node lights its
 * neighbours and recedes everything else.
 *
 * Below ~900px the canvas is wider than the viewport and pans horizontally,
 * opening centred on the hub. That is deliberate: squeezing eight labelled
 * nodes into a phone width makes an unreadable diagram, and the timeline —
 * which is the default view — is the better vertical answer to the same data.
 */
export function NetworkView({
  visibleIds,
  activeId,
  connected,
  onActivate,
  onClear,
}: {
  /** Ids passing the current filter. Non-matching nodes recede but stay drawn,
      because removing them would leave edges pointing at nothing. */
  visibleIds: Set<string>;
  activeId: string | null;
  connected: Set<string>;
  onActivate: (id: string) => void;
  onClear: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const active = activeId ? getProject(activeId) : undefined;

  // Open centred rather than at the left edge, so a phone lands on the hub.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  }, []);

  const isLit = (id: string) => !activeId || connected.has(id);

  return (
    <div>
      <div
        ref={scrollerRef}
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          className="relative mx-auto"
          style={{
            width: "100%",
            minWidth: NARROW_WIDTH,
            aspectRatio: `${labelBounds.width} / ${labelBounds.height}`,
          }}
        >
          <svg
            viewBox={labelBounds.viewBox}
            aria-hidden="true"
            focusable="false"
            className="absolute inset-0 h-full w-full"
          >
            <g fill="none" strokeWidth={1}>
              {placedEdges.map((edge) => {
                const touchesActive =
                  activeId === edge.source.id || activeId === edge.target.id;
                const faded =
                  (activeId !== null && !touchesActive) ||
                  (!visibleIds.has(edge.source.id) &&
                    !visibleIds.has(edge.target.id));

                return (
                  <path
                    key={edge.id}
                    d={edge.path}
                    stroke={touchesActive ? "var(--ink)" : "var(--rule-strong)"}
                    strokeWidth={touchesActive ? 1.5 : 1}
                    opacity={faded ? 0.3 : 1}
                    className="transition-[opacity,stroke-width] duration-300"
                  />
                );
              })}
            </g>
          </svg>

          {placedProjects.map((project) => {
            const lit = isLit(project.id) && visibleIds.has(project.id);
            const labelAbove = project.node.label === "top";

            return (
              <Link
                key={project.id}
                href={`/work/${project.id}`}
                onMouseEnter={() => onActivate(project.id)}
                onMouseLeave={onClear}
                onFocus={() => onActivate(project.id)}
                onBlur={onClear}
                style={{
                  left: `${((project.node.x - labelBounds.x) / labelBounds.width) * 100}%`,
                  top: `${((project.node.y - labelBounds.y) / labelBounds.height) * 100}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
                  lit ? "opacity-100" : "opacity-30"
                }`}
              >
                {/* 44px box so the dot keeps a real tap target while staying
                    exactly on its coordinate. */}
                <span className="relative flex h-11 w-11 items-center justify-center [--node-size:0.8125rem]">
                  <span
                    className={`node node-${project.status} text-ink shadow-[0_0_0_4px_var(--paper)] transition-transform duration-300 ${
                      activeId === project.id ? "scale-125" : ""
                    }`}
                  />
                  <span
                    className={`meta-sm absolute left-1/2 w-36 -translate-x-1/2 text-center transition-colors duration-300 ${
                      activeId === project.id ? "text-ink" : "text-ink-muted"
                    } ${labelAbove ? "bottom-full mb-1" : "top-full mt-1"}`}
                  >
                    {project.title}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Readout. The diagram stays free of tooltips; whatever is under the
          pointer is described here instead, in a fixed slot that does not move
          the layout when it changes. */}
      <div className="mt-4 flex min-h-[4.5rem] items-start gap-4 border-t border-rule pt-4 sm:min-h-[4rem]">
        {active ? (
          <>
            <span className="meta-sm shrink-0 pt-px text-ink-faint">
              {String(placedProjects.findIndex((p) => p.id === active.id) + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="meta text-ink">
                {active.title}
                <span className="text-ink-faint">
                  {" "}
                  · {active.typeLabel} · {statusLabel(active)}
                </span>
              </p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">
                {active.short}
              </p>
            </div>
          </>
        ) : (
          <p className="meta-sm text-ink-faint">
            Every line is a relationship · Select a node to open the project
          </p>
        )}
      </div>
    </div>
  );
}
