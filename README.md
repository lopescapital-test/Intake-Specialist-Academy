# NeuroSage Hub — Clinical & Enrollment Foundations Course

An interactive, self-paced training site covering the clinical, family-experience, and consultative enrollment foundations for intake specialists: autism neuroscience, therapy modalities, the Pyramid of Learning, ABA, gut/inflammation, exercise & sunlight, integrative functional neurology, SPIN, DISC, call scripting, objections, urgency, commitment, and referrals.

Thirteen modules, sixty knowledge-check questions, progress tracking.

## What's here

| File | Purpose |
|------|---------|
| `index.html` | The app shell (structure + markup) |
| `styles.css` | Design system and layout |
| `app.js` | Routing, quiz logic, progress tracking |
| `course-data.js` | All module content + questions (generated from the source manual) |
| `neurohome_logo.html` | Reusable full NeuroHome logo lockup snippet |
| `neurohome_icon.svg` | Reusable NeuroHome house icon SVG |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

No build step, no dependencies, no server code. It's a static site — open
`index.html` locally or host it anywhere that serves files.

## Deploy to GitHub Pages

1. Create a new repository (e.g. `neurosage-course`) and push these files to the
   default branch:
   ```bash
   git init
   git add index.html styles.css app.js course-data.js neurohome_logo.html neurohome_icon.svg .nojekyll README.md
   git commit -m "Clinical and enrollment foundations course (Modules 1–13)"
   git branch -M main
   git remote add origin https://github.com/<you>/neurosage-course.git
   git push -u origin main
   ```
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**,
   **Branch = main**, **folder = / (root)**. Save.
4. Wait ~1 minute. Your course is live at
   `https://<you>.github.io/neurosage-course/`.

To keep it private to staff, use a private repo with GitHub Pages restricted to
your organization (requires GitHub Enterprise), or host it behind whatever auth
your other internal tools use.

## Editing content

Module content lives in `course-data.js` as a single `window.COURSE` object:
`modules[]`, each with `number`, `title`, `subtitle`, `html` (the lesson body),
and `questions[]` (each `stem`, `options[]`, and `answer` letter). Edit the text
there and reload — no rebuild needed.

## Note on the knowledge-check answer keys

The source manual includes an answer key only for its final comprehensive exam,
not for the per-module checks. The per-module answers in `course-data.js` were
derived automatically and cross-checked against the final-exam key where the
questions overlapped. **Have the clinical lead confirm all 60 answers before this
is used for certification** — every one is easy to change in `course-data.js`.

## Scope

This site covers the clinical/educational and enrollment material (Modules 1–13).
It is internal training, not medical advice, and does not itself make treatment
claims to families.
