"use client";

import { Anybody, Fraunces, Hanken_Grotesk, Instrument_Sans, Pixelify_Sans } from "next/font/google";
import { useCallback, useEffect, useMemo, useState } from "react";
import { tokens, type TokenName } from "@/design/tokens";
import { CONTROL_COUNT, GROUPS, PALETTES, type Control } from "./schema";
import "./tweaks.css";

// Alternative faces for the font pickers. They ship only with this panel.
const wide = Anybody({ subsets: ["latin"], axes: ["wdth"], variable: "--font-wide", display: "swap", preload: false });
const soft = Fraunces({ subsets: ["latin"], axes: ["SOFT"], variable: "--font-soft", display: "swap", preload: false });
const grotesk = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-grotesk", display: "swap", preload: false });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap", preload: false });
const pixel = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixel", display: "swap", preload: false });
const FONT_CLASSES = [wide, soft, grotesk, sans, pixel].map((font) => font.variable);

const STORE = "adai-tweaks";
type Config = { palette: string; css: Record<string, string>; attrs: Record<string, string> };
const EMPTY: Config = { palette: tokens.palette, css: {}, attrs: {} };

const CONTROLS = GROUPS.flatMap((group) => group.controls);
const site = () => document.getElementById("site");

function load(): Config {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORE) ?? "null");
    if (saved && typeof saved === "object") return { ...EMPTY, ...saved, css: { ...saved.css }, attrs: { ...saved.attrs } };
  } catch {
    // Unreadable or blocked storage: start from the baked design.
  }
  return EMPTY;
}

/** Writes a config onto the page. Anything not in it falls back to the baked tokens. */
function apply(config: Config) {
  const root = site();
  if (!root) return;
  for (const control of CONTROLS) {
    if ("css" in control) {
      const value = config.css[control.css];
      if (value === undefined) root.style.removeProperty(control.css);
      else root.style.setProperty(control.css, value);
    } else {
      root.dataset[control.attr] = config.attrs[control.attr] ?? tokens[control.attr];
    }
  }
}

function baked(control: Control): string {
  const root = site();
  if ("attr" in control) return tokens[control.attr];
  const raw = root ? getComputedStyle(root).getPropertyValue(control.css).trim() : "";
  if (control.type === "range") {
    const parsed = Number.parseFloat(raw);
    return String(Number.isFinite(parsed) && !raw.includes("(") ? parsed : control.fallback);
  }
  return raw;
}

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

export function Tweaks() {
  const [config, setConfig] = useState<Config>(EMPTY);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [pasted, setPasted] = useState("");
  const [defaults, setDefaults] = useState<Record<string, string>>({});

  // Read the baked values once, before any saved tweak is applied on top.
  useEffect(() => {
    const root = site();
    root?.classList.add(...FONT_CLASSES);
    const read: Record<string, string> = {};
    for (const control of CONTROLS) read[control.id] = baked(control);
    const saved = load();
    apply(saved);
    const timer = window.setTimeout(() => {
      setDefaults(read);
      setConfig(saved);
      setReady(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      apply(EMPTY);
      root?.classList.remove(...FONT_CLASSES);
    };
  }, []);

  const commit = useCallback((next: Config) => {
    setConfig(next);
    apply(next);
    try {
      window.localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      // Storage unavailable: the change still applies for this visit.
    }
  }, []);

  const valueOf = (control: Control): string => {
    if ("attr" in control) return config.attrs[control.attr] ?? tokens[control.attr];
    const set = config.css[control.css];
    if (set === undefined) return defaults[control.id] ?? "";
    return control.type === "range" ? String(Number.parseFloat(set)) : set;
  };

  function setControl(control: Control, value: string) {
    if ("css" in control) {
      const unit = control.type === "range" ? control.unit : "";
      commit({ ...config, css: { ...config.css, [control.css]: `${value}${unit}` } });
    } else {
      commit({ ...config, attrs: { ...config.attrs, [control.attr]: value } });
    }
  }

  function setPalette(name: string) {
    commit({ ...config, palette: name, css: { ...config.css, ...PALETTES[name].colours } });
  }

  function reset() {
    try {
      window.localStorage.removeItem(STORE);
    } catch {
      // Nothing stored.
    }
    setConfig(EMPTY);
    apply(EMPTY);
    say("Back to the baked design.");
  }

  function surprise() {
    const palette = pick(Object.keys(PALETTES));
    const css: Record<string, string> = { ...PALETTES[palette].colours };
    const attrs: Record<string, string> = {};
    for (const control of CONTROLS) {
      // Leave the diagnostic switches and the colours of the chosen palette alone.
      if (control.type === "colour" || control.id === "reduce" || control.id === "replay" || control.id === "--speed") continue;
      if (Math.random() < 0.45) continue;
      if (control.type === "range") {
        const span = control.max - control.min;
        const centre = control.fallback;
        const raw = centre + (Math.random() - 0.5) * span * 0.5;
        const snapped = Math.round(Math.min(control.max, Math.max(control.min, raw)) / control.step) * control.step;
        css[control.css] = `${Number(snapped.toFixed(4))}${control.unit}`;
      } else if (control.type === "select") css[control.css] = pick(control.options)[0];
      else if (control.type === "choice") attrs[control.attr] = pick(control.options)[0];
      else attrs[control.attr] = pick(["on", "off"]);
    }
    commit({ palette, css, attrs });
    say("Rolled the dice. Reset brings the baked design back.");
  }

  function say(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  }

  /** The full current state, including values that have not been touched. */
  const exported = useMemo(() => {
    if (!ready) return "";
    const css: Record<string, string> = {};
    const attrs: Record<string, string> = {};
    for (const control of CONTROLS) {
      if ("css" in control) {
        const unit = control.type === "range" ? control.unit : "";
        css[control.css] = config.css[control.css] ?? `${defaults[control.id]}${unit}`;
      } else attrs[control.attr] = config.attrs[control.attr] ?? tokens[control.attr];
    }
    return JSON.stringify({ palette: config.palette, css, attrs }, null, 2);
  }, [config, defaults, ready]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(exported);
      say("Config copied. Paste it back to Claude.");
    } catch {
      setPasted(exported);
      say("Could not reach the clipboard. The config is in the box below.");
    }
  }

  function importConfig() {
    try {
      const parsed = JSON.parse(pasted) as Partial<Config>;
      const css: Record<string, string> = {};
      const attrs: Record<string, string> = {};
      for (const control of CONTROLS) {
        if ("css" in control) {
          const value = parsed.css?.[control.css];
          if (typeof value === "string" && value.length < 120 && !/[;{}<>]/.test(value)) css[control.css] = value;
        } else {
          const value = parsed.attrs?.[control.attr];
          const allowed = control.type === "toggle" ? ["on", "off"] : control.options.map(([option]) => option);
          if (typeof value === "string" && allowed.includes(value)) attrs[control.attr as TokenName] = value;
        }
      }
      commit({ palette: typeof parsed.palette === "string" && parsed.palette in PALETTES ? parsed.palette : config.palette, css, attrs });
      say("Config applied.");
    } catch {
      say("That is not valid JSON.");
    }
  }

  const needle = query.trim().toLowerCase();
  const changed = Object.keys(config.css).length + Object.keys(config.attrs).length;

  if (!open) {
    return (
      <button type="button" className="tweaks-tab" onClick={() => setOpen(true)}>
        Tweaks{changed ? ` (${changed})` : ""}
      </button>
    );
  }

  return (
    <aside className="tweaks" aria-label="Design tweaks">
      <header>
        <h2>Tweaks</h2>
        <p>
          {CONTROL_COUNT} controls · {changed} changed
        </p>
        <button type="button" onClick={() => setOpen(false)} aria-label="Collapse the tweaks bar">
          Hide
        </button>
      </header>

      <div className="tweaks-actions">
        <button type="button" onClick={surprise}>
          Surprise me
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
        <button type="button" className="primary" onClick={copy}>
          Copy config
        </button>
      </div>
      <p className="tweaks-notice" role="status">
        {notice}
      </p>

      <label className="tweaks-search">
        <span className="sr-only">Find a control</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a control" />
      </label>

      <div className="tweaks-body">
        {GROUPS.map((group, index) => {
          const controls = group.controls.filter((control) => !needle || control.label.toLowerCase().includes(needle));
          const palette = group.name === "Palette" && (!needle || "palette".includes(needle));
          if (!controls.length && !palette) return null;
          return (
            <details key={group.name} open={Boolean(needle) || index === 0}>
              <summary>
                {group.name} <span>{group.controls.length + (group.name === "Palette" ? 1 : 0)}</span>
              </summary>
              {palette ? (
                <label className="tweak">
                  <span>Palette</span>
                  <select value={config.palette} onChange={(event) => setPalette(event.target.value)}>
                    {Object.entries(PALETTES).map(([name, item]) => (
                      <option key={name} value={name}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {controls.map((control) => {
                const value = valueOf(control);
                if (control.type === "range") {
                  return (
                    <label className="tweak" key={control.id}>
                      <span>
                        {control.label} <output>{value}{control.unit}</output>
                      </span>
                      <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={value || control.fallback}
                        onChange={(event) => setControl(control, event.target.value)}
                      />
                    </label>
                  );
                }
                if (control.type === "colour") {
                  return (
                    <label className="tweak tweak-row" key={control.id}>
                      <span>{control.label}</span>
                      <input
                        type="color"
                        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
                        onChange={(event) => setControl(control, event.target.value)}
                      />
                    </label>
                  );
                }
                if (control.type === "toggle") {
                  return (
                    <label className="tweak tweak-row" key={control.id}>
                      <span>{control.label}</span>
                      <input
                        type="checkbox"
                        checked={value === "on"}
                        onChange={(event) => setControl(control, event.target.checked ? "on" : "off")}
                      />
                    </label>
                  );
                }
                return (
                  <label className="tweak" key={control.id}>
                    <span>{control.label}</span>
                    <select value={value} onChange={(event) => setControl(control, event.target.value)}>
                      {control.options.map(([option, label]) => (
                        <option key={option} value={option}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </details>
          );
        })}

        <details>
          <summary>
            Paste a config <span>1</span>
          </summary>
          <label className="tweak">
            <span>JSON from Copy config</span>
            <textarea value={pasted} onChange={(event) => setPasted(event.target.value)} rows={5} spellCheck={false} />
          </label>
          <button type="button" className="tweaks-apply" onClick={importConfig}>
            Apply pasted config
          </button>
        </details>
      </div>
    </aside>
  );
}
