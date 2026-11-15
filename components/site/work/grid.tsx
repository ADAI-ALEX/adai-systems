"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { Status } from "@/components/site/parts";
import { byDateDesc, showcase, type Aspect, type Media, type Project } from "@/content/projects";
import { services } from "@/content/services";

type Filter = "all" | Aspect;
type Size = "large" | "small" | "half" | "wide";

const SHOWCASE = new Set(showcase.map((project) => project.slug));

function proves(project: Project, aspect: Aspect) {
  return project.aspect === aspect || Boolean(project.alsoProves?.includes(aspect));
}

function matches(project: Project, filter: Filter) {
  return filter === "all" || proves(project, filter);
}

/**
 * The showcase projects are set large, two to a row, and the rest three to a row.
 * The four showcase projects are also the four newest, so the list stays newest first.
 * A row that would be left short is stretched so the grid never ends with a hole.
 */
function arrange(list: Project[]): { project: Project; size: Size }[] {
  const big = list.filter((project) => SHOWCASE.has(project.slug));
  const rest = list.filter((project) => !SHOWCASE.has(project.slug));
  const tail = rest.length % 3;
  return [
    ...big.map((project, index) => ({
      project,
      size: (big.length % 2 === 1 && index === big.length - 1 ? "wide" : "large") as Size,
    })),
    ...rest.map((project, index) => ({
      project,
      size: (index < rest.length - tail ? "small" : tail === 1 ? "wide" : "half") as Size,
    })),
  ];
}

const SIZES: Record<Size, string> = {
  large: "(min-width: 960px) 44vw, (min-width: 640px) 46vw, 92vw",
  half: "(min-width: 960px) 44vw, (min-width: 640px) 46vw, 92vw",
  small: "(min-width: 960px) 29vw, (min-width: 640px) 46vw, 92vw",
  wide: "(min-width: 960px) 52vw, 92vw",
};

/** A thumbnail is decoration inside a link that already names the project, so its alt is empty. */
function Picture({ media, sizes }: { media: Media; sizes: string }) {
  const className = media.type === "pixel" ? "pixel" : undefined;
  if (media.src.endsWith(".gif")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={media.src} alt="" width={media.width} height={media.height} loading="lazy" />;
  }
  return <Image className={className} src={media.src} alt="" width={media.width} height={media.height} sizes={sizes} />;
}

function Thumb({ project, size }: { project: Project; size: Size }) {
  const media = project.media ?? [];
  const first = media[0];

  if (!first) {
    // No real media exists for this one, so the tile is set in type instead.
    return (
      <span className="wk-thumb wk-tile" aria-hidden="true">
        <span className="wk-tile-kind meta">{project.kindLabel}</span>
        <span className="wk-tile-word display">{project.chapter}</span>
      </span>
    );
  }

  if (first.type === "phone") {
    const phones = media.filter((item) => item.type === "phone").slice(0, 3);
    return (
      <span className="wk-thumb wk-phones">
        {phones.map((item) => (
          <Picture key={item.src} media={item} sizes="(min-width: 960px) 12vw, 26vw" />
        ))}
      </span>
    );
  }

  return (
    <span className="wk-thumb wk-shot" data-shape={first.width / first.height < 1.2 ? "tall" : "wide"}>
      <Picture media={first} sizes={SIZES[size]} />
      {first.type === "concept" ? <span className="wk-flag meta">Concept illustration</span> : null}
    </span>
  );
}

/** Every project, newest first, filtered by the service it proves. */
export function WorkGrid() {
  const [active, setActive] = useState<Filter>("all");
  const [touched, setTouched] = useState(false);

  const options = useMemo(
    () => [
      { id: "all" as Filter, label: "All", title: "All", count: byDateDesc.length },
      ...services.map((service) => ({
        id: service.slug as Filter,
        label: service.short,
        title: service.title,
        count: byDateDesc.filter((project) => proves(project, service.slug)).length,
      })),
    ],
    [],
  );

  const cards = useMemo(() => arrange(byDateDesc.filter((project) => matches(project, active))), [active]);
  const current = options.find((option) => option.id === active) ?? options[0];

  return (
    <>
      <header className="wk-head">
        <h2 id="all-title">Every project</h2>
        <div className="wk-controls">
          <div className="wk-filters" role="group" aria-label="Show projects by service">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                data-hue={option.id === "all" ? undefined : option.id}
                aria-pressed={active === option.id}
                onClick={() => {
                  setActive(option.id);
                  setTouched(true);
                }}
              >
                {option.label}
                <span className="wk-filter-n" aria-hidden="true">
                  {option.count}
                </span>
              </button>
            ))}
          </div>
          <p className="meta wk-count" aria-live="polite">
            {active === "all"
              ? `${cards.length} projects, newest first`
              : `${cards.length} of ${byDateDesc.length} projects: ${current.title}`}
          </p>
        </div>
      </header>

      <ul className="wk-grid" data-animate={touched || undefined}>
        {cards.map(({ project, size }, index) => (
          <li
            key={`${active}:${project.slug}`}
            className="wk-item"
            data-size={size}
            style={{ "--i": index } as CSSProperties}
          >
            <Link className="wk-card" href={`/work/${project.slug}`} data-hue={project.aspect}>
              <Thumb project={project} size={size} />
              <span className="wk-body">
                <span className="wk-top">
                  <Status project={project} />
                  <span className="meta">{project.dateLabel}</span>
                </span>
                <h3 className="wk-title">{project.title}</h3>
                <span className="wk-pitch">{project.pitch}</span>
                <span className="wk-go meta" aria-hidden="true">
                  {project.kindLabel}
                  <span className="wk-arrow">→</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
