"use client";

import { useEffect, useRef, useState } from "react";

export type Direction = {
  id: string;
  letter: string;
  name: string;
  concept: string;
  rationale: string;
  specs: { label: string; value: string }[];
  swatches: string[];
  strengths: string[];
  risks: string[];
};

const VIEW = {
  desktop: { width: 1440, height: 960 },
  mobile: { width: 390, height: 760 },
} as const;

type Mode = keyof typeof VIEW;

/** One live, scrollable preview, scaled to fit its column. */
function Frame({ direction, mode }: { direction: Direction; mode: Mode }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(mode === "desktop" ? 0.3 : 1);
  const view = VIEW[mode];

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const fit = () => setScale(Math.min(1, element.clientWidth / view.width));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [view.width]);

  return (
    <div className="frame" ref={box} style={{ height: view.height * scale }} data-mode={mode}>
      <iframe
        src={`/directions/${direction.id}`}
        title={`Direction ${direction.letter}: ${direction.name}, live preview`}
        width={view.width}
        height={view.height}
        loading="lazy"
        style={{ transform: `scale(${scale})` }}
      />
    </div>
  );
}

export function Frames({ directions }: { directions: Direction[] }) {
  const [mode, setMode] = useState<Mode>("desktop");

  return (
    <>
      <div className="switch" role="group" aria-label="Preview size">
        {(Object.keys(VIEW) as Mode[]).map((option) => (
          <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)}>
            {option === "desktop" ? "Desktop, 1440 wide" : "Phone, 390 wide"}
          </button>
        ))}
      </div>
      <div className="columns">
        {directions.map((direction) => (
          <article key={direction.id} className="column">
            <header>
              <p className="letter" aria-hidden="true">
                {direction.letter}
              </p>
              <div>
                <h2>{direction.name}</h2>
                <p>{direction.concept}</p>
              </div>
            </header>
            <Frame direction={direction} mode={mode} />
            <a className="open" href={`/directions/${direction.id}`} target="_blank" rel="noreferrer">
              Open {direction.name} full screen <span aria-hidden="true">↗</span>
            </a>
            <ul className="swatches" aria-label="Palette">
              {direction.swatches.map((colour) => (
                <li key={colour} style={{ background: colour }}>
                  <span className="sr-only">{colour}</span>
                </li>
              ))}
            </ul>
            <p className="rationale">{direction.rationale}</p>
            <dl className="specs">
              {direction.specs.map((spec) => (
                <div key={spec.label}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
            <div className="verdict">
              <h3>What works</h3>
              <ul>
                {direction.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3>What worries me</h3>
              <ul>
                {direction.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
