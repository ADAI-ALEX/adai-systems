"use client";

import { useId, useState, useSyncExternalStore } from "react";
import type { Aspect } from "@/content/projects";
import { brief, services } from "@/content/services";
import { site } from "@/content/site";

type Need = Aspect | "unsure";

const needs: { id: Need; title: string; note: string }[] = [
  ...services.map((service) => ({ id: service.slug, title: service.title, note: service.promise })),
  { id: "unsure", title: "Not sure yet", note: "Describe the problem. We will work out the rest together." },
];

function isNeed(value: string | null): value is Need {
  return needs.some((need) => need.id === value);
}

/** The address bar does not change while the page is open, so there is nothing to subscribe to. */
function noSubscribe() {
  return () => {};
}

/** Joins titles that already contain "and", so the last join is "plus" to keep them apart. */
function listOf(items: string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")}, plus ${items.at(-1)}`;
}

/** Lower-cases a leading word for use mid-sentence, leaving "I" and acronyms such as "AI" alone. */
function lower(text: string): string {
  return /^(I\b|[A-Z]{2})/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1);
}

/** A part of the email. Prompts show in the preview but are never sent. */
type Piece = { text: string; prompt?: boolean };

/** The email, as lines of pieces. Text sent is every piece that is not a prompt. */
function compose(state: {
  picked: Need[];
  stage: string;
  timeline: string;
  what: string;
  name: string;
  company: string;
  budget: string;
}): { subject: string; lines: Piece[][] } {
  const kinds = state.picked
    .filter((id): id is Aspect => id !== "unsure")
    .map((id) => services.find((service) => service.slug === id)!.title);
  const unsure = state.picked.includes("unsure");
  const what = state.what.trim();
  const name = state.name.trim();
  const company = state.company.trim();
  const budget = state.budget.trim();

  const about = kinds.length ? kinds.join(", ") : unsure ? "not sure yet" : "";
  const subject = `New project${about ? `: ${about}` : ""}${company ? ` (${company})` : ""}`;

  let need: Piece[];
  if (kinds.length) {
    const list = listOf(kinds.map(lower));
    need = [
      {
        text: `I'm looking for help with ${list}${unsure ? ", though I'm not completely sure yet what it needs" : ""}.`,
      },
    ];
  } else if (unsure) {
    need = [{ text: "I'm not sure yet what kind of work it is, so I'll describe the problem." }];
  } else {
    need = [{ text: "[what you need]", prompt: true }];
  }

  const lines: Piece[][] = [
    [{ text: "Hi Alex," }],
    [],
    [{ text: `I'd like to talk to you about a project${company ? ` for ${company}` : ""}. ` }, ...need],
    [],
    [{ text: "What it should do:" }],
    ...(what ? what.split("\n").map((line) => (line.trim() ? [{ text: line }] : [])) : [[{ text: "[a few lines on what it has to do]", prompt: true }]]),
    [],
  ];
  const facts: Piece[][] = [];
  if (state.stage) facts.push([{ text: `Where we are: ${lower(state.stage)}.` }]);
  if (state.timeline) facts.push([{ text: `When: ${lower(state.timeline)}.` }]);
  if (budget) facts.push([{ text: `Budget in mind: ${budget}` }]);
  if (facts.length) lines.push(...facts, []);
  lines.push([{ text: "Thanks," }], name ? [{ text: name }] : [{ text: "[your name]", prompt: true }]);
  if (company) lines.push([{ text: company }]);

  return { subject, lines };
}

/** Lines of text exactly as they will be sent. A line that is only a prompt is dropped. */
function plain(lines: Piece[][]): string {
  return lines
    .flatMap((line) => {
      if (line.length && line.every((piece) => piece.prompt)) return [];
      return [line.filter((piece) => !piece.prompt).map((piece) => piece.text).join("").trimEnd()];
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function BriefBuilder() {
  const id = useId();
  // A service chosen on the way in, from ?type=. Read after hydration, so the server HTML still matches.
  const arrived = useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(window.location.search).get("type"),
    () => null,
  );
  const [chosen, setChosen] = useState<Need[] | null>(null);
  const picked: Need[] = chosen ?? (isNeed(arrived) ? [arrived] : []);
  const [stage, setStage] = useState("");
  const [timeline, setTimeline] = useState("");
  const [what, setWhat] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [budget, setBudget] = useState("");
  const [copied, setCopied] = useState<"" | "done" | "failed">("");

  const { subject, lines } = compose({ picked, stage, timeline, what, name, company, budget });
  const body = plain(lines);
  const crlf = (text: string) => encodeURIComponent(text.replace(/\n/g, "\r\n"));
  const mailto = `mailto:${site.email}?subject=${crlf(subject)}&body=${crlf(body)}`;
  const ready = Boolean(what.trim() && name.trim());

  function toggle(need: Need) {
    setCopied("");
    setChosen(picked.includes(need) ? picked.filter((item) => item !== need) : [...picked, need]);
  }

  async function copy() {
    const text = `To: ${site.email}\nSubject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied("done");
    } catch {
      // Older browsers and some embedded views: fall back to a temporary selection.
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      area.remove();
      setCopied(ok ? "done" : "failed");
    }
  }

  return (
    <div className="st-builder">
      <div className="st-steps">
        <fieldset className="st-step">
          <legend>
            <span className="meta">01</span> What do you need?
          </legend>
          <p className="small st-hint">Pick as many as apply.</p>
          <div className="st-needs">
            {needs.map((need) => {
              const on = picked.includes(need.id);
              return (
                <button
                  key={need.id}
                  type="button"
                  className="st-need"
                  data-hue={need.id === "unsure" ? undefined : need.id}
                  aria-pressed={on}
                  onClick={() => toggle(need.id)}
                >
                  <span className="st-check" aria-hidden="true" />
                  <span className="st-need-title">{need.title}</span>
                  <span className="st-need-note">{need.note}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="st-step">
          <legend>
            <span className="meta">02</span> Where are you now?
          </legend>
          <div className="st-choices">
            {brief.stages.map((option) => (
              <label key={option} className="st-choice">
                <input
                  type="radio"
                  name={`${id}-stage`}
                  value={option}
                  checked={stage === option}
                  onChange={() => setStage(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="st-step">
          <legend>
            <span className="meta">03</span> When do you need it?
          </legend>
          <div className="st-choices">
            {brief.timelines.map((option) => (
              <label key={option} className="st-choice">
                <input
                  type="radio"
                  name={`${id}-timeline`}
                  value={option}
                  checked={timeline === option}
                  onChange={() => setTimeline(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="st-step">
          <label className="st-legend" htmlFor={`${id}-what`}>
            <span className="meta">04</span> What should it do?
          </label>
          <p className="small st-hint" id={`${id}-what-hint`}>
            The part that matters most. Who uses it, what it has to do, and what happens today without it.
          </p>
          <textarea
            id={`${id}-what`}
            className="st-input st-area"
            rows={8}
            value={what}
            aria-describedby={`${id}-what-hint`}
            placeholder={
              "For example: our front desk takes a lot of calls asking whether we have a slot tomorrow. Someone checks the booking sheet and calls back. I'd like an agent to answer, check availability and book it."
            }
            onChange={(event) => setWhat(event.target.value)}
          />
        </div>

        <div className="st-step">
          <p className="st-legend" id={`${id}-you`}>
            <span className="meta">05</span> About you
          </p>
          <div className="st-fields" role="group" aria-labelledby={`${id}-you`}>
            <div className="st-field">
              <label htmlFor={`${id}-name`}>Your name</label>
              <input
                id={`${id}-name`}
                className="st-input"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="st-field">
              <label htmlFor={`${id}-company`}>
                Company <span className="mute">(optional)</span>
              </label>
              <input
                id={`${id}-company`}
                className="st-input"
                type="text"
                autoComplete="organization"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
            </div>
            <div className="st-field st-field-wide">
              <label htmlFor={`${id}-budget`}>
                Budget, if you have one in mind <span className="mute">(optional)</span>
              </label>
              <input
                id={`${id}-budget`}
                className="st-input"
                type="text"
                value={budget}
                placeholder="A range is fine"
                onChange={(event) => setBudget(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <aside className="st-side" aria-labelledby={`${id}-preview`}>
        <div className="st-mail">
          <div className="st-mail-top">
            <h2 id={`${id}-preview`} className="st-mail-title">
              Your email
            </h2>
            <span className="meta st-ready" data-ready={ready}>
              {ready ? "Ready to send" : "Taking shape"}
            </span>
          </div>
          <dl className="st-mail-head">
            <div>
              <dt className="meta">To</dt>
              <dd>{site.email}</dd>
            </div>
            <div>
              <dt className="meta">Subject</dt>
              <dd>{subject}</dd>
            </div>
          </dl>
          <div className="st-mail-body" aria-live="off">
            {lines.map((line, index) =>
              line.length ? (
                <p key={index}>
                  {line.map((piece, at) =>
                    piece.prompt ? (
                      <span key={at} className="st-prompt" aria-hidden="true">
                        {piece.text.slice(1, -1)}
                      </span>
                    ) : (
                      <span key={at}>{piece.text}</span>
                    ),
                  )}
                </p>
              ) : (
                <p key={index} className="st-gap" aria-hidden="true" />
              ),
            )}
          </div>
          <p className="meta st-mail-note">Dashed notes show what is still missing. They are not included.</p>
        </div>

        <div className="st-actions">
          <a className="btn btn-primary" href={mailto}>
            Open in my mail app <span className="arrow" aria-hidden="true">→</span>
          </a>
          <button type="button" className="btn" onClick={copy}>
            {copied === "done" ? "Copied" : "Copy the brief"}
          </button>
        </div>
        <p className="st-status small" role="status">
          {copied === "done"
            ? `Copied. Paste it into a new email to ${site.email}.`
            : copied === "failed"
              ? "Copying is blocked here. Select the email above and copy it by hand."
              : null}
        </p>
        <p className="small st-privacy">
          Nothing is sent from this page and nothing is saved. The button opens your own mail app with the email filled
          in, and you press send. Or write to{" "}
          <a className="link" href={`mailto:${site.email}`}>
            {site.email}
          </a>{" "}
          directly.
        </p>
      </aside>
    </div>
  );
}
