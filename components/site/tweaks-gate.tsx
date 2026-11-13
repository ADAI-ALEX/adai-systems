"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// Written as one inlined condition so a production build drops the import,
// and the tweaks bar's code is never emitted there at all.
const Tweaks =
  process.env.NEXT_PUBLIC_TWEAKS === "1"
    ? dynamic(() => import("./tweaks/tweaks").then((module) => module.Tweaks), { ssr: false })
    : null;

const subscribe = () => () => {};
const wanted = () => new URLSearchParams(window.location.search).get("tweaks") === "1";

/**
 * Loads the tweaks bar only when the build allows it (never in production,
 * see next.config.ts) and the address carries ?tweaks=1.
 */
export function TweaksGate() {
  const show = useSyncExternalStore(subscribe, wanted, () => false);
  return Tweaks && show ? <Tweaks /> : null;
}
