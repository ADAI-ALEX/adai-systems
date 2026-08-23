import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/legal-layout";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of use for adai.systems — what the site is, what it is not, and what is published on it.",
  alternates: { canonical: "/terms" },
};

/**
 * Terms of use for the website itself.
 *
 * Scope is narrow on purpose: this is a public archive with no accounts, no
 * payments and no service being sold through it, so most of what a product's
 * terms would carry does not apply. Governing law is left open for the same
 * reason it is on the Lockout site — the entity details are not settled, and
 * a clause that depends on them should not be invented.
 */
export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of use"
      intro={
        <>
          These terms cover the use of{" "}
          {siteConfig.url.replace("https://", "")}. They are not the terms of
          any product listed on it.
        </>
      }
    >
      <h2>What this site is</h2>
      <p>
        {siteConfig.url.replace("https://", "")} is a public archive of the work
        of {siteConfig.name}. {siteConfig.legal.relationship} There are no
        accounts, no payments and nothing sold here.
      </p>

      <h2>What is published here</h2>
      <p>
        Project entries describe work the studio has done, including work that
        has been discontinued, paused or kept private. They are descriptions of
        what a project was, not offers, commitments or a promise that anything
        listed will be built, resumed or made available.
      </p>
      <p>
        A project marked <strong>private</strong> has no public build. A project
        marked <strong>discontinued</strong> is not in active development, even
        where a link to it still resolves.
      </p>

      <h2>Accuracy</h2>
      <p>
        The archive is kept accurate to the studio&rsquo;s own record of it.
        Dates and statuses are as recorded; nothing here should be read as
        audited or independently verified. If something on the site looks wrong,{" "}
        <a href={`mailto:${siteConfig.contactEmail}`}>tell the studio</a> and it
        will be corrected.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The {siteConfig.name} name, mark, written content and the design of this
        site belong to their owner. You are welcome to read, link to and quote
        from the site; nothing on it transfers any rights in the work it
        describes.
      </p>

      <h2>Links out</h2>
      <p>
        The site links to separate sites operated for individual products. Those
        sites have their own terms, and following a link takes you outside the
        scope of this document.
      </p>

      <h2>No warranty</h2>
      <p>
        The site is provided as it is. The studio does not warrant that it will
        be uninterrupted or error-free, and does not accept liability for
        decisions taken on the basis of a project description published here.
      </p>

      <h2>Governing law</h2>
      <p>
        To be confirmed alongside the registered details of the operating
        entity, which are not published on this site yet. See the{" "}
        <Link href="/privacy">privacy notice</Link> for the same point.
      </p>

      <h2>Changes</h2>
      <p>
        These terms describe the site as it currently stands. The date at the
        top is the current revision.
      </p>
    </LegalLayout>
  );
}
