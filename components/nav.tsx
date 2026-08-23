"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";

/**
 * The four sections of the homepage, in the order the page tells them. The
 * navigation is deliberately this short: the site is one directory, not a
 * sitemap, and every link here is a position in that directory.
 */
const sections = [
  { label: "System", hash: "#system" },
  { label: "Work", hash: "#work" },
  { label: "Research", hash: "#research" },
  { label: "Studio", hash: "#studio" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/";

  // The bar only grows a hairline once the page has moved, so it reads as a
  // layer over the paper rather than permanent chrome.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the open sheet, and let Escape close it. The sheet
  // itself is closed by whichever link was tapped rather than by watching the
  // route, so there is no state to synchronise here on navigation.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // From a project page an anchor has to carry the route with it.
  const href = (hash: string) => (onHome ? hash : `/${hash}`);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-paper/90 backdrop-blur-sm transition-colors duration-300 ${
        scrolled ? "border-b border-rule" : "border-b border-transparent"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8"
      >
        <Link
          href="/"
          className="shrink-0"
          aria-label={`${siteConfig.name} — home`}
        >
          <Image
            src="/assets/logo/adai-wordmark.svg"
            alt={siteConfig.name}
            width={700}
            height={246}
            priority
            draggable={false}
            className="h-[26px] w-auto sm:h-7"
          />
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {sections.map((section) => (
            <Link
              key={section.hash}
              href={href(section.hash)}
              className="meta text-ink-muted transition-colors hover:text-ink"
            >
              {section.label}
            </Link>
          ))}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="meta text-ink-muted transition-colors hover:text-ink"
          >
            Contact
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center md:hidden"
        >
          {/* Two rules that cross into an X — no icon dependency for two lines. */}
          <span className="relative block h-3 w-5">
            <span
              className={`absolute left-0 block h-px w-5 bg-ink transition-transform duration-300 ${
                open ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 block h-px w-5 bg-ink transition-transform duration-300 ${
                open ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile sheet. Stays mounted so the height animates, and uses `inert`
          rather than `hidden` so it leaves the tab order without losing the
          transition. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`grid overflow-hidden bg-paper transition-[grid-template-rows] duration-300 ease-out md:hidden ${
          open ? "grid-rows-[1fr] border-t border-rule" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col px-5 pb-6 pt-2">
            {sections.map((section) => (
              <Link
                key={section.hash}
                href={href(section.hash)}
                onClick={() => setOpen(false)}
                className="meta border-b border-rule py-4 text-ink"
              >
                {section.label}
              </Link>
            ))}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="meta py-4 text-ink-muted"
            >
              {siteConfig.contactEmail}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
