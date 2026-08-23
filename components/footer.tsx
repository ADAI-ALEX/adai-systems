import Image from "next/image";
import Link from "next/link";
import { Container } from "./section";
import { externalLinks, siteConfig } from "@/lib/site-config";

const footerNav = [
  {
    title: "Index",
    links: [
      { label: "System", href: "/#system" },
      { label: "Work", href: "/#work" },
      { label: "Research", href: "/#research" },
      { label: "Studio", href: "/#studio" },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "Lockout", href: externalLinks.lockout, external: true },
      { label: "FitDawg", href: externalLinks.fitdawg, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const;

/**
 * Deliberately not a sitemap. The site is one directory with a handful of
 * project pages; the footer's job is the studio's name, what it is, how to
 * reach it, and who operates it.
 */
export function Footer() {
  return (
    <footer className="border-t border-rule bg-paper">
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div className="max-w-sm">
            <Link href="/" aria-label={`${siteConfig.name} — home`}>
              <Image
                src="/assets/logo/adai-wordmark.svg"
                alt={siteConfig.name}
                width={700}
                height={246}
                draggable={false}
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-ink-muted">
              {siteConfig.tagline}
            </p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="meta mt-6 inline-block text-ink transition-colors hover:text-ink-muted"
            >
              {siteConfig.contactEmail}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3 sm:gap-x-16">
            {footerNav.map((group) => (
              <div key={group.title}>
                <h2 className="meta-sm text-ink-faint">{group.title}</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[0.875rem] text-ink-muted transition-colors hover:text-ink"
                        >
                          {link.label} ↗
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[0.875rem] text-ink-muted transition-colors hover:text-ink"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-rule pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="meta-sm text-ink-faint">
            &copy; {new Date().getFullYear()} {siteConfig.legal.entityName}
          </p>
          <p className="meta-sm text-ink-faint">
            {siteConfig.legal.relationship}
          </p>
        </div>
      </Container>
    </footer>
  );
}
