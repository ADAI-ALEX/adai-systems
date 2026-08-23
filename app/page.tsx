import { Hero } from "@/components/hero";
import { CurrentlyBuilding } from "@/components/currently-building";
import { Domains } from "@/components/domains";
import { Explorer } from "@/components/explorer";
import { Lineage } from "@/components/lineage";
import { Research } from "@/components/research";
import { Studio } from "@/components/studio";
import { Container, SectionHead } from "@/components/section";

/**
 * The whole site, in one movement:
 *
 *   01  what this is          — the hero, with the graph drawn faintly behind it
 *   02  what is live now      — the two active projects
 *   03  what the studio is    — the domain index, each one backed by real work
 *   04  everything it built   — the archive, as a timeline or as a network
 *   05  what it is exploring  — research, on ink
 *   06  who it is             — the studio, the entity, the address
 *
 * The project pages under /work hang off section 04.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <CurrentlyBuilding />
      <Domains />

      <section
        id="work"
        className="relative scroll-mt-20 overflow-hidden border-y border-rule bg-paper py-20 sm:py-24 lg:py-28"
      >
        <div
          aria-hidden="true"
          className="grid-field pointer-events-none absolute inset-0 [--grid:88px] [mask-image:radial-gradient(120%_70%_at_50%_0%,black,transparent_75%)]"
        />
        <Container className="relative">
          <SectionHead
            index="04"
            label="The archive"
            title="Everything started somewhere."
            intro="Eight projects in date order, from the agency the studio began as to the product it is shipping now. Every one of them came out of the one before it — the network view draws those relationships directly."
          />
          <Lineage />
          <Explorer />
        </Container>
      </section>

      <Research />
      <Studio />
    </>
  );
}
