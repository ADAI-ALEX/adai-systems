import { Doto, JetBrains_Mono } from "next/font/google";

/** Self-hosted at build time by next/font. No request leaves for Google at runtime. */
export const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
export const dot = Doto({ subsets: ["latin"], variable: "--font-dot", display: "swap", axes: ["ROND"] });
