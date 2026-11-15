"use client";

import { useEffect, useState } from "react";
import { stevie } from "@/content/projects";

const PER_CHARACTER = 26;

/**
 * STEVIE's real replies, replayed. Choosing a prompt types its reply out a character at a time,
 * or all at once when the visitor prefers less motion. The text is never altered.
 */
export function Stevie() {
  const [chosen, setChosen] = useState(0);
  // How much of the reply is showing. Starts complete, so the first reply reads without a click.
  const [shown, setShown] = useState(stevie[0].reply.length);
  const reply = stevie[chosen].reply;
  const typing = shown < reply.length;

  useEffect(() => {
    if (!typing) return;
    const timer = window.setTimeout(() => setShown((n) => n + 1), PER_CHARACTER);
    return () => window.clearTimeout(timer);
  }, [typing, shown]);

  function choose(at: number) {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setChosen(at);
    setShown(still ? stevie[at].reply.length : 0);
  }

  return (
    <div className="st">
      <div className="st-prompts" role="group" aria-label="Prompts">
        {stevie.map((pair, at) => (
          <button key={pair.prompt} type="button" aria-pressed={chosen === at} onClick={() => choose(at)}>
            {pair.prompt}
          </button>
        ))}
      </div>

      <div className="st-screen">
        <p className="st-you">
          <span className="meta">You</span>
          {stevie[chosen].prompt}
        </p>
        <div className="st-reply">
          <span className="meta">STEVIE</span>
          {/* Read once, in full, by screen readers. The typed copy beside it is for the eye. */}
          <p className="st-sr" aria-live="polite">
            {reply}
          </p>
          <p className="st-text" aria-hidden="true" data-typing={typing || undefined}>
            {reply.slice(0, shown)}
            <span className="st-caret" />
            {/* Holds the full height so the panel does not jump while the reply types out. */}
            <span className="st-ghost">{reply.slice(shown)}</span>
          </p>
        </div>
        <p className="st-note">Real replies to held-out prompts. First sample, unedited. Replayed, not live.</p>
      </div>
    </div>
  );
}
