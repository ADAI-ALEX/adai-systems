# ADAI Systems: adai.systems

The public site for **ADAI Systems**, an independent technology studio operated by FitDawg Ltd.

This branch (`redesign`) is a rebuild in progress. `main` still holds the live site.

## Where things are

| Path | What it is |
|---|---|
| `content/inventory.md` | Every fact the site may state, and where it came from |
| `content/projects.ts` | The project archive. One typed file: add a project here and every page picks it up |
| `content/site.ts` | Studio facts and shared copy |
| `app/directions/` | Three candidate directions and the page that compares them (temporary) |
| `design/` | Taste brief, imagery plan, direction notes and screenshots |
| `taste/` | The taste vault. Local only: `npm run taste`, then http://localhost:4319/taste |
| `scripts/` | Reference capture, screenshots, overflow and interaction checks |

## Running it

```bash
npm install
npm run dev        # http://localhost:3000, which redirects to /directions
npm run build
npm run lint
```

## Rules

- No fact goes on a page unless it is in `content/inventory.md`.
- No client names, user counts, ratings or testimonials.
- No em dashes in copy, alt text or metadata.
- Real products get real screenshots. Generated imagery is for concepts only, and is labelled.
- `/privacy` and `/terms` keep their URLs and their wording.
