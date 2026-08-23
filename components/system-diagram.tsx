import {
  contentBounds,
  edgeLength,
  placedEdges,
  placedProjects,
} from "@/lib/graph";

/**
 * The hero's background: the real project graph, drawn at the weight of a
 * pencil guide.
 *
 * It is deliberately the *same* geometry the network view uses further down the
 * page, so scrolling resolves a faint diagram into the thing it was a diagram
 * of. Nothing here glows, drifts or particles — it is a technical drawing, and
 * it holds still once it has been drawn.
 */
export function SystemDiagram({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={contentBounds.viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <g
        stroke="var(--rule-strong)"
        fill="none"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      >
        {placedEdges.map((edge, index) => (
          <path
            key={edge.id}
            d={edge.path}
            className="draw-line"
            style={
              {
                "--len": edgeLength(edge.source.node, edge.target.node),
                "--enter-delay": `${240 + index * 55}ms`,
              } as React.CSSProperties
            }
          />
        ))}
      </g>

      {placedProjects.map((project, index) => {
        const live = project.status === "active";
        return (
          <g
            key={project.id}
            className="fade-node"
            style={
              { "--enter-delay": `${820 + index * 60}ms` } as React.CSSProperties
            }
          >
            <circle
              cx={project.node.x}
              cy={project.node.y}
              r={live ? 9 : 6.5}
              fill={live ? "var(--ink)" : "var(--paper)"}
              stroke={live ? "var(--ink)" : "var(--ink-faint)"}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
}
