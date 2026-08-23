import { ImageResponse } from "next/og";
import { CANVAS, placedEdges, placedProjects } from "@/lib/graph";
import { siteConfig } from "@/lib/site-config";

export const alt = "ADAI Systems — Intelligent Software & Digital Products";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share card is the map, drawn at card scale.
 *
 * Edges are straight here rather than curved: the OG renderer supports a
 * narrow slice of SVG, and a chord is close enough to the real geometry at
 * this size. Everything else — the paper, the ink, the mono metadata — matches
 * the site.
 */
export default function OpengraphImage() {
  const scale = 0.62;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafafa",
          color: "#18181b",
          padding: 64,
          position: "relative",
        }}
      >
        <svg
          width={CANVAS.width * scale}
          height={CANVAS.height * scale}
          viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
          style={{ position: "absolute", right: -70, top: 96, opacity: 0.5 }}
        >
          {placedEdges.map((edge) => (
            <line
              key={edge.id}
              x1={edge.source.node.x}
              y1={edge.source.node.y}
              x2={edge.target.node.x}
              y2={edge.target.node.y}
              stroke="#d4d4d8"
              strokeWidth={2}
            />
          ))}
          {placedProjects.map((project) => (
            <circle
              key={project.id}
              cx={project.node.x}
              cy={project.node.y}
              r={project.status === "active" ? 10 : 7}
              fill={project.status === "active" ? "#18181b" : "#fafafa"}
              stroke={project.status === "active" ? "#18181b" : "#a1a1aa"}
              strokeWidth={3}
            />
          ))}
        </svg>

        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#52525b",
          }}
        >
          ADAI Systems
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -4,
              lineHeight: 1.02,
              maxWidth: 760,
            }}
          >
            Building intelligent software.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 28,
              color: "#52525b",
              maxWidth: 700,
            }}
          >
            An independent technology studio of AI systems, products and
            experiments.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "2px solid #e4e4e7",
            paddingTop: 24,
            fontSize: 20,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#a1a1aa",
          }}
        >
          <span>{siteConfig.url.replace("https://", "")}</span>
          <span>Est. 2024</span>
        </div>
      </div>
    ),
    size,
  );
}
