"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { copy } from "@/content/site";

export const PAGES = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/research", label: "Research" },
  { href: "/studio", label: "Studio" },
] as const;

export function Bar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [last, setLast] = useState(pathname);

  // Close the menu whenever the page changes.
  if (last !== pathname) {
    setLast(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="bar" data-stuck={stuck || open}>
      <div className="wrap bar-in">
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo/adai-mark-white.svg" alt="" width={28} height={28} />
          ADAI Systems
        </Link>
        <nav id="site-nav" aria-label="Main" data-open={open}>
          {PAGES.map((page) => (
            <Link key={page.href} href={page.href} aria-current={pathname.startsWith(page.href) ? "page" : undefined}>
              {page.label}
            </Link>
          ))}
          <Link className="btn btn-primary" href="/start">
            {copy.hero.primary}
          </Link>
        </nav>
        <Link className="btn btn-primary btn-small bar-cta" href="/start">
          {copy.hero.primary}
        </Link>
        <button
          type="button"
          className="btn btn-small menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
    </header>
  );
}
