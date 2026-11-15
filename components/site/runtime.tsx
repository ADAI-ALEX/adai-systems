"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Marks sections as they scroll into view, for the one quiet entrance the site uses. */
export function Runtime() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.getElementById("site");
    if (!root) return;
    root.dataset.js = "";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.seen = "";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    root.querySelectorAll(".rise").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
