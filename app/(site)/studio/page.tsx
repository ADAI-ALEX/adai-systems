import Image from "next/image";
import Link from "next/link";
import { pageMeta } from "@/components/site/meta";
import { Cta, Panel } from "@/components/site/parts";
import { byDate, counts } from "@/content/projects";
import { site } from "@/content/site";

export const metadata = pageMeta({
  title: "Studio",
  description: `ADAI Systems is an independent technology studio run by Alex, founded in ${site.founded} and operated by FitDawg Ltd.`,
  path: "/studio",
  card: "studio",
});

/**
 * To add a photo of Alex later: put the file in /public/assets and set its
 * path here. The layout already has a slot for it, and falls back to the mark.
 */
const PORTRAIT: { src: string; alt: string } | null = null;

export default function StudioPage() {
  return (
    <>
      <header className="page-head">
        <p className="crumb">
          <Link href="/">home</Link> / studio
        </p>
        <h1>The studio</h1>
        <p className="lede">{site.line}</p>
      </header>

      <section className="block" aria-label="About">
        <Panel title="whoami">
          <div className="whoami">
            {PORTRAIT ? (
              <Image className="portrait" src={PORTRAIT.src} alt={PORTRAIT.alt} width={352} height={352} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="portrait" src="/assets/logo/adai-mark-white.svg" alt="" width={176} height={176} />
            )}
            <div className="prose">
              <p style={{ marginTop: 0 }}>
                I&apos;m Alex. I run ADAI Systems, an independent technology studio, and I build and ship across AI,
                automation and consumer apps.
              </p>
              <p>
                The studio started in {site.founded} as an AI agency, building custom systems for businesses:
                assistants, chatbots, voice agents, automated workflows and the software around them. Most of what is
                in the archive started as a problem met in that work.
              </p>
              <p>
                It stays small. It builds its own tools, ships its own products, and keeps the research that did not
                become a product.
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="facts">
          <dl className="sheet" style={{ maxWidth: "60ch" }}>
            <div>
              <dt>studio</dt>
              <dd>{site.name}</dd>
            </div>
            <div>
              <dt>founded</dt>
              <dd>{site.founded}</dd>
            </div>
            <div>
              <dt>operator</dt>
              <dd>FitDawg Ltd</dd>
            </div>
            <div>
              <dt>archive</dt>
              <dd>
                <Link className="link" href="/work">
                  {counts.total} projects
                </Link>
                , {counts.running} running now
              </dd>
            </div>
            <div>
              <dt>contact</dt>
              <dd>
                <a className="link" href={`mailto:${site.email}`}>
                  {site.email}
                </a>
              </dd>
            </div>
          </dl>
          <p className="note">{site.operator}</p>
        </Panel>

        <Panel title="lineage">
          <ol className="lineage">
            {byDate.map((project) => (
              <li key={project.slug}>
                <Link href={`/work/${project.slug}`}>{project.chapter.toLowerCase()}</Link>
              </li>
            ))}
          </ol>
        </Panel>
      </section>

      <Cta />
    </>
  );
}
