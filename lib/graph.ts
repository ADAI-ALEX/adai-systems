import { edges, projects, type Project } from "./projects";

/** The canvas every hand-placed node coordinate is expressed in. */
export const CANVAS = { width: 1000, height: 560 } as const;

export type PlacedProject = Project & {
  node: NonNullable<Project["node"]>;
};

/** Projects that have a position, i.e. everything the graph can draw. */
export const placedProjects: PlacedProject[] = projects.filter(
  (project): project is PlacedProject => Boolean(project.node),
);

export type PlacedEdge = {
  id: string;
  source: PlacedProject;
  target: PlacedProject;
  path: string;
};

/**
 * A quadratic curve between two nodes, bowed away from the middle of the
 * canvas.
 *
 * Straight lines were the first attempt and they do not work here: the hub has
 * six edges leaving it, and the long ones ran within ~40px of the nodes they
 * passed. Bowing each edge outward by a fixed fraction of its own length moves
 * the long edges clear of the crowded centre while leaving short edges almost
 * straight — and it reads as drawn rather than computed, which is the point.
 */
export function edgePath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  bow = 0.09,
): string {
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;

  // Unit normal to the chord, flipped so it always points away from centre.
  let normalX = -dy / length;
  let normalY = dx / length;
  const fromCentreX = midX - CANVAS.width / 2;
  const fromCentreY = midY - CANVAS.height / 2;
  if (normalX * fromCentreX + normalY * fromCentreY < 0) {
    normalX = -normalX;
    normalY = -normalY;
  }

  const offset = length * bow;
  const controlX = midX + normalX * offset;
  const controlY = midY + normalY * offset;

  return `M ${a.x} ${a.y} Q ${controlX} ${controlY} ${b.x} ${b.y}`;
}

/** Rough path length, used to seed the draw-in animation's dash offset. */
export function edgeLength(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.round(Math.hypot(b.x - a.x, b.y - a.y) * 1.06);
}

/**
 * The control point of an edge's curve, which is what actually decides how far
 * outside the node bounding box the drawing reaches.
 */
function controlPoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
  bow = 0.09,
) {
  const [, , controlX, controlY] = edgePath(a, b, bow)
    .split(" ")
    .filter((token) => token !== "M" && token !== "Q")
    .map(Number);
  return { x: controlX, y: controlY };
}

/** Every edge whose endpoints are both placed, ready to draw. */
export const placedEdges: PlacedEdge[] = edges.flatMap((edge) => {
  const source = placedProjects.find((project) => project.id === edge.source);
  const target = placedProjects.find((project) => project.id === edge.target);
  if (!source || !target) return [];

  return [
    {
      id: `${edge.source}--${edge.target}`,
      source,
      target,
      path: edgePath(source.node, target.node),
    },
  ];
});

/**
 * The box the drawing actually occupies, padded.
 *
 * The 1000 x 560 canvas has margins the layout never uses, and an ambient
 * figure that keeps them sits in a pocket of dead space inside its own column.
 * This is the tight viewBox: nodes plus the control points the curves bow out
 * to, plus room for the node radius.
 */
export const contentBounds = (() => {
  const points = [
    ...placedProjects.map((project) => project.node),
    ...placedEdges.map((edge) => controlPoint(edge.source.node, edge.target.node)),
  ];

  const pad = 26;
  const minX = Math.min(...points.map((p) => p.x)) - pad;
  const minY = Math.min(...points.map((p) => p.y)) - pad;
  const maxX = Math.max(...points.map((p) => p.x)) + pad;
  const maxY = Math.max(...points.map((p) => p.y)) + pad;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
  };
})();

/**
 * `contentBounds` grown to make room for the labels the interactive view hangs
 * off each node. Without it the network sits in the middle of a box sized for a
 * canvas whose margins nothing occupies, and the diagram renders far smaller
 * than the space it was given.
 */
export const labelBounds = (() => {
  const padX = 56;
  const padY = 30;
  return {
    x: contentBounds.x - padX,
    y: contentBounds.y - padY,
    width: contentBounds.width + padX * 2,
    height: contentBounds.height + padY * 2,
    viewBox: `${contentBounds.x - padX} ${contentBounds.y - padY} ${
      contentBounds.width + padX * 2
    } ${contentBounds.height + padY * 2}`,
  };
})();
