# ADAI Systems: adai.systems

The public site for **ADAI Systems**, an independent technology studio operated by FitDawg Ltd.

Next.js (App Router), TypeScript, statically prerendered. No CMS, no database, no analytics, no cookies.

## Adding a project

Edit one file: `content/projects.ts`. Append an object to `projects`:

```ts
{
  slug: "new-thing",             // becomes /work/new-thing
  title: "New Thing",
  start: "2026-12",              // decides where it lands in the archive
  dateLabel: "Dec 2026 to now",
  kind: "product",               // studio | product | research | demo | tool
  kindLabel: "Web app",
  status: "active",              // active | live | open-source | demo | built | research | on-hold | discontinued
  statusLabel: "Active",
  chapter: "The new thing",      // two or three words for the lineage strip
  pitch: "One line.",
  summary: "A short paragraph.",
  stack: ["TypeScript"],
  links: [{ label: "Source on GitHub", href: "https://github.com/..." }],
  media: [{ src: "/work/new-thing/home.webp", alt: "...", width: 1440, height: 900, type: "screen" }],
  story: { problem: "...", built: ["..."], how: ["..."], outcome: "...", honest: ["..."] },
}
```

That gives it an archive row, a case study, a place in the counts and the sitemap. To put it on the lineage map, add a line to `relations` in the same file. To list it under a domain, add its slug to `domains`. Then run `npm run build && npm start` and `npm run og` to make its share card.

Record the facts in `content/inventory.md` first. Nothing goes on a page that is not in the inventory.

## Where things are

| Path | What it is |
|---|---|
| `content/inventory.md` | Every fact the site may state, and where it came from |
| `content/projects.ts` | The project archive, domains, relations and STEVIE's replies |
| `content/site.ts` | Studio facts and shared copy |
| `app/(site)/` | The real pages: home, `/work`, `/work/[slug]`, `/research`, `/studio`, `/contact`, `/privacy`, `/terms` |
| `app/(site)/site.css` | All site styles, driven by the tokens |
| `design/tokens.css`, `design/tokens.ts` | The baked design config. See `design/README.md` |
| `components/site/` | Bar, terminal, archive table, lineage map, tweaks bar |
| `app/directions/`, `app/og/` | Review-only pages. They build on previews and return 404 in production |
| `taste/` | The taste vault. Local only: `npm run taste` |
| `scripts/` | Screenshots, share cards and the QA run |

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run build
npm start
npm run lint
npm run check        # QA against the running production build: layout at four widths, axe, links, interactions
npm run og           # regenerate the share cards in public/og
npm run taste        # the taste vault at http://localhost:4319/taste
```

`npm run check` and `npm run og` expect the built site on port 3000. Set `BASE_URL` to point them elsewhere.

## Rules

- No fact goes on a page unless it is in `content/inventory.md`.
- No client names, user counts, ratings or testimonials.
- No em dashes in copy, alt text or metadata.
- Real products get real screenshots. Generated imagery is for concepts only, and is labelled.
- `/privacy` and `/terms` keep their URLs and their wording. The privacy notice says the site collects nothing, so adding analytics, cookies or a form means changing that notice in the same commit.

## Deployment

Vercel project `adai-systems`. `main` is production (www.adai.systems). Every other branch gets a preview.
The Lockout and FitDawg sites are separate projects on their own subdomains and are not touched by this repo.
