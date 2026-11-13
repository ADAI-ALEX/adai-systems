"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PAGES } from "./bar";

/**
 * Small page behaviours.
 * Number keys 1 to 5 switch pages, the way Glimmer's terminal lab switches
 * screens. Sections marked .reveal are flagged as they come into view, which
 * the optional entrance styles use.
 */
export function Runtime() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      const page = PAGES[Number(event.key) - 1];
      if (page) router.push(page.href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    const root = document.getElementById("site");
    if (!root) return;
    root.dataset.js = "";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) element.dataset.seen = "";
          else if (root.dataset.replay === "on") delete element.dataset.seen;
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    root.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
