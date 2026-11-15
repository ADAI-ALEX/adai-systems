import { Bar } from "./bar";
import { mono, sans } from "./fonts";
import { Footer } from "./parts";
import { Runtime } from "./runtime";

/** The shell every page sits in: fonts, tokens, bar, footer and behaviours. */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div id="site" className={`${sans.variable} ${mono.variable} site`}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Bar />
      <main id="main">{children}</main>
      <Footer />
      <Runtime />
    </div>
  );
}
