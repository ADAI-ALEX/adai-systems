# ADAI Systems — adai.systems

The public site for **ADAI Systems**, an independent technology studio operated
by FitDawg Ltd.

It is not a company brochure. It is a map: one page that shows every project the
studio has built, when it was built, what state it is in now, and what it is
connected to — plus a page per project for the detail.

> ADAI Systems is the map. The projects are the nodes.

---

## The idea

A visitor should be able to answer six questions in under a minute:

| Question | Where the site answers it |
| --- | --- |
| What is this? | Hero — *Building intelligent software.* |
| What are they building **now**? | §02 Currently building — the two `active` projects |
| What do they work on? | §03 The system — eight domains, each backed by real projects |
| What have they built? | §04 The archive — eight projects, timeline or network |
| Why are those projects connected? | The relationship highlighting, and **Related work** on each project page |
| Is this a real company? | §06 Studio — entity, contact, live products |

Nothing on the site is claimed that is not also demonstrated. Domains list the
projects that prove them. Counts in the hero are computed from the archive. A
private project shows no link and no screenshot.

---

## Stack

- **Next.js 16** (App Router, Turbopack) — statically prerendered, no server
- **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4** — tokens in `app/globals.css`, no config file
- **Geist Sans + Geist Mono** via the `geist` package
- No CMS, no database, no analytics, no client-side data fetching

Two runtime dependencies beyond React and Next: none. Icons and diagrams are
inline SVG, and the arrows are text.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # eslint
npm test           # data-integrity tests (node --test)
npm run typecheck  # tsc --noEmit
```

---

## Architecture

```text
app/
  layout.tsx            root shell, metadata, Organization JSON-LD, skip link
  page.tsx              the whole homepage, sections 01-06
  work/[id]/page.tsx    one page per project, statically generated
  privacy/ terms/       legal pages (cover this website only)
  not-found.tsx         404, with the full archive listed
  opengraph-image.tsx   share card, drawn from the same graph data
  icon.svg              favicon — the ADAI mark
  robots.ts sitemap.ts  generated from the archive

components/
  nav / footer          site chrome
  hero                  headline, the graph as "Fig. 01", the counts readout
  currently-building    the active projects, large
  domains               §03, the technical index
  lineage               the studio's evolution as one line
  explorer              §04 — filters, view toggle, and the shared `activeId`
  timeline-view         the archive, chronological, on a spine
  network-view          the archive, as relationships
  research              §05, on ink
  studio                §06, contact and entity
  project-card          one project, in `block` or `row` shape
  project-graph         a project's neighbourhood, cut from the main map
  related-work status section reveal legal-layout

lib/
  projects.ts           THE ARCHIVE — every project, and the derived views
  domains.ts            the eight technical domains and their evidence
  graph.ts              node/edge geometry, curve maths, viewBox fitting
  site-config.ts        company facts: name, entity, contact, domain

tests/
  projects.test.ts      invariants the whole site depends on
```

### One source of truth

Every view is derived from `lib/projects.ts`:

- the hero counts (`08 projects · 02 active · 04 research`)
- the timeline, its year groups and its ordering
- the network's nodes and edges
- the lineage strip
- **Currently building** (`status: "active"`)
- **Research** (a named set of ids)
- the domain index's evidence lists
- every `/work/[id]` route, its metadata, and the sitemap

No project copy is written anywhere else.

---

## Adding a project

1. **Append an object to `projects` in `lib/projects.ts`.** Array order does not
   matter — `start` decides where it lands.

   ```ts
   {
     id: "new-thing",              // becomes /work/new-thing
     title: "New Thing",
     dateLabel: "Oct 2026 — Now",  // rendered verbatim
     start: "2026-10",             // sortable; drives the timeline
     end: null,                    // null while it is still running
     type: "consumer",
     typeLabel: "Consumer App",
     status: "active",             // active | discontinued | on-hold | private | research
     mayReturn: false,             // renders "DISCONTINUED · MAY RETURN"
     chapter: "The new thing",     // two or three words, for the lineage strip
     short: "One line for cards.",
     summary: "The considered description, for the top of the detail page.",
     body: ["Paragraph one.", "Paragraph two."],
     tags: ["At least", "three", "technical themes"],
     related: ["adai-systems"],    // must be listed on both sides
     url: "https://…",             // only if something public actually exists
     urlLabel: "example.com",
     featured: false,
     node: { x: 700, y: 200, label: "top" },   // optional; puts it on the map
   }
   ```

2. **Give it a `node`** if it should appear in the network view. Coordinates are
   on a 1000 × 560 canvas and are hand-placed, not force-directed — the layout
   is composed so edges stay legible. Keep nodes at least 90 units apart; a test
   enforces it.

3. **Name it in a domain** in `lib/domains.ts`. A test enforces that every
   project belongs to at least one.

4. **Run `npm test`.** The suite checks the things that break silently: dangling
   `related` ids, one-sided relationships, a `dateLabel` that disagrees with
   `start`, an open-ended project with an end date, a private project that
   publishes a URL, nodes that collide, domains naming projects that do not
   exist.

That is the whole process. No other file needs editing.

### Status vocabulary

| Status | Means | Mark |
| --- | --- | --- |
| `active` | Currently built and maintained | filled ● |
| `discontinued` | No longer in active development | hollow ○ |
| `discontinued` + `mayReturn` | Archived, but not abandoned | hollow ○ |
| `on-hold` | Paused, work intact | thick ring ◎ |
| `private` | Exists, not publicly accessible | square ▫ |
| `research` | Experimental, never a public product | ringed dot ◉ |

Status is carried by the **shape** of the mark, not by colour. That keeps the
archive readable in a monochrome palette and stops a discontinued project being
styled like a warning.

---

## Design

Lockout's visual language, widened into a studio.

- **Ground.** Lockout is a white product page with grey cards; ADAI is a paper
  page (`#fafafa`) with white cards lifted off it. Same ink, same hairlines,
  different ground — a family, not a second product.
- **Two voices.** Editorial sans for everything said in words; uppercase mono
  (`.meta`, `.meta-sm`) for everything technical — dates, indices, statuses,
  figure captions. The contrast between them is the whole typographic idea.
- **No accent colour.** Six statuses would have become six colours. They became
  six shapes instead.
- **The blueprint field.** A 1px grid at the opacity of a pencil guide, behind
  the hero and the archive, so the page reads as drawn on something.
- **The graph is one drawing.** The hero's Fig. 01, the network view and each
  project page's "position in the system" all share `lib/graph.ts` — the same
  coordinates, the same curve maths. Scrolling resolves a faint diagram into the
  thing it was a diagram of.
- **Restrained motion.** Scroll reveals, hover transitions, and one draw-in on
  the hero. Nothing loops. Everything is disabled under
  `prefers-reduced-motion`, and no content depends on motion to become visible.

### Accessibility

- Semantic landmarks, one `h1` per page, ordered headings, skip link
- Every interactive element is a real link or button with an accessible name
- 2px focus ring at 3px offset, verified against real keyboard traversal
- Ink scale is AA throughout: 16:1 / 7.4:1 / 4.7:1 on paper; on the dark section
  white/75 and white/60
- Timeline is the default view at every width, so nothing needs hover; the
  network's relationship highlighting responds to focus as well as pointer

### Responsive

The timeline is the mobile experience — a vertical history is the right shape
for the content, not a shrunken diagram. The network view remains available and
pans horizontally below ~900px, opening centred on the hub.

---

## Content rules

- No invented users, revenue, clients, downloads, funding, partnerships or
  results. Project descriptions say what a project was.
- A `private` project gets no link and no fabricated screenshot — it gets an
  abstract diagram of where it sits and a sentence saying it is closed.
- A `discontinued` project that still has a live site says so before the link.
- The public brand is **ADAI Systems**; the legal entity is **FitDawg Ltd**. The
  site states the relationship rather than implying ADAI is incorporated.
- The registered address and company number are not published because they have
  not been provided. They are not guessed at.

---

## Deployment

Intended production domain: **https://adai.systems**

See [`VERCEL_SETUP.md`](./VERCEL_SETUP.md) for the connection steps. In short:
import the repo on Vercel, keep every default (Next.js, root directory `./`),
set `NEXT_PUBLIC_SITE_URL=https://adai.systems`, and point the apex domain at
it. The Lockout and FitDawg projects are separate Vercel projects on their own
subdomains and are not touched by any of this.

## Repository

`github.com/ADAI-ALEX/adai-systems` — this site only. The Lockout app and the
Lockout marketing site live in their own repositories.
