import { Shot } from "@/components/site/parts";
import { Player } from "@/components/site/video";
import { getProject, type Media, type Project } from "@/content/projects";

/** The first piece of media that is not a phone capture, if a project has one. */
export function screenOf(project: Project): Media | undefined {
  return project.media?.find((media) => media.type !== "phone");
}

/** True when a project has real media or a video to show. */
export function hasMedia(project: Project): boolean {
  return Boolean(project.video || project.media?.length);
}

/** The strongest project in a list that has something captured to show. */
export function firstWithMedia(slugs: string[]): Project {
  const all = slugs.map(getProject);
  return all.find((project) => project.media?.length) ?? all[0];
}

/** A small cover for a project in a list: a screen, a phone, or its name in the hue. */
export function ProjectThumb({ project }: { project: Project }) {
  const screen = screenOf(project);
  const phone = project.media?.find((media) => media.type === "phone");
  if (screen) {
    return (
      <span className="sv-thumb frame">
        <Shot media={{ ...screen, alt: "" }} sizes="12rem" />
      </span>
    );
  }
  if (phone) {
    return (
      <span className="sv-thumb sv-thumb-phone">
        <Shot media={{ ...phone, alt: "" }} sizes="6rem" />
      </span>
    );
  }
  return (
    <span className="sv-thumb sv-thumb-type" aria-hidden="true">
      <span className="meta">{project.kindLabel}</span>
      <span className="sv-thumb-title">{project.title}</span>
    </span>
  );
}

/**
 * A project's strongest visual: its video, a screen, three phone captures, or,
 * when nothing has been captured, a typographic tile in the project's hue.
 */
export function ProjectVisual({
  project,
  sizes,
  priority = false,
  video = true,
  detail = false,
}: {
  project: Project;
  sizes: string;
  priority?: boolean;
  video?: boolean;
  /** Show what was built on the tile, for the larger placements. */
  detail?: boolean;
}) {
  if (video && project.video) return <Player video={project.video} />;

  const screen = screenOf(project);
  if (screen) {
    return (
      <div className="sv-shot frame frame-zoom">
        <Shot media={screen} sizes={sizes} priority={priority} />
        {screen.type === "concept" ? <span className="sv-flag meta">Concept illustration. Nothing was built.</span> : null}
      </div>
    );
  }

  const phones = project.media?.filter((media) => media.type === "phone").slice(0, 3) ?? [];
  if (phones.length) {
    return (
      <div className="sv-phones phones">
        {phones.map((shot, index) => (
          <Shot key={shot.src} media={shot} sizes="(min-width: 960px) 14vw, 30vw" priority={priority && index === 0} />
        ))}
      </div>
    );
  }

  return <ProjectTile project={project} detail={detail} />;
}

/** A deliberate cover for a project with no captures yet: its name, what it is, and what it runs on. */
export function ProjectTile({ project, detail = false }: { project: Project; detail?: boolean }) {
  const steps = detail ? (project.story?.built ?? project.points ?? []).slice(0, 4) : [];
  return (
    <div className="sv-tile" aria-hidden={detail ? undefined : true}>
      <p className="meta sv-tile-kind">
        {project.kindLabel} · {project.dateLabel}
      </p>
      <p className="sv-tile-title">{project.title}</p>
      {steps.length ? (
        <ol className="sv-tile-steps">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      <ul className="sv-tile-stack">
        {project.stack.slice(0, 4).map((item) => (
          <li key={item} className="tag">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
