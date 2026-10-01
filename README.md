# siddharth-yadav.vercel.app

Personal site. Static HTML, no build step, no dependencies to install.
Pushing to `main` redeploys automatically via Vercel, usually within a minute.

```
index.html                  all content lives here
assets/css/site.css         all styling
assets/js/site.js           all motion
assets/headshot.jpg         portrait (744×930)
Siddharth_Yadav_Resume.pdf  the downloadable CV
vercel.json                 headers and caching
```

---

## How to update it

Everything below can be done in the GitHub web editor — open the file, click the
pencil icon, edit, commit. No tools required.

### Change what you are doing now

Edit the **`<section class="now">`** block near the top of `index.html`. This is
deliberately the **only time-bound sentence on the site** — everything else is
written to stay true indefinitely. Update it whenever your situation changes.

### Add a new job

Find `<!-- ===================== 02 EXPERIENCE -->`. Copy an entire
`<article class="entry">…</article>` block, paste it **above** the existing one
(newest first), and edit the organisation, dates, tag, role, context line and
bullets. Keep `data-anim="fade"` on each `<li>` so it animates in.

### Add a new project or venture

Same, under `<!-- 04 VENTURES & PROJECTS -->`.

### Add a certification or award

Under `<!-- 07 CREDENTIALS -->`, copy one `<li>` inside the relevant `.cred`
block. The pattern is:

```html
<li><b>Name of thing</b>, Issuer <em>Short descriptive line</em></li>
```

### Change a headline number

The four large figures are in `<section class="band">`. Each one counts up from
zero, so the number appears twice — once in `data-to` and once as the visible
text. **Update both or they will disagree.**

```html
<span class="metric__n" data-to="11.5" data-dec="1" data-pre="₹" data-post="&nbsp;Cr">₹11.5&nbsp;Cr</span>
```

`data-dec` is the number of decimal places. `data-pre` / `data-post` are what sit
either side of the figure.

### Replace the CV

Overwrite `Siddharth_Yadav_Resume.pdf`, keeping the same filename so every link
on the page keeps working.

### Replace the photo

Replace `assets/headshot.jpg`. Use a portrait roughly **4:5** (744×930 is ideal)
and keep it **under ~150 KB** — resize before uploading; a phone photo is
typically 20–100× too large and will visibly slow the page. If the file is ever
missing, the site falls back to a serif "SY" monogram on its own.

### Update the footer date

`Last updated <time datetime="2026-10">October 2026</time>` — change both the
`datetime` attribute and the visible text.

---

## Things worth knowing

- **Nothing breaks if the animation libraries fail.** All motion is gated behind
  a `html.anim` class. If GSAP or Lenis do not load, that class is removed and
  the page renders complete and static. The same path is used for visitors who
  have reduced motion enabled.
- **`?motion=on`** forces animation on even when the operating system requests
  reduced motion — useful for demoing on a locked-down machine.
- **The intro plays once per browser session**, not on every navigation back.
- **Section numbers (01–08) are written by hand** in the `.eyebrow` paragraphs.
  If you insert a section in the middle, renumber the ones after it.
- Keep claims matched to the CV. Every figure on this page traces to a line in
  the master resume; if the resume changes, change the page with it.
