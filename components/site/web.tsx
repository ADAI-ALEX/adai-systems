"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { byDate, getProject, relations, showcase, type Aspect } from "@/content/projects";
import { services } from "@/content/services";

/**
 * The web: ADAI Systems at the centre, four branches of work, and every
 * project hanging from its branch. Drawn on a canvas as a slowly turning
 * model you can drag, with a plain list of links underneath it for keyboards
 * and screen readers.
 */

type NodeKind = "core" | "aspect" | "project";
type WebNode = {
  id: string;
  kind: NodeKind;
  label: string;
  href: string;
  aspect?: Aspect;
  /** Model position. One unit is the radius of the outer ring. */
  x: number;
  y: number;
  z: number;
  size: number;
  parent?: string;
  note?: string;
  status?: string;
  thumb?: { src: string; alt: string; width: number; height: number; pixel: boolean };
};
type Edge = { a: string; b: string; kind: "trunk" | "branch" | "relation" | "also"; aspect?: Aspect };

const ANGLE: Record<Aspect, number> = { products: -42, research: 44, agents: 138, automation: 218 };
const HUE: Record<Aspect, string> = { agents: "--amber", automation: "--aqua", products: "--coral", research: "--sky" };
const rad = (degrees: number) => (degrees * Math.PI) / 180;
/** A repeatable pseudo-random number in [0, 1) from a string, so the layout never changes between visits. */
function seeded(text: string) {
  let hash = 2166136261;
  for (const character of text) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return ((hash >>> 0) % 10000) / 10000;
}

function build(): { nodes: WebNode[]; edges: Edge[] } {
  const core = getProject("adai-systems");
  const nodes: WebNode[] = [
    { id: core.slug, kind: "core", label: "ADAI Systems", href: "/studio", x: 0, y: 0, z: 0, size: 1, note: core.pitch },
  ];
  const edges: Edge[] = [];
  const big = new Set(showcase.map((project) => project.slug));

  for (const service of services) {
    const angle = rad(ANGLE[service.slug]);
    nodes.push({
      id: `aspect:${service.slug}`,
      kind: "aspect",
      label: service.title,
      href: `/services/${service.path}`,
      aspect: service.slug,
      x: Math.cos(angle) * 0.4,
      y: Math.sin(angle) * 0.4,
      z: (seeded(service.slug) - 0.5) * 0.12,
      size: 1,
      note: service.promise,
    });
    edges.push({ a: core.slug, b: `aspect:${service.slug}`, kind: "trunk", aspect: service.slug });

    const members = byDate.filter((project) => project.aspect === service.slug);
    const spread = Math.min(84, 22 * members.length);
    members.forEach((project, index) => {
      const offset = members.length === 1 ? 0 : (index / (members.length - 1) - 0.5) * spread;
      const theta = angle + rad(offset);
      const reach = 0.78 + (index % 2) * 0.17 + (seeded(project.slug) - 0.5) * 0.05;
      const shot = project.media?.find((media) => media.type !== "phone") ?? project.media?.[0];
      nodes.push({
        id: project.slug,
        kind: "project",
        label: project.title,
        href: `/work/${project.slug}`,
        aspect: service.slug,
        parent: `aspect:${service.slug}`,
        x: Math.cos(theta) * reach,
        y: Math.sin(theta) * reach,
        z: (seeded(`${project.slug}z`) - 0.5) * 0.42,
        size: big.has(project.slug) ? 1.5 : 1,
        note: project.pitch,
        status: project.statusLabel,
        thumb: shot
          ? { src: shot.src, alt: shot.alt, width: shot.width, height: shot.height, pixel: shot.type === "pixel" }
          : undefined,
      });
      edges.push({ a: `aspect:${service.slug}`, b: project.slug, kind: "branch", aspect: service.slug });
      for (const other of project.alsoProves ?? []) {
        edges.push({ a: project.slug, b: `aspect:${other}`, kind: "also", aspect: other });
      }
    });
  }
  for (const relation of relations) {
    if (relation.from === core.slug || relation.to === core.slug) continue;
    edges.push({ a: relation.from, b: relation.to, kind: "relation" });
  }
  return { nodes, edges };
}

const MODEL = build();
const DUST = Array.from({ length: 90 }, (_, index) => ({
  x: (seeded(`dx${index}`) - 0.5) * 3.2,
  y: (seeded(`dy${index}`) - 0.5) * 2.4,
  z: (seeded(`dz${index}`) - 0.5) * 1.6,
  a: 0.15 + seeded(`da${index}`) * 0.35,
}));

type Placed = { node: WebNode; sx: number; sy: number; scale: number; r: number };

export function Web({ mode = "hero" }: { mode?: "hero" | "full" }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [card, setCard] = useState<{ left: number; top: number; flip: boolean } | null>(null);
  const [filter, setFilter] = useState<Aspect | null>(null);
  const live = useRef({ active: null as string | null, filter: null as Aspect | null, focusId: null as string | null });
  const placed = useRef<Placed[]>([]);

  useEffect(() => {
    live.current.active = active;
    live.current.filter = filter;
  }, [active, filter]);

  useEffect(() => {
    const element = box.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    const maybe = surface.getContext("2d");
    if (!maybe) return;
    const context: CanvasRenderingContext2D = maybe;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const style = getComputedStyle(element);
    const colour = (name: string) => style.getPropertyValue(name).trim();
    const palette = {
      bone: colour("--bone"),
      mute: colour("--mute"),
      line: colour("--line-2"),
      ink: colour("--ink-0"),
      agents: colour(HUE.agents),
      automation: colour(HUE.automation),
      products: colour(HUE.products),
      research: colour(HUE.research),
    };
    const family = style.fontFamily;
    const monoFamily = colour("--mono") || family;

    let width = 0;
    let height = 0;
    let centreX = 0;
    let centreY = 0;
    let unit = 0;
    const view = { yaw: -0.18, pitch: 0.5, spin: 0, vyaw: 0, vpitch: 0, tyaw: 0, tpitch: 0 };
    const pointer = { x: -1, y: -1, down: false, moved: 0, lastX: 0, lastY: 0, type: "mouse" };
    let frame = 0;
    let running = false;
    let visible = true;
    let before = performance.now();
    let clock = 0;

    const resize = () => {
      const bounds = element.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * ratio);
      surface.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const wide = width > 900;
      if (mode === "hero") {
        centreX = wide ? width * 0.68 : width * 0.5;
        centreY = wide ? height * 0.52 : height * 0.5;
        unit = wide ? Math.min(width * 0.27, height * 0.43) : Math.min(width * 0.44, height * 0.43);
      } else {
        centreX = width * 0.5;
        centreY = height * 0.5;
        unit = Math.min(width * 0.4, height * 0.42);
      }
      draw(0);
    };

    const project = (x: number, y: number, z: number) => {
      // Spin in the plane, then tilt and turn the whole model.
      const cs = Math.cos(view.spin);
      const sn = Math.sin(view.spin);
      const x1 = x * cs - y * sn;
      const y1 = x * sn + y * cs;
      const cp = Math.cos(view.pitch + view.tpitch);
      const sp = Math.sin(view.pitch + view.tpitch);
      const y2 = y1 * cp - z * sp;
      const z2 = y1 * sp + z * cp;
      const cy = Math.cos(view.yaw + view.tyaw);
      const sy = Math.sin(view.yaw + view.tyaw);
      const x3 = x1 * cy + z2 * sy;
      const z3 = -x1 * sy + z2 * cy;
      const scale = 3 / (3 + z3);
      return { sx: centreX + x3 * unit * scale, sy: centreY + y2 * unit * scale, scale, depth: z3 };
    };

    const hueOf = (aspect?: Aspect) => (aspect ? palette[aspect] : palette.bone);

    function draw(delta: number) {
      clock += delta;
      context.clearRect(0, 0, width, height);
      const { active: activeId, filter: only } = live.current;
      const activeNode = activeId ? MODEL.nodes.find((node) => node.id === activeId) : undefined;
      const lit = (aspect?: Aspect) => {
        if (activeNode?.aspect) return aspect === activeNode.aspect;
        if (only) return aspect === only;
        return true;
      };
      const focusOn = Boolean(activeNode?.aspect || only);

      // Dust, for depth.
      for (const mote of DUST) {
        const point = project(mote.x, mote.y, mote.z);
        context.globalAlpha = mote.a * (focusOn ? 0.5 : 1);
        context.fillStyle = palette.mute;
        context.fillRect(point.sx, point.sy, 1.2 * point.scale, 1.2 * point.scale);
      }

      // Two orbits: where the branches sit and where the projects sit.
      context.lineWidth = 1;
      for (const [ring, alpha] of [
        [0.4, 0.5],
        [0.87, 0.32],
      ] as const) {
        context.beginPath();
        for (let step = 0; step <= 96; step++) {
          const angle = (step / 96) * Math.PI * 2;
          const point = project(Math.cos(angle) * ring, Math.sin(angle) * ring, 0);
          if (step) context.lineTo(point.sx, point.sy);
          else context.moveTo(point.sx, point.sy);
        }
        context.globalAlpha = alpha;
        context.strokeStyle = palette.line;
        context.stroke();
      }

      const at = new Map<string, Placed>();
      for (const node of MODEL.nodes) {
        const point = project(node.x, node.y, node.z);
        const base = node.kind === "core" ? unit * 0.085 : node.kind === "aspect" ? unit * 0.03 : unit * 0.021 * node.size;
        at.set(node.id, { node, sx: point.sx, sy: point.sy, scale: point.scale, r: Math.max(node.kind === "core" ? 16 : 4, base) * point.scale });
      }
      placed.current = [...at.values()];

      // Threads.
      for (const edge of MODEL.edges) {
        const a = at.get(edge.a)!;
        const b = at.get(edge.b)!;
        const on = edge.kind === "relation" ? !focusOn || edge.a === activeId || edge.b === activeId : lit(edge.aspect);
        context.beginPath();
        context.moveTo(a.sx, a.sy);
        if (edge.kind === "relation" || edge.kind === "also") {
          // Bow the thread towards the centre so it reads as a link, not a spoke.
          context.quadraticCurveTo(
            centreX + ((a.sx + b.sx) / 2 - centreX) * 0.62,
            centreY + ((a.sy + b.sy) / 2 - centreY) * 0.62,
            b.sx,
            b.sy,
          );
        } else context.lineTo(b.sx, b.sy);
        if (edge.kind === "trunk") {
          context.strokeStyle = hueOf(edge.aspect);
          context.globalAlpha = on ? 0.75 : 0.14;
          context.lineWidth = 1.5;
        } else if (edge.kind === "branch") {
          context.strokeStyle = hueOf(edge.aspect);
          context.globalAlpha = on ? 0.46 : 0.1;
          context.lineWidth = 1.1;
        } else if (edge.kind === "also") {
          context.strokeStyle = hueOf(edge.aspect);
          context.globalAlpha = on ? 0.16 : 0.04;
          context.lineWidth = 1;
          context.setLineDash([2, 5]);
        } else {
          const direct = edge.a === activeId || edge.b === activeId;
          context.strokeStyle = palette.bone;
          context.globalAlpha = direct ? 0.6 : on ? 0.1 : 0.03;
          context.lineWidth = direct ? 1.25 : 1;
        }
        context.stroke();
        context.setLineDash([]);
      }

      // Pulses: work moving outward from the centre along each branch.
      if (!reduce.matches) {
        for (const node of MODEL.nodes) {
          if (node.kind !== "project" || !node.parent) continue;
          const phase = (clock * 0.00012 + seeded(`${node.id}p`)) % 1;
          const core = at.get("adai-systems")!;
          const mid = at.get(node.parent)!;
          const end = at.get(node.id)!;
          const t = phase * 2;
          const from = t < 1 ? core : mid;
          const to = t < 1 ? mid : end;
          const k = t < 1 ? t : t - 1;
          const x = from.sx + (to.sx - from.sx) * k;
          const y = from.sy + (to.sy - from.sy) * k;
          const fade = Math.sin(phase * Math.PI);
          context.globalAlpha = (lit(node.aspect) ? 0.9 : 0.12) * fade;
          context.fillStyle = hueOf(node.aspect);
          context.beginPath();
          context.arc(x, y, 1.7, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha *= 0.25;
          context.beginPath();
          context.arc(x, y, 5, 0, Math.PI * 2);
          context.fill();
        }
      }

      // Nodes, far to near.
      const order = [...at.values()].sort((a, b) => a.scale - b.scale);
      context.textBaseline = "middle";
      for (const item of order) {
        const { node, sx, sy, r } = item;
        const on = node.kind === "core" ? true : lit(node.aspect);
        const isActive = node.id === activeId;
        const hue = hueOf(node.aspect);
        context.globalAlpha = on ? 1 : 0.22;
        if (node.kind === "core") {
          context.fillStyle = palette.bone;
          context.globalAlpha = 0.08;
          context.beginPath();
          context.arc(sx, sy, r * 2.1, 0, Math.PI * 2);
          context.fill();
          context.globalAlpha = 1;
          context.beginPath();
          context.arc(sx, sy, r, 0, Math.PI * 2);
          context.fill();
          // The ADAI mark, drawn small: a speech bubble with two eyes.
          context.fillStyle = palette.ink;
          const w = r * 1.18;
          const h = r * 0.62;
          context.beginPath();
          context.roundRect(sx - w / 2, sy - h / 2, w, h, h / 2);
          context.fill();
          context.fillStyle = palette.bone;
          for (const side of [-1, 1]) {
            context.beginPath();
            context.arc(sx + side * w * 0.2, sy, h * 0.2, 0, Math.PI * 2);
            context.fill();
          }
        } else if (node.kind === "aspect") {
          context.fillStyle = palette.ink;
          context.strokeStyle = hue;
          context.lineWidth = 1.75;
          context.beginPath();
          context.arc(sx, sy, r, 0, Math.PI * 2);
          context.fill();
          context.stroke();
          context.fillStyle = hue;
          context.beginPath();
          context.arc(sx, sy, r * 0.38, 0, Math.PI * 2);
          context.fill();
        } else {
          if (on) {
            context.globalAlpha = isActive ? 0.3 : 0.13;
            context.fillStyle = hue;
            context.beginPath();
            context.arc(sx, sy, r * 2.6, 0, Math.PI * 2);
            context.fill();
            context.globalAlpha = 1;
          }
          context.fillStyle = hue;
          context.beginPath();
          context.arc(sx, sy, r, 0, Math.PI * 2);
          context.fill();
        }
        if (isActive || node.id === live.current.focusId) {
          context.globalAlpha = 1;
          context.strokeStyle = palette.bone;
          context.lineWidth = 1.5;
          context.beginPath();
          context.arc(sx, sy, r + 6, 0, Math.PI * 2);
          context.stroke();
        }

        // Labels: branches always, projects always in the full view and on the active branch in the hero.
        const show =
          node.kind === "aspect" ||
          (node.kind === "project" && (mode === "full" || isActive || (activeNode?.aspect && node.aspect === activeNode.aspect) || (only && node.aspect === only)));
        if (!show || width < 520 && node.kind === "project" && !isActive && !focusOn) continue;
        const right = sx >= centreX;
        context.globalAlpha = on ? (node.kind === "aspect" ? 0.95 : 0.82) : 0.25;
        context.fillStyle = node.kind === "aspect" ? hue : palette.bone;
        context.font = node.kind === "aspect" ? `500 ${width < 520 ? 11 : 12}px ${monoFamily}` : `500 ${width < 520 ? 11 : 13}px ${family}`;
        context.textAlign = right ? "left" : "right";
        context.fillText(node.kind === "aspect" ? node.label.toUpperCase() : node.label, sx + (right ? r + 9 : -r - 9), sy);
      }
      context.globalAlpha = 1;
    }

    const hit = (x: number, y: number) => {
      let best: Placed | null = null;
      let bestDistance = Infinity;
      for (const item of placed.current) {
        const distance = Math.hypot(item.sx - x, item.sy - y) - item.r;
        if (distance < (pointer.type === "mouse" ? 14 : 22) && distance < bestDistance) {
          best = item;
          bestDistance = distance;
        }
      }
      return best;
    };

    const showCard = (item: Placed | null) => {
      if (!item) {
        setActive(null);
        setCard(null);
        return;
      }
      setActive(item.node.id);
      const flip = item.sx > width - 320;
      setCard({ left: Math.max(12, Math.min(width - 12, item.sx)), top: Math.max(12, Math.min(height - 12, item.sy)), flip });
    };

    const loop = (now: number) => {
      const delta = Math.min(50, now - before);
      before = now;
      const calm = reduce.matches;
      if (!pointer.down) {
        view.yaw += view.vyaw;
        view.pitch = Math.max(0.05, Math.min(1.05, view.pitch + view.vpitch));
        view.vyaw *= 0.93;
        view.vpitch *= 0.93;
        if (!calm && !live.current.active) view.spin += delta * 0.000028;
        if (!calm && pointer.x >= 0) {
          view.tyaw += (((pointer.x - centreX) / width) * 0.22 - view.tyaw) * 0.05;
          view.tpitch += (((pointer.y - centreY) / height) * -0.14 - view.tpitch) * 0.05;
        }
      }
      draw(delta);
      frame = running ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      before = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const local = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    const onMove = (event: PointerEvent) => {
      const point = local(event);
      pointer.type = event.pointerType;
      if (pointer.down) {
        const dx = point.x - pointer.lastX;
        const dy = point.y - pointer.lastY;
        pointer.moved += Math.abs(dx) + Math.abs(dy);
        if (pointer.moved > 6) {
          view.vyaw = dx * 0.004;
          view.vpitch = dy * 0.003;
          view.yaw += view.vyaw;
          view.pitch = Math.max(0.05, Math.min(1.05, view.pitch + view.vpitch));
          surface.style.cursor = "grabbing";
        }
        pointer.lastX = point.x;
        pointer.lastY = point.y;
        return;
      }
      pointer.x = point.x;
      pointer.y = point.y;
      if (event.pointerType !== "mouse") return;
      const found = hit(point.x, point.y);
      surface.style.cursor = found ? "pointer" : "grab";
      if ((found?.node.id ?? null) !== live.current.active) showCard(found);
    };
    const onDown = (event: PointerEvent) => {
      const point = local(event);
      pointer.type = event.pointerType;
      pointer.down = true;
      pointer.moved = 0;
      pointer.lastX = point.x;
      pointer.lastY = point.y;
      if (event.pointerType === "mouse") surface.setPointerCapture(event.pointerId);
    };
    const onUp = (event: PointerEvent) => {
      if (!pointer.down) return;
      pointer.down = false;
      surface.style.cursor = "grab";
      if (pointer.moved > 6) return;
      const point = local(event);
      const found = hit(point.x, point.y);
      if (!found) return showCard(null);
      // A mouse click opens the page. A tap shows the card first, which is itself the link.
      if (event.pointerType === "mouse" || live.current.active === found.node.id) router.push(found.node.href);
      else showCard(found);
    };
    const onLeave = () => {
      pointer.x = -1;
      pointer.down = false;
      if (pointer.type === "mouse") showCard(null);
    };

    // Keyboard: the link list under the canvas drives the same highlight.
    const onFocus = (event: FocusEvent) => {
      const id = (event.target as HTMLElement).dataset?.node;
      if (!id) return;
      live.current.focusId = id;
      showCard(placed.current.find((item) => item.node.id === id) ?? null);
    };
    const onBlur = () => {
      live.current.focusId = null;
      showCard(null);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    watcher.observe(element);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    surface.addEventListener("pointermove", onMove);
    surface.addEventListener("pointerdown", onDown);
    surface.addEventListener("pointerup", onUp);
    surface.addEventListener("pointercancel", onLeave);
    surface.addEventListener("pointerleave", onLeave);
    element.addEventListener("focusin", onFocus);
    element.addEventListener("focusout", onBlur);
    document.fonts.ready.then(() => draw(0));
    resize();
    start();

    return () => {
      stop();
      observer.disconnect();
      watcher.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerdown", onDown);
      surface.removeEventListener("pointerup", onUp);
      surface.removeEventListener("pointercancel", onLeave);
      surface.removeEventListener("pointerleave", onLeave);
      element.removeEventListener("focusin", onFocus);
      element.removeEventListener("focusout", onBlur);
    };
  }, [mode, router]);

  const node = useMemo(() => MODEL.nodes.find((item) => item.id === active), [active]);

  return (
    <div className="web" data-mode={mode} ref={box}>
      <canvas ref={canvas} aria-hidden="true" />

      {node && card ? (
        <Link
          className="web-card"
          href={node.href}
          data-hue={node.aspect}
          data-flip={card.flip}
          style={{ left: card.left, top: card.top }}
          tabIndex={-1}
        >
          {node.thumb ? (
            <Image
              className={node.thumb.pixel ? "pixel" : undefined}
              src={node.thumb.src}
              alt=""
              width={node.thumb.width}
              height={node.thumb.height}
              sizes="280px"
            />
          ) : null}
          <span className="web-card-body">
            <span className="web-card-title">{node.label}</span>
            {node.status ? <span className="meta">{node.status}</span> : null}
            <span className="web-card-note">{node.note}</span>
            <span className="meta hue">
              {node.kind === "project" ? "Open the case study" : node.kind === "aspect" ? "See this service" : "About the studio"} →
            </span>
          </span>
        </Link>
      ) : null}

      {mode === "full" ? (
        <div className="web-legend" role="group" aria-label="Highlight a branch">
          {services.map((service) => (
            <button
              key={service.slug}
              type="button"
              data-hue={service.slug}
              aria-pressed={filter === service.slug}
              onClick={() => setFilter((current) => (current === service.slug ? null : service.slug))}
            >
              {service.short}
            </button>
          ))}
        </div>
      ) : null}

      {/* The same web as plain links, for keyboards and screen readers. */}
      <nav className="web-links" aria-label="The web, as a list">
        <ul>
          {MODEL.nodes.map((item) => (
            <li key={item.id}>
              <Link href={item.href} data-node={item.id}>
                {item.label}
                {item.kind === "aspect" ? " (service)" : item.status ? `, ${item.status}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
