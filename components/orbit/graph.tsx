"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { byDate, getProject, relations, type Project } from "@/content/projects";

/** `r` is the drawn radius. `c` is the space the disc and its label need. */
type Body = { slug: string; r: number; c: number; x: number; y: number; vx: number; vy: number; held: boolean };

const BASE = { width: 1000, height: 720 };
const LABEL = 36; // room kept under each disc for its name, up to two lines

/** Long names break onto two lines at the space nearest the middle. */
function labelLines(title: string): string[] {
  if (title.length <= 13 || !title.includes(" ")) return [title];
  const middle = title.length / 2;
  const spaces = [...title].flatMap((character, index) => (character === " " ? [index] : []));
  const cut = spaces.reduce((best, index) => (Math.abs(index - middle) < Math.abs(best - middle) ? index : best));
  return [title.slice(0, cut), title.slice(cut + 1)];
}

function radius(project: Project) {
  if (project.slug === "lockout" || project.slug === "glimmer") return 58;
  if (project.slug === "adai-systems" || project.slug === "jeb-depot") return 46;
  if (project.kind === "product" || project.kind === "demo") return 34;
  return 29;
}

/** A calm, repeatable starting layout: a golden-angle spiral in date order. */
function seed(width: number, height: number, scale: number): Body[] {
  return byDate.map((project, index) => {
    const angle = index * 2.39996;
    const distance = (60 + index * 21) * scale;
    const r = radius(project) * scale;
    const widest = Math.max(...labelLines(project.title).map((line) => line.length));
    return {
      slug: project.slug,
      r,
      c: Math.max(r, widest * 3.3),
      x: width / 2 + Math.cos(angle) * distance,
      y: height / 2 + Math.sin(angle) * distance * 0.8,
      vx: 0,
      vy: 0,
      held: false,
    };
  });
}

function step(bodies: Body[], width: number, height: number, alpha: number, scale: number) {
  const index = new Map(bodies.map((body, i) => [body.slug, i]));
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    // A light pull to the middle keeps the map on screen. It pulls harder across
    // the short side, so the layout stretches to fill a tall or a wide box.
    const lean = Math.max(0.5, Math.min(2, height / width));
    a.vx += (width / 2 - a.x) * 0.0035 * lean * alpha;
    a.vy += ((height - LABEL) / 2 - a.y) * (0.0035 / lean) * alpha;
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let distance = Math.hypot(dx, dy) || 0.01;
      const reach = a.r + b.r + 96 * scale;
      if (distance < reach * 2.6) {
        const push = ((reach * reach) / (distance * distance)) * 1.1 * alpha;
        dx /= distance;
        dy /= distance;
        a.vx -= dx * push;
        a.vy -= dy * push;
        b.vx += dx * push;
        b.vy += dy * push;
      }
      // Never let two discs or their labels overlap.
      const gap = a.c + b.c + 14 * scale + LABEL * 0.4;
      distance = Math.hypot(b.x - a.x, b.y - a.y) || 0.01;
      if (distance < gap) {
        const fix = (gap - distance) / 2;
        const ux = (b.x - a.x) / distance;
        const uy = (b.y - a.y) / distance;
        if (!a.held) {
          a.x -= ux * fix;
          a.y -= uy * fix;
        }
        if (!b.held) {
          b.x += ux * fix;
          b.y += uy * fix;
        }
      }
    }
  }
  for (const relation of relations) {
    const a = bodies[index.get(relation.from)!];
    const b = bodies[index.get(relation.to)!];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy) || 0.01;
    const rest = a.r + b.r + 104 * scale;
    const pull = (distance - rest) * 0.016 * alpha;
    a.vx += (dx / distance) * pull;
    a.vy += (dy / distance) * pull;
    b.vx -= (dx / distance) * pull;
    b.vy -= (dy / distance) * pull;
  }
  for (const body of bodies) {
    if (body.held) {
      body.vx = 0;
      body.vy = 0;
    } else {
      body.vx *= 0.8;
      body.vy *= 0.8;
      body.x += body.vx;
      body.y += body.vy;
    }
    body.x = Math.max(body.c + 6, Math.min(width - body.c - 6, body.x));
    body.y = Math.max(body.r + 6, Math.min(height - body.r - LABEL - 6, body.y));
  }
}

export function Graph() {
  const frame = useRef<HTMLDivElement>(null);
  const bodies = useRef<Body[]>(seed(BASE.width, BASE.height, 1));
  const nodeRefs = useRef(new Map<string, SVGGElement>());
  const edgeRefs = useRef<(SVGLineElement | null)[]>([]);
  const sim = useRef({ alpha: 0, raf: 0, width: BASE.width, height: BASE.height, scale: 1 });
  // What React renders from. The simulation then moves the DOM directly, and
  // the layout effect below re-applies live positions after every render.
  const [snapshot, setSnapshot] = useState(() => ({ ...BASE, bodies: seed(BASE.width, BASE.height, 1) }));
  const [selected, setSelected] = useState("glimmer");
  const [hovered, setHovered] = useState<string | null>(null);

  const paint = useCallback(() => {
    const lookup = new Map(bodies.current.map((body) => [body.slug, body]));
    for (const body of bodies.current) {
      nodeRefs.current.get(body.slug)?.setAttribute("transform", `translate(${body.x.toFixed(1)} ${body.y.toFixed(1)})`);
    }
    relations.forEach((relation, i) => {
      const line = edgeRefs.current[i];
      const a = lookup.get(relation.from);
      const b = lookup.get(relation.to);
      if (!line || !a || !b) return;
      line.setAttribute("x1", a.x.toFixed(1));
      line.setAttribute("y1", a.y.toFixed(1));
      line.setAttribute("x2", b.x.toFixed(1));
      line.setAttribute("y2", b.y.toFixed(1));
    });
  }, []);

  const run = useCallback(() => {
    const state = sim.current;
    if (state.raf) return;
    const loop = () => {
      step(bodies.current, state.width, state.height, state.alpha, state.scale);
      paint();
      state.alpha *= 0.985;
      const holding = bodies.current.some((body) => body.held);
      if (holding) state.alpha = Math.max(state.alpha, 0.35);
      state.raf = state.alpha > 0.02 || holding ? requestAnimationFrame(loop) : 0;
    };
    state.raf = requestAnimationFrame(loop);
  }, [paint]);

  const settle = useCallback(
    (ticks: number) => {
      const state = sim.current;
      for (let i = 0; i < ticks; i++) step(bodies.current, state.width, state.height, Math.max(0.05, 1 - i / ticks), state.scale);
      paint();
    },
    [paint],
  );

  // Fit the map to its box, settle most of the way before first paint, then let it ease in.
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layout = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      const scale = Math.max(0.5, Math.min(1.25, Math.sqrt((width * height) / (BASE.width * BASE.height))));
      const state = sim.current;
      cancelAnimationFrame(state.raf);
      Object.assign(state, { width, height, scale, raf: 0 });
      bodies.current = seed(width, height, scale);
      settle(reduce ? 520 : 220);
      setSnapshot({ width, height, bodies: bodies.current.map((body) => ({ ...body })) });
      if (!reduce) {
        state.alpha = 0.55;
        run();
      }
    };
    layout();
    let last = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (Math.abs(element.clientWidth - last) < 2) return;
      last = element.clientWidth;
      layout();
    });
    observer.observe(element);
    const state = sim.current;
    return () => {
      observer.disconnect();
      cancelAnimationFrame(state.raf);
      state.raf = 0;
    };
  }, [run, settle]);

  useLayoutEffect(paint);

  const drag = useRef<{ slug: string; moved: number; x: number; y: number } | null>(null);

  function toLocal(event: React.PointerEvent) {
    const box = frame.current!.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function onPointerDown(event: React.PointerEvent<SVGGElement>, slug: string) {
    const body = bodies.current.find((item) => item.slug === slug);
    if (!body) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = toLocal(event);
    drag.current = { slug, moved: 0, x: point.x, y: point.y };
    body.held = true;
  }

  function onPointerMove(event: React.PointerEvent<SVGGElement>) {
    const active = drag.current;
    if (!active) return;
    const body = bodies.current.find((item) => item.slug === active.slug);
    if (!body) return;
    const point = toLocal(event);
    active.moved += Math.hypot(point.x - active.x, point.y - active.y);
    active.x = point.x;
    active.y = point.y;
    body.x = point.x;
    body.y = point.y;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) settle(12);
    else {
      sim.current.alpha = Math.max(sim.current.alpha, 0.5);
      run();
    }
  }

  function onPointerUp(slug: string) {
    const active = drag.current;
    drag.current = null;
    const body = bodies.current.find((item) => item.slug === slug);
    if (body) body.held = false;
    if (active && active.moved < 6) setSelected(slug);
  }

  const focus = hovered ?? selected;
  const linked = useMemo(() => {
    const set = new Set<string>([focus]);
    for (const relation of relations) {
      if (relation.from === focus) set.add(relation.to);
      if (relation.to === focus) set.add(relation.from);
    }
    return set;
  }, [focus]);

  const project = getProject(selected);
  const connections = relations
    .filter((relation) => relation.from === selected || relation.to === selected)
    .map((relation) => ({
      other: getProject(relation.from === selected ? relation.to : relation.from),
      why: relation.why,
    }));
  const positions = new Map(snapshot.bodies.map((body) => [body.slug, body]));

  return (
    <div className="map">
      <div className="map-frame" ref={frame}>
        <svg
          viewBox={`0 0 ${snapshot.width} ${snapshot.height}`}
          width={snapshot.width}
          height={snapshot.height}
          role="group"
          aria-label="The studio's projects as a network. Each disc is a project, each line a link between two of them."
        >
          <g className="edges" aria-hidden="true">
            {relations.map((relation, i) => {
              const a = positions.get(relation.from)!;
              const b = positions.get(relation.to)!;
              const lit = relation.from === focus || relation.to === focus;
              return (
                <line
                  key={`${relation.from}-${relation.to}`}
                  ref={(element) => {
                    edgeRefs.current[i] = element;
                  }}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  data-lit={lit}
                />
              );
            })}
          </g>
          {byDate.map((item) => {
            const body = positions.get(item.slug)!;
            return (
              <g
                key={item.slug}
                ref={(element) => {
                  if (element) nodeRefs.current.set(item.slug, element);
                }}
                className="node"
                transform={`translate(${body.x} ${body.y})`}
                data-status={item.status}
                data-selected={item.slug === selected}
                data-dim={hovered !== null && !linked.has(item.slug)}
                role="button"
                tabIndex={0}
                aria-pressed={item.slug === selected}
                aria-label={`${item.title}. ${item.statusLabel}.`}
                onPointerDown={(event) => onPointerDown(event, item.slug)}
                onPointerMove={onPointerMove}
                onPointerUp={() => onPointerUp(item.slug)}
                onPointerCancel={() => onPointerUp(item.slug)}
                onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(item.slug)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(item.slug)}
                onBlur={() => setHovered(null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(item.slug);
                  }
                }}
              >
                <circle className="halo" r={body.r + 9} />
                <circle className="disc" r={body.r} />
                <text y={body.r + 18} textAnchor="middle">
                  {labelLines(item.title).map((line, index) => (
                    <tspan key={line} x={0} dy={index ? "1.15em" : 0}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <aside className="card" aria-live="polite">
        <p className="card-meta">
          <span className="chip" data-status={project.status}>
            {project.statusLabel}
          </span>
          <span>{project.dateLabel}</span>
        </p>
        <h2>{project.title}</h2>
        <p className="card-pitch">{project.pitch}</p>
        {project.links?.length ? (
          <p className="card-links">
            {project.links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </p>
        ) : null}
        {connections.length ? (
          <ul className="card-links-list">
            {connections.map(({ other, why }) => (
              <li key={other.slug}>
                <button
                  type="button"
                  onClick={() => setSelected(other.slug)}
                  onPointerEnter={() => setHovered(other.slug)}
                  onPointerLeave={() => setHovered(null)}
                >
                  {other.title}
                </button>
                <span>{why}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </aside>
    </div>
  );
}
