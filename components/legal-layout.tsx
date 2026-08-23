import { Container } from "./section";
import { siteConfig } from "@/lib/site-config";

/**
 * Shared shell for the two legal pages.
 *
 * The prose styles are written out here rather than pulled from a typography
 * plugin, so the measure, the rules and the heading rhythm match the rest of
 * the site exactly.
 */
export function LegalLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Container className="py-16 sm:py-20">
      <div className="flex items-center justify-between gap-6 border-b border-rule pb-4">
        <span className="meta-sm text-ink-faint">Legal</span>
        <span className="meta-sm text-ink-faint">
          Updated {siteConfig.legal.lastUpdated}
        </span>
      </div>

      <h1 className="mt-12 max-w-[18ch] text-[clamp(2.25rem,6vw,3.75rem)] font-semibold leading-[1] tracking-[-0.04em] text-ink">
        {title}
      </h1>
      <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-ink-muted">
        {intro}
      </p>

      <div
        className="mt-14 max-w-[64ch] text-[1.0625rem] leading-[1.75] text-ink
          [&_a]:underline [&_a]:decoration-rule-strong [&_a]:underline-offset-4 [&_a:hover]:decoration-ink
          [&_h2]:mt-12 [&_h2]:border-t [&_h2]:border-rule [&_h2]:pt-8 [&_h2]:text-[1.25rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.02em]
          [&_li]:mt-2 [&_p]:mt-5 [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6
          [&_h2+p]:mt-5"
      >
        {children}
      </div>
    </Container>
  );
}
