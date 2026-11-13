"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { byDate, nowBuilding, projects, stevie } from "@/content/projects";
import { site } from "@/content/site";
import { useReducedMotion } from "@/components/shared/use-reduced-motion";
import { PAGES } from "./bar";

type Tone = "dim" | "accent" | "ok" | "info" | "warn";
type Line = { boot?: boolean } & (
  | { kind: "in"; text: string }
  | { kind: "out"; text: string; tone?: Tone }
  | { kind: "pair"; label: string; text: string; tone?: Tone }
  | { kind: "run"; label: string; text: string; command: string; wide?: boolean }
  | { kind: "link"; label: string; text: string; href: string }
);

const STEVIE_NOTE = "real reply to a held-out prompt. first sample, unedited. replayed, not live.";

const HELP: Line[] = [
  { kind: "pair", label: "ls", text: "list every project" },
  { kind: "pair", label: "open <name>", text: "show one project, e.g. open glimmer" },
  { kind: "pair", label: "now", text: "what is running today" },
  { kind: "pair", label: "stevie", text: "talk to a 13.8M parameter model" },
  { kind: "pair", label: "go <page>", text: PAGES.map((page) => page.label).join(", ") },
  { kind: "pair", label: "contact", text: "how to reach the studio" },
  { kind: "pair", label: "clear", text: "wipe the screen" },
];

function nowLines(): Line[] {
  return nowBuilding.map((project) => ({
    kind: "run" as const,
    label: project.slug,
    text: project.statusLabel.toLowerCase(),
    command: `open ${project.slug}`,
    wide: true,
  }));
}

/** What the terminal shows before anyone types. Rendered on the server too. */
const BOOT: Line[] = [
  { kind: "out", text: "adai lab. type help, or tap a command below.", tone: "dim" },
  ...(
    [
      { kind: "in", text: "now" },
      ...nowLines(),
      { kind: "in", text: "stevie 1" },
      { kind: "pair", label: "you", text: stevie[0].prompt, tone: "info" },
      { kind: "pair", label: "stevie", text: stevie[0].reply, tone: "ok" },
      { kind: "out", text: STEVIE_NOTE, tone: "dim" },
    ] as Line[]
  ).map((line) => ({ ...line, boot: true })),
];

function steviePrompts(): Line[] {
  return [
    { kind: "out", text: "stevie: 13.8M parameters, trained from scratch on one laptop.", tone: "accent" },
    { kind: "out", text: "pick a prompt. the replies are real.", tone: "dim" },
    ...stevie.map((exchange, index) => ({
      kind: "run" as const,
      label: String(index + 1),
      text: exchange.prompt,
      command: `stevie ${index + 1}`,
    })),
  ];
}

function openProject(name: string): Line[] {
  const query = name.trim().toLowerCase();
  if (!query) return [{ kind: "out", text: "open what? try: open glimmer", tone: "warn" }];
  const project =
    projects.find((p) => p.slug === query) ??
    projects.find((p) => p.title.toLowerCase() === query) ??
    projects.find((p) => p.slug.startsWith(query) || p.title.toLowerCase().startsWith(query));
  if (!project) return [{ kind: "out", text: `no project called "${name}". try ls.`, tone: "warn" }];
  return [
    { kind: "out", text: project.title, tone: "accent" },
    { kind: "pair", label: "when", text: project.dateLabel.toLowerCase() },
    { kind: "pair", label: "status", text: project.statusLabel.toLowerCase(), tone: "ok" },
    { kind: "pair", label: "what", text: project.pitch },
    { kind: "pair", label: "stack", text: project.stack.join(", ") },
    { kind: "link", label: "read", text: `/work/${project.slug}`, href: `/work/${project.slug}` },
    ...(project.links ?? []).map((link) => ({
      kind: "link" as const,
      label: "link",
      text: link.label,
      href: link.href,
    })),
  ];
}

const CHIPS = ["help", "ls", "open glimmer", "stevie", "contact"];

export function Shell() {
  const [lines, setLines] = useState<Line[]>(BOOT);
  const [value, setValue] = useState("");
  const [typing, setTyping] = useState<{ label: string; text: string; shown: number } | null>(null);
  const reduced = useReducedMotion();
  const router = useRouter();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const history = useRef<string[]>([]);
  const cursor = useRef(0);
  const timer = useRef(0);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [lines, typing]);

  useEffect(() => () => window.clearInterval(timer.current), []);

  // Type STEVIE's reply out one character at a time, like a streamed response.
  const typeOut = useCallback((label: string, text: string) => {
    const root = document.getElementById("site");
    const pace = Number(root ? getComputedStyle(root).getPropertyValue("--type-ms") : 22) || 22;
    let shown = 0;
    setTyping({ label, text, shown });
    timer.current = window.setInterval(() => {
      shown += 1;
      if (shown < text.length) return setTyping({ label, text, shown });
      window.clearInterval(timer.current);
      setTyping(null);
      setLines((current) => [
        ...current,
        { kind: "pair", label, text, tone: "ok" },
        { kind: "out", text: STEVIE_NOTE, tone: "dim" },
      ]);
    }, pace);
  }, []);

  const run = useCallback(
    (raw: string) => {
      const command = raw.trim();
      if (!command || typing) return;
      history.current.push(command);
      cursor.current = history.current.length;
      const [head, ...rest] = command.split(/\s+/);
      const arg = rest.join(" ");
      const echo: Line = { kind: "in", text: command };
      const calm = reduced || document.getElementById("site")?.dataset.reduce === "on";

      if (head === "clear") return setLines([]);

      let out: Line[];
      switch (head.toLowerCase()) {
        case "help":
          out = HELP;
          break;
        case "ls":
          out = byDate.map((project) => ({
            kind: "run" as const,
            label: project.slug,
            text: project.statusLabel.toLowerCase(),
            command: `open ${project.slug}`,
            wide: true,
          }));
          break;
        case "open":
        case "cat":
          out = openProject(arg);
          break;
        case "now":
          out = nowLines();
          break;
        case "stevie":
        case "chat": {
          const pick = stevie[Number(arg) - 1];
          if (!pick) {
            out = steviePrompts();
            break;
          }
          setLines((current) => [...current, echo, { kind: "pair", label: "you", text: pick.prompt, tone: "info" }]);
          if (calm) {
            setLines((current) => [
              ...current,
              { kind: "pair", label: "stevie", text: pick.reply, tone: "ok" },
              { kind: "out", text: STEVIE_NOTE, tone: "dim" },
            ]);
          } else {
            typeOut("stevie", pick.reply);
          }
          return;
        }
        case "go":
        case "cd": {
          const page = PAGES.find((item) => item.label === arg.toLowerCase().replace(/^\//, ""));
          if (!page) {
            out = [{ kind: "out", text: `go where? ${PAGES.map((item) => item.label).join(", ")}`, tone: "warn" }];
            break;
          }
          out = [{ kind: "out", text: `opening ${page.label}`, tone: "dim" }];
          router.push(page.href);
          break;
        }
        case "contact":
        case "mail":
          out = [
            { kind: "link", label: "email", text: site.email, href: `mailto:${site.email}` },
            { kind: "out", text: site.contactLine.toLowerCase(), tone: "dim" },
          ];
          break;
        case "whoami":
          out = [{ kind: "out", text: "guest. welcome in." }];
          break;
        default:
          out = [{ kind: "out", text: `command not found: ${head}. try help.`, tone: "warn" }];
      }
      setLines((current) => [...current, echo, ...out]);
    },
    [reduced, router, typing, typeOut],
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      run(value);
      setValue("");
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = cursor.current + (event.key === "ArrowUp" ? -1 : 1);
      cursor.current = Math.max(0, Math.min(history.current.length, next));
      setValue(history.current[cursor.current] ?? "");
    }
  }

  return (
    <div className="shell" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      <div className="shell-log" ref={logRef} role="log" aria-live="polite" aria-label="Terminal output" tabIndex={0}>
        {lines.map((line, index) => (
          <Row key={index} line={line} run={run} />
        ))}
        {typing ? (
          <p className="shell-row">
            <span className="shell-label t-ok">{typing.label}</span>
            <span>
              {typing.text.slice(0, typing.shown)}
              <span className="caret" aria-hidden="true" />
            </span>
          </p>
        ) : null}
      </div>
      {/* Not a form: nothing typed here is sent anywhere. */}
      <div className="shell-prompt">
        <label htmlFor="shell-input" className="shell-sigil">
          <span className="sr-only">Terminal command</span>
          <span aria-hidden="true">$</span>
        </label>
        <input
          id="shell-input"
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="type a command"
          enterKeyHint="go"
        />
      </div>
      <div className="chips" role="group" aria-label="Suggested commands">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              run(chip);
            }}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ line, run }: { line: Line; run: (command: string) => void }) {
  const boot = line.boot ? " boot" : "";
  switch (line.kind) {
    case "in":
      return (
        <p className={`shell-row shell-in${boot}`}>
          <span className="shell-sigil" aria-hidden="true">
            $
          </span>
          <span>{line.text}</span>
        </p>
      );
    case "out":
      return <p className={`shell-row shell-out t-${line.tone ?? "ink"}${boot}`}>{line.text}</p>;
    case "pair":
      return (
        <p className={`shell-row${boot}`}>
          <span className={`shell-label t-${line.tone ?? "dim"}`}>{line.label}</span>
          <span>{line.text}</span>
        </p>
      );
    case "run":
      return (
        <p className={`shell-row${line.wide ? " shell-wide" : ""}${boot}`}>
          <button
            type="button"
            className="shell-label shell-run"
            onClick={(event) => {
              event.stopPropagation();
              run(line.command);
            }}
          >
            {line.label}
          </button>
          <span className="t-dim">{line.text}</span>
        </p>
      );
    case "link":
      return (
        <p className={`shell-row${boot}`}>
          <span className="shell-label t-dim">{line.label}</span>
          {line.href.startsWith("/") ? <Link href={line.href}>{line.text}</Link> : <a href={line.href}>{line.text}</a>}
        </p>
      );
  }
}
