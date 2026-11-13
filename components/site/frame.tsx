import { tokenAttributes } from "@/design/tokens";
import { Bar } from "./bar";
import { dot, mono } from "./fonts";
import { Footer } from "./parts";
import { Runtime } from "./runtime";
import { TweaksGate } from "./tweaks-gate";

/** The shell every real page sits in: fonts, tokens, bar, footer and behaviours. */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div id="site" className={`${mono.variable} ${dot.variable} site`} {...tokenAttributes()}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Bar />
      <main id="main">{children}</main>
      <Footer />
      <Runtime />
      <TweaksGate />
    </div>
  );
}
