import { IBM_Plex_Mono, Mona_Sans } from "next/font/google";

/** Self-hosted at build time by next/font. No request leaves for Google at runtime. */
export const sans = Mona_Sans({ subsets: ["latin"], axes: ["wdth"], variable: "--font-sans", display: "swap" });
export const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
