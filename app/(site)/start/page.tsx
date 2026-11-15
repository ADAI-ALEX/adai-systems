import { pageMeta } from "@/components/site/meta";
import { Process } from "@/components/site/services/process";
import { BriefBuilder } from "@/components/site/start/brief";
import { copy, site } from "@/content/site";
import "../services/services.css";
import "./start.css";

export const metadata = pageMeta({
  title: "Start a project",
  description:
    "Answer a few questions and this page writes your first email to ADAI Systems. Nothing is sent from the page: it opens in your own mail app and you press send.",
  path: "/start",
  card: "start",
});

export default function StartPage() {
  return (
    <>
      <header className="wrap page-head st-head">
        <h1>{copy.start.title}</h1>
        <p className="lede">{copy.start.body}</p>
      </header>

      <section className="wrap st-section" aria-label="Project brief">
        <noscript>
          <p className="st-noscript">
            This page needs JavaScript to write the email for you. Without it, email{" "}
            <a className="link" href={`mailto:${site.email}?subject=New%20project`}>
              {site.email}
            </a>{" "}
            with what you need, what it should do, and when you need it.
          </p>
        </noscript>
        <BriefBuilder />
      </section>

      <Process />
    </>
  );
}
