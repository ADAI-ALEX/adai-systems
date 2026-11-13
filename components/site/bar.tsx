"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { counts } from "@/content/projects";
import { site } from "@/content/site";

export const PAGES = [
  { href: "/", label: "home" },
  { href: "/work", label: "work" },
  { href: "/research", label: "research" },
  { href: "/studio", label: "studio" },
  { href: "/contact", label: "contact" },
] as const;

export function Bar() {
  const pathname = usePathname();
  const current = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="bar">
      <Link className="bar-brand" href="/">
        <span aria-hidden="true">✦</span> ADAI SYSTEMS
      </Link>
      <nav aria-label="Main">
        {PAGES.map((page, index) => (
          <Link key={page.href} href={page.href} aria-current={current(page.href) ? "page" : undefined}>
            <kbd aria-hidden="true">{index + 1}</kbd>
            {page.label}
          </Link>
        ))}
      </nav>
      <p className="bar-right">
        <span className="dot dot-live" aria-hidden="true" />
        {counts.running} running <span className="t-dim">&nbsp;· est. {site.foundedShort.toLowerCase()}</span>
      </p>
    </header>
  );
}
