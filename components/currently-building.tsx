import { Container, SectionHead } from "./section";
import { ProjectCard } from "./project-card";
import { Reveal } from "./reveal";
import { activeProjects } from "@/lib/projects";

/**
 * What the studio is doing *now*, answered before the history starts.
 *
 * Derived from `status: "active"` rather than a hand-kept list, so a project
 * going quiet in the data file removes it from here automatically.
 */
export function CurrentlyBuilding() {
  if (activeProjects.length === 0) return null;

  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <Container>
        <SectionHead
          index="02"
          label="Currently building"
          title="Two things are live."
          intro="The studio itself, and the product it is shipping. Everything below this is either finished, paused or still a question."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {activeProjects.map((project, index) => (
            <Reveal key={project.id} delay={index * 90}>
              <ProjectCard project={project} size="large" />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
