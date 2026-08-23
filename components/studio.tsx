import Link from "next/link";
import { Container, SectionHead } from "./section";
import { Reveal } from "./reveal";
import { externalLinks, siteConfig } from "@/lib/site-config";
import { projects } from "@/lib/projects";

/** Facts about the business, kept as a hairline table rather than a story. */
const facts = [
  { label: "Studio", value: siteConfig.name },
  { label: "Founded", value: `December ${siteConfig.foundedYear}` },
  { label: "Operated by", value: siteConfig.legal.entityName },
  { label: "Archive", value: `${projects.length} projects` },
];

export function Studio() {
  return (
    <section id="studio" className="scroll-mt-20 py-20 sm:py-24 lg:py-28">
      <Container>
        <SectionHead
          index="06"
          label="Studio"
          title="A studio is measured by what it ships."
          intro="ADAI Systems is an independent technology studio founded in 2024, building software across AI, automation, consumer technology and experimental research. It stays small, builds its own tools, and keeps the work that did not become a product."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Reveal className="rounded-2xl border border-rule bg-paper-raised p-7 sm:p-9">
            <p className="meta-sm text-ink-faint">Contact</p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="mt-5 inline-block text-[clamp(1.25rem,3vw,1.875rem)] font-semibold tracking-[-0.03em] text-ink underline decoration-rule-strong underline-offset-[6px] transition-colors hover:decoration-ink"
            >
              {siteConfig.contactEmail}
            </a>
            <p className="mt-5 max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink-muted">
              For new work, questions about anything in the archive, or support
              for one of the live products. One address, read by a person.
            </p>

            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-rule pt-7">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="meta-sm text-ink-faint">{fact.label}</dt>
                  <dd className="mt-2 text-[0.9375rem] text-ink">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <div className="grid gap-4">
            <Reveal
              delay={80}
              className="rounded-2xl border border-rule bg-paper-raised p-7 sm:p-9"
            >
              <p className="meta-sm text-ink-faint">Products</p>
              <ul className="mt-6 flex flex-col">
                {[
                  {
                    href: externalLinks.lockout,
                    name: "Lockout",
                    note: "Turn distraction into movement.",
                    id: "lockout",
                  },
                  {
                    href: externalLinks.fitdawg,
                    name: "FitDawg",
                    note: "Gamified fitness. Discontinued, may return.",
                    id: "fitdawg",
                  },
                ].map((product, index) => (
                  <li key={product.id}>
                    <a
                      href={product.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`group flex items-baseline justify-between gap-6 py-4 ${
                        index > 0 ? "border-t border-rule" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                          {product.name}
                        </span>
                        <span className="mt-1 block text-[0.875rem] text-ink-muted">
                          {product.note}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-ink"
                      >
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* The entity note. Stated plainly and in one place: ADAI Systems is
                a trading name, not its own company, and the site never implies
                otherwise. */}
            <Reveal
              delay={140}
              className="rounded-2xl border border-rule bg-paper-raised p-7 sm:p-9"
            >
              <p className="meta-sm text-ink-faint">Company</p>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink">
                {siteConfig.legal.relationship}
              </p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted">
                Everything published here is the studio&rsquo;s own work. Read
                the{" "}
                <Link
                  href="/privacy"
                  className="underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-ink hover:text-ink"
                >
                  privacy notice
                </Link>{" "}
                or the{" "}
                <Link
                  href="/terms"
                  className="underline decoration-rule-strong underline-offset-4 transition-colors hover:decoration-ink hover:text-ink"
                >
                  terms
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
