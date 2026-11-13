import Link from "next/link";
import { pageMeta } from "@/components/site/meta";
import { Panel } from "@/components/site/parts";
import { copy, site } from "@/content/site";

export const metadata = pageMeta({
  title: "Contact",
  description: "Custom AI systems, automation and software. One email address, read by a person.",
  path: "/contact",
  card: "contact",
});

export default function ContactPage() {
  return (
    <>
      <header className="page-head">
        <p className="crumb">
          <Link href="/">home</Link> / contact
        </p>
      </header>
      <section className="block" style={{ paddingTop: 0 }} aria-labelledby="contact-title">
        <Panel title="new session" className="cta">
          <h1 id="contact-title" style={{ fontSize: "clamp(2.5rem, 9.4vw, 10rem)" }}>
            {copy.hire.lead}
          </h1>
          <p className="lede">{copy.hire.body}</p>
          <p>
            <a className="mail" href={`mailto:${site.email}`}>
              <span aria-hidden="true">$ mail </span>
              {site.email}
            </a>
          </p>
          <p className="t-dim">{site.contactLine}</p>
        </Panel>
        <Panel title="also">
          <ul className="points">
            <li>New work: custom AI systems, automation and software.</li>
            <li>Questions about anything in the archive.</li>
            <li>Support for one of the live products.</li>
          </ul>
          <p className="note">
            The link opens your own mail app. Nothing on this page is sent anywhere, and there is no form.
          </p>
        </Panel>
      </section>
    </>
  );
}
