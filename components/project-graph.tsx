import { edgePath, placedProjects } from "@/lib/graph";
import { neighbours, type Project } from "@/lib/projects";

/** Wrap a title so no line runs much past this, in characters. */
const LINE_LENGTH = 14;

/** Greedy wrap. Titles here are two or three words, so this is enough. */
function wrapTitle(title: string): string[] {
  const words = title.toUpperCase().split(" ");
  const lines: string[] = [];

  for (const word of words) {
    const last = lines.at(-1);
    if (last && `${last} ${word}`.length <= LINE_LENGTH) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }

  return lines.slice(0, 2);
}

/**
 * A project's own neighbourhood, cut out of the main map.
 *
 * It reuses the real coordinates and the real edge curves, so a project's local
 * diagram is literally a detail of the network view rather than a second,
 * separate drawing. It is also what stands in for imagery on projects with
 * nothing public to show: an honest diagram of where the work sits, instead of
 * a fabricated screenshot of a product nobody can open.
 *
 * Everything is sized from the viewBox rather than in fixed user units. The
 * figure sits in a ~256px sidebar and each project's neighbourhood spans a
 * different slice of the canvas, so fixed sizes rendered anywhere between
 * unreadable and enormous depending on which project you were looking at.
 * Solving for the font size that lands at ~10px rendered keeps every project's
 * diagram identical in weight:
 *
 *   fontSize = (nodeSpan + 20) / 16.92
 *
 * which is the fixed point of `fontSize = viewBoxWidth / 25.6` once the padding
 * needed for the labels is folded back in.
 */
export function ProjectGraph({ project }: { project: Project }) {
  const near = neighbours(project.id);
  const shown = placedProjects.filter(
    (p) => p.id === project.id || near.has(p.id),
  );
  if (shown.length < 2) return null;

  const xs = shown.map((p) => p.node.x);
  const ys = shown.map((p) => p.node.y);
  const nodeSpan = Math.max(...xs) - Math.min(...xs);

  const font = (nodeSpan + 20) / 16.92;
  const padX = LINE_LENGTH * 0.62 * font * 0.5 + 10;
  const padY = 3.6 * font;

  const minX = Math.min(...xs) - padX;
  const minY = Math.min(...ys) - padY;
  const width = Math.max(...xs) + padX - minX;
  const height = Math.max(...ys) + padY - minY;

  const focusRadius = 0.45 * font;
  const nodeRadius = 0.3 * font;
  const lineHeight = 1.15 * font;

  const localEdges = shown.flatMap((a) =>
    shown
      .filter((b) => a.id < b.id && neighbours(a.id).has(b.id))
      .map((b) => ({
        id: `${a.id}--${b.id}`,
        d: edgePath(a.node, b.node),
        live: a.id === project.id || b.id === project.id,
      })),
  );

  return (
    <svg
      viewBox={`${minX} ${minY} ${width} ${height}`}
      role="img"
      aria-label={`${project.title} and the ${shown.length - 1} projects it connects to`}
      className="h-auto w-full"
    >
      <g fill="none" vectorEffect="non-scaling-stroke">
        {localEdges.map((edge) => (
          <path
            key={edge.id}
            d={edge.d}
            stroke={edge.live ? "var(--ink)" : "var(--rule-strong)"}
            strokeWidth={edge.live ? 1.5 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>

      {shown.map((node) => {
        const isFocus = node.id === project.id;
        const above = node.node.label === "top";
        const lines = wrapTitle(node.title);
        // Baseline of the last line, then work upwards for the line above it.
        const lastBaseline = above
          ? node.node.y - 1.0 * font
          : node.node.y + 1.55 * font + (lines.length - 1) * lineHeight;

        return (
          <g key={node.id}>
            <circle
              cx={node.node.x}
              cy={node.node.y}
              r={isFocus ? focusRadius : nodeRadius}
              fill={isFocus ? "var(--ink)" : "var(--paper-raised)"}
              stroke={isFocus ? "var(--ink)" : "var(--ink-faint)"}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            {lines.map((line, index) => (
              <text
                key={line}
                x={node.node.x}
                y={lastBaseline - (lines.length - 1 - index) * lineHeight}
                textAnchor="middle"
                fill={isFocus ? "var(--ink)" : "var(--ink-faint)"}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: font,
                  letterSpacing: font * 0.08,
                }}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
