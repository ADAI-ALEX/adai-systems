"use client";

import { useEffect, useRef } from "react";

const REST = { wdth: 100, wght: 760 };
const RADIUS = 0.3; // share of the headline's width the cursor reaches

/**
 * A headline whose letters stretch and thicken towards the cursor.
 *
 * Each row is fitted to the full width, then every letter's width and weight
 * axes are driven by its distance from the pointer. Widening is balanced
 * across the row (letters far from the cursor give a little back), so the
 * lines never reflow. Under reduced motion the headline simply rests.
 */
export function Kinetic({ lines, label }: { lines: string[]; label: string }) {
  const root = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const rows = [...element.querySelectorAll<HTMLElement>("[data-row]")];
    const letters = rows.map((row) => [...row.querySelectorAll<HTMLElement>("[data-ch]")]);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    type Point = { x: number; y: number };
    let centres: Point[][] = [];
    let state = letters.map((row) => row.map(() => ({ ...REST })));
    let pointer: Point | null = null;
    let frame = 0;
    let sweep = 0;

    const apply = () => {
      letters.forEach((row, r) =>
        row.forEach((letter, i) => {
          const { wdth, wght } = state[r][i];
          letter.style.fontVariationSettings = `"wdth" ${wdth.toFixed(1)}, "wght" ${wght.toFixed(0)}`;
        }),
      );
    };

    const fit = () => {
      state = letters.map((row) => row.map(() => ({ ...REST })));
      apply();
      const width = element.clientWidth;
      rows.forEach((row, r) => {
        row.style.fontSize = "100px";
        const natural = letters[r].reduce((sum, letter) => sum + letter.getBoundingClientRect().width, 0);
        row.style.fontSize = `${((100 * width) / natural) * 0.965}px`;
      });
      centres = letters.map((row) =>
        row.map((letter) => {
          const box = letter.getBoundingClientRect();
          return { x: box.left + box.width / 2 + window.scrollX, y: box.top + box.height / 2 + window.scrollY };
        }),
      );
      element.dataset.ready = "true";
    };

    const tick = () => {
      frame = 0;
      const reach = element.clientWidth * RADIUS;
      let moving = false;
      letters.forEach((row, r) => {
        const pull = row.map((_, i) => {
          if (!pointer) return 0;
          const distance = Math.hypot(pointer.x - centres[r][i].x, pointer.y - centres[r][i].y);
          return Math.max(0, 1 - distance / reach) ** 2;
        });
        const mean = pull.reduce((sum, value) => sum + value, 0) / pull.length;
        const rowPull = Math.min(1, Math.max(...pull) * 1.4);
        row.forEach((_, i) => {
          const target = {
            wdth: Math.max(55, Math.min(150, REST.wdth + 62 * (pull[i] - mean))),
            wght: REST.wght + rowPull * (340 + 560 * pull[i] - REST.wght),
          };
          const current = state[r][i];
          current.wdth += (target.wdth - current.wdth) * 0.2;
          current.wght += (target.wght - current.wght) * 0.2;
          if (Math.abs(target.wdth - current.wdth) > 0.2 || Math.abs(target.wght - current.wght) > 1) moving = true;
        });
      });
      apply();
      if (moving) frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onMove = (event: PointerEvent) => {
      if (reduce.matches) return;
      cancelAnimationFrame(sweep);
      pointer = { x: event.pageX, y: event.pageY };
      wake();
    };
    const onLeave = () => {
      pointer = null;
      wake();
    };

    // One pass across the middle line on load, so the effect announces itself.
    const intro = () => {
      if (reduce.matches || !centres[1]?.length) return;
      const first = centres[1][0];
      const last = centres[1][centres[1].length - 1];
      const started = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - started) / 1500);
        const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        pointer = { x: first.x + (last.x - first.x) * eased, y: first.y };
        wake();
        if (t < 1) sweep = requestAnimationFrame(step);
        else onLeave();
      };
      sweep = requestAnimationFrame(step);
    };

    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      fit();
      intro();
    });
    const observer = new ResizeObserver(() => {
      pointer = null;
      fit();
    });
    observer.observe(element);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerup", (event) => event.pointerType !== "mouse" && onLeave(), { passive: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(sweep);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <h1 className="kinetic" ref={root} aria-label={label}>
      {lines.map((line) => (
        <span
          key={line}
          data-row
          aria-hidden="true"
          style={{ "--n": line.length } as React.CSSProperties}
        >
          {[...line].map((character, index) => (
            <span key={index} data-ch>
              {character}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
