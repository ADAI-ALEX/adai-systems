"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Shot } from "@/components/site/parts";
import type { Media } from "@/content/projects";

/**
 * The rest of a project's media as a grid. Selecting one opens it in a real modal dialog:
 * focus moves in and comes back to the tile it came from, Esc closes, and the arrow keys page.
 */
export function Gallery({ items, title }: { items: Media[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const closer = useRef<HTMLButtonElement>(null);
  // The tile that opened the dialog, so focus can go back to it.
  const opener = useRef<number | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const phones = items.every((item) => item.type === "phone");
  const count = items.length;

  const open = useCallback((at: number) => {
    opener.current = at;
    setIndex(at);
    const box = dialog.current;
    if (box && !box.open) box.showModal();
    closer.current?.focus();
  }, []);

  const step = useCallback(
    (by: number) => setIndex((at) => (at === null ? at : (at + by + count) % count)),
    [count],
  );

  // The page behind stays still while the dialog is open.
  useEffect(() => {
    if (index === null) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, [index]);

  const current = index === null ? null : items[index];

  return (
    <>
      <ul className="cs-gallery" data-phones={phones || undefined} data-count={Math.min(count, 4)}>
        {items.map((item, at) => (
          <li key={item.src}>
            <button
              type="button"
              className="cs-tile"
              ref={(element) => {
                tiles.current[at] = element;
              }}
              aria-haspopup="dialog"
              onClick={() => open(at)}
            >
              <Shot
                media={item}
                sizes={phones ? "(min-width: 960px) 20vw, 45vw" : "(min-width: 960px) 30vw, (min-width: 640px) 46vw, 92vw"}
              />
              <span className="cs-tile-zoom" aria-hidden="true">
                +
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        className="cs-box"
        aria-label={`${title}: screens`}
        data-phone={current?.type === "phone" || undefined}
        onClose={() => {
          setIndex(null);
          if (opener.current !== null) tiles.current[opener.current]?.focus();
          opener.current = null;
        }}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog itself.
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
        }}
      >
        <div className="cs-box-bar">
          <p className="meta" aria-live="polite">
            {index === null ? "" : `${index + 1} of ${count}`}
          </p>
          <button
            ref={closer}
            type="button"
            className="cs-box-btn"
            aria-label="Close"
            onClick={() => dialog.current?.close()}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {current ? (
          <figure className="cs-box-figure" key={current.src}>
            <div className="cs-box-media">
              {/* The full image at its own resolution, loaded only when it is asked for. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={current.type === "pixel" ? "pixel" : undefined}
                src={current.src}
                alt={current.alt}
                width={current.width}
                height={current.height}
              />
            </div>
            <figcaption aria-hidden="true">{current.alt}</figcaption>
          </figure>
        ) : null}
        {count > 1 ? (
          <div className="cs-box-nav">
            <button type="button" className="cs-box-btn" aria-label="Previous image" onClick={() => step(-1)}>
              <span aria-hidden="true">←</span>
            </button>
            <button type="button" className="cs-box-btn" aria-label="Next image" onClick={() => step(1)}>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
