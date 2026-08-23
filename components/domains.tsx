import Link from "next/link";
import { Container, SectionHead } from "./section";
import { Reveal } from "./reveal";
import { domainProjects, domains } from "@/lib/domains";

/**
 * The technical index: what the studio actually works in, with the work that
 * proves each one underneath it.
 *
 * Every domain names its evidence. A domain with nothing behind it is a claim,
 * and this section is built so a claim cannot be made — `domainProjects()`
 * resolves ids from the archive, and an empty domain does not render.
 */
export function Domains() {
  return (
    <section id="system" className="scroll-mt-20 py-20 sm:py-24 lg:py-28">
      <Container>
        <SectionHead
          index="03"
          label="The system"
          title="Eight domains, one studio."
          intro="ADAI Systems is not tied to a single product or a single field. These are the areas the work keeps returning to — each one listed with the projects that stand behind it."
        />

        <div className="mt-12 grid border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
          {domains.map((domain, index) => {
            const evidence = domainProjects(domain);
            if (evidence.length === 0) return null;

            return (
              <Reveal
                key={domain.id}
                delay={(index % 4) * 70}
                className={`flex flex-col border-b border-rule px-0 py-7 sm:px-6 ${
                  index % 2 === 1 ? "sm:border-l" : ""
                } lg:border-l lg:first:border-l-0 lg:[&:nth-child(5)]:border-l-0 ${
                  index % 4 === 0 ? "sm:px-0 sm:pr-6 lg:pl-0" : ""
                }`}
              >
                <span className="meta-sm text-ink-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                  {domain.label}
                </h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-muted">
                  {domain.note}
                </p>

                <ul className="mt-5 flex flex-col gap-1.5 border-t border-rule pt-4">
                  {evidence.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/work/${project.id}`}
                        className="meta-sm text-ink-faint transition-colors hover:text-ink"
                      >
                        {project.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
