import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How adai.systems handles data. The site sets no cookies, runs no analytics and collects nothing about visitors.",
  alternates: { canonical: "/privacy" },
};

/**
 * This notice covers adai.systems and nothing else.
 *
 * It is short because the site genuinely is: no analytics, no cookies, no
 * forms, no accounts. Everything stated here is true of the site as built. If
 * analytics are ever added, this page has to change in the same commit.
 *
 * The registered address and company number of the operating entity are not
 * recorded here because they have not been provided. They are not invented.
 */
export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy notice"
      intro={
        <>
          This notice covers {siteConfig.url.replace("https://", "")}. It does
          not cover the products linked from it. Lockout and FitDawg publish
          their own policies.
        </>
      }
    >
      <h2>Who operates this site</h2>
      <p>
        {siteConfig.legal.relationship} Questions about this notice can go to{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>
          {siteConfig.contactEmail}
        </a>
        .
      </p>

      <h2>What this site collects</h2>
      <p>
        Nothing. There are no analytics, no tracking pixels, no advertising
        tags, no embedded third-party scripts and no accounts. The site sets no
        cookies, and it stores nothing in your browser.
      </p>
      <p>
        There are no forms. The only way to send anything to the studio from
        this site is to use the email address, which opens your own mail client.
      </p>

      <h2>Hosting</h2>
      <p>
        The site is served by a hosting provider, which, like any web host,
        keeps operational server logs. Those logs can include an IP address, a
        browser user-agent string and the time of a request, and exist for
        security, abuse prevention and keeping the service running. The studio
        does not use them to build a profile of anyone, and does not combine
        them with anything else.
      </p>

      <h2>Email</h2>
      <p>
        If you email the address above, that message and your address are used
        to reply to you and are kept as ordinary correspondence. They are not
        added to a mailing list, and they are not passed to anyone else.
      </p>

      <h2>Links to other sites</h2>
      <p>
        Project pages link out to <Link href="/work/lockout">Lockout</Link> and{" "}
        <Link href="/work/fitdawg">FitDawg</Link>. Those are separate sites with
        their own privacy practices, and this notice stops at the link.
      </p>

      <h2>Your rights</h2>
      <p>
        Where the studio holds personal data about you (in practice, only an
        email exchange you started) you can ask what is held, ask for it to be
        corrected, or ask for it to be deleted. Email the address above and it
        will be handled.
      </p>
      <p>
        The operating entity&rsquo;s registered address and company number are
        not published on this page. They have not been recorded here rather than
        guessed at, and will be added when they are confirmed.
      </p>

      <h2>Changes</h2>
      <p>
        This notice describes the site as it is currently built. If the site
        ever starts collecting something, this page changes at the same time.
        The date at the top is the current revision.
      </p>
    </LegalLayout>
  );
}
