# Deploying to Vercel

No Vercel credentials were available on the machine this project was built on —
there is no `~/.vercel`, and the CLI is not installed or logged in. Everything
below therefore has to be done once, by hand. It takes about five minutes.

**Nothing here affects the existing Lockout or FitDawg deployments.** Those are
separate Vercel projects with their own repositories and their own domains. This
adds a third project alongside them.

---

## 1. Import the repository

1. Go to <https://vercel.com/new>, signed in as the account that owns the
   existing `lockout` project.
2. Choose **Import Git Repository** and pick `ADAI-ALEX/adai-systems`.
   If it is not listed, use **Adjust GitHub App Permissions** and grant Vercel
   access to that repository.
3. On the configuration screen, keep every default:

   | Setting | Value |
   | --- | --- |
   | Framework Preset | Next.js *(detected)* |
   | Root Directory | `./` |
   | Build Command | `next build` *(default)* |
   | Output Directory | *(leave blank — Next.js default)* |
   | Install Command | `npm install` *(default)* |
   | Node.js Version | 22.x or 24.x |

   The root directory matters: this repository **is** the site, so it is `./` and
   not a subfolder. Do not copy the Lockout project's settings, which point at
   `lockout-site/`.

4. Name the Vercel project `adai-systems`.

---

## 2. Environment variable

Add one variable, for **Production** only:

```
NEXT_PUBLIC_SITE_URL = https://adai.systems
```

This is the canonical origin. It feeds `metadataBase`, the canonical `<link>`
tags, the Open Graph URLs, `robots.txt` and `sitemap.xml`.

Leave it unset on Preview and Development. `lib/site-config.ts` falls back to
`https://adai.systems`, so a preview build still renders correctly — it will
just advertise the production URL as canonical, which is what you want for
previews anyway.

There are no secrets. The site has no API keys, no database, no analytics and no
server-side code.

---

## 3. Deploy and check the preview

Deploy. On the generated `*.vercel.app` URL, confirm:

- [ ] The homepage renders, and the hero shows **Fig. 01** with eight nodes
- [ ] §04 The archive: the **Timeline / Network** toggle switches views, and the
      filters (All / Active / Products / Research / Archived / Private) work
- [ ] `/work/lockout` and `/work/apex-terminal` load — the second one shows
      **Availability: Private** with no outbound link
- [ ] `/privacy`, `/terms` and a deliberate 404 (`/work/nope`) all render
- [ ] `/sitemap.xml` and `/robots.txt` respond
- [ ] `/opengraph-image` returns a 1200×630 PNG
- [ ] The browser tab shows the ADAI mark as its favicon

---

## 4. Point the domain

In **Project → Settings → Domains**:

1. Add `adai.systems`.
2. Add `www.adai.systems` and let Vercel redirect it to the apex.
3. Follow Vercel's DNS instructions at whichever registrar or DNS provider holds
   `adai.systems` — an `A` record for the apex, a `CNAME` for `www`.

### Do not disturb the subdomains

`lockout.adai.systems` and `fitdawg.adai.systems` are separate records on the
same zone, pointing at different Vercel projects. Adding the apex domain here
does not touch them, **as long as you add `adai.systems` and not a wildcard**.

Do not add `*.adai.systems` to this project.

After DNS propagates, re-check that all three still resolve:

```bash
curl -sI https://adai.systems        | head -1
curl -sI https://lockout.adai.systems  | head -1
curl -sI https://fitdawg.adai.systems  | head -1
```

---

## 5. Afterwards

- Pushes to `main` deploy to production; pull requests get preview URLs.
- If analytics are ever added, `app/privacy/page.tsx` has to change in the same
  commit — it currently states, truthfully, that the site collects nothing and
  sets no cookies.

## Deploying somewhere else

Nothing here is Vercel-specific. It is a standard Next.js App Router project
with no server-side data and no runtime environment beyond `NEXT_PUBLIC_SITE_URL`,
so `npm run build && npm start` works on any Node host. A fully static export
would need `output: "export"` in `next.config.ts`; the only thing that would lose
is the dynamically generated Open Graph image, which would need to become a
static file in `public/`.
