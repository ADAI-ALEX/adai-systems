import { process } from "@/content/services";
import { copy } from "@/content/site";

/** The four steps of a project, as a numbered row. */
export function Process() {
  return (
    <section className="section wrap rise" aria-labelledby="process-title">
      <header className="section-head">
        <h2 id="process-title">{copy.process.title}</h2>
        <p className="lede">{copy.process.body}</p>
      </header>
      <ol className="sv-steps">
        {process.map((step, index) => (
          <li key={step.title}>
            <span className="meta">0{index + 1}</span>
            <h3>{step.title}</h3>
            <p className="mute">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
