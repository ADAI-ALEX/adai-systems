import { Reveal } from "./reveal";

/**
 * Every section opens the same way: a numbered rule, a label in mono, then the
 * editorial line in sans. The number is what makes the page read as an index
 * rather than a stack of marketing blocks.
 */
export function SectionHead({
  index,
  label,
  title,
  intro,
  tone = "light",
  action,
}: {
  /** Two-digit section number, e.g. "02". */
  index: string;
  label: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  tone?: "light" | "dark";
  /** Optional control that sits opposite the heading on wide screens. */
  action?: React.ReactNode;
}) {
  const dark = tone === "dark";

  return (
    <Reveal>
      <div
        className={`flex items-center gap-4 border-t pt-4 ${
          dark ? "border-white/15" : "border-rule"
        }`}
      >
        <span
          className={`meta-sm ${dark ? "text-white/60" : "text-ink-faint"}`}
        >
          {index}
        </span>
        <span className={`meta ${dark ? "text-white/75" : "text-ink-muted"}`}>
          {label}
        </span>
      </div>

      <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
        <div className="max-w-2xl">
          <h2
            className={`text-[clamp(1.85rem,4.6vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.033em] ${
              dark ? "text-white" : "text-ink"
            }`}
          >
            {title}
          </h2>
          {intro ? (
            <p
              className={`mt-5 max-w-xl text-[1.0625rem] leading-relaxed ${
                dark ? "text-white/75" : "text-ink-muted"
              }`}
            >
              {intro}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </Reveal>
  );
}

/** Standard page gutter. One place to change the site's measure. */
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1240px] px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}
