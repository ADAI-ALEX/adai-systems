import Link from "next/link";
import { pageMeta } from "@/components/site/meta";
import { Cta } from "@/components/site/parts";
import { Web } from "@/components/site/web";
import { WorkGrid } from "@/components/site/work/grid";
import { counts, projects } from "@/content/projects";
import { copy, site } from "@/content/site";
// The web, its legend and the video player are styled in home.css, so the archive loads it too.
import "../home.css";
import "./work.css";

export const metadata = pageMeta({
  title: "Work",
  description: `Every project from ${site.name} since ${site.founded}: AI agents, automation, apps and research, and how each one led to the next.`,
  path: "/work",
  card: "work",
});

const tally = [
  { label: "Projects", value: String(projects.length) },
  { label: "Open source", value: String(counts.openSource) },
  { label: "Running now", value: String(counts.running) },
  { label: "Since", value: site.foundedShort },
];

export default function WorkPage() {
  return (
    <>
      <header className="wrap page-head wk-intro">
        <p className="meta crumb">
          <Link href="/">Home</Link> / <span aria-current="page">Work</span>
        </p>
        <h1>{copy.archive.title}</h1>
        <div className="wk-intro-row">
          <p className="lede">{copy.archive.body}</p>
          <dl className="wk-tally">
            {tally.map((item) => (
              <div key={item.label}>
                <dt className="meta">{item.label}</dt>
                <dd className="display">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <section className="wrap wk-web rise" aria-labelledby="web-title">
        <header className="section-head">
          <h2 id="web-title">{copy.web.title}</h2>
          <p className="lede">{copy.web.body}</p>
        </header>
        <Web mode="full" />
      </section>

      <section className="section wrap" aria-labelledby="all-title">
        <WorkGrid />
      </section>

      <Cta />
    </>
  );
}
