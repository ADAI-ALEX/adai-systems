import Link from "next/link";
import { pageMeta } from "@/components/site/meta";
import { Arrow } from "@/components/site/parts";
import { copy, site } from "@/content/site";
import "../start/start.css";

export const metadata = pageMeta({
  title: "Contact",
  description: `Email ADAI Systems at ${site.email}. ${site.contactLine} Or let the brief builder write the first email for you.`,
  path: "/contact",
  card: "contact",
});

export default function ContactPage() {
  return (
    <div className="wrap page-head">
      <h1>Contact</h1>
      <a className="ct-mail" href={`mailto:${site.email}`}>
        {site.email}
      </a>
      <p className="lede ct-line">{site.contactLine}</p>

      <section className="card ct-next" aria-labelledby="next-title">
        <div>
          <h2 id="next-title">Not sure what to write?</h2>
          <p className="lede">{copy.start.body}</p>
        </div>
        <Link className="btn btn-primary" href="/start">
          {copy.hire.cta} <Arrow />
        </Link>
      </section>
    </div>
  );
}
