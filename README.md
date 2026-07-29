# 📚 Family Learning Portal — Youssef & Yassine

A private, kid-friendly web portal that turns the boys' Cambridge results and summer
guides into **interactive learning**, **personalised to each child's own development
areas**. Every subject follows an **8-week plan (Week 1 → Week 8)**, and each week the
child gets

**① Learn** (development content) → **② Train** (unlimited practice, instant feedback)
→ **③ Quiz** (scored, with a pass mark) → the result is saved, **stars are earned**, and
the week's outcome is assessed automatically.

Each child also sees a **"My Growth" chart**: a bar per development area showing where
they **started** (from their report) versus **now**, so progress is visible and motivating.
Passing quizzes pushes the bar to the right and earns ⭐ (3 stars for a perfect score).

A **Parent** login shows both boys' growth charts and stars side-by-side.

It is a **static website** (just HTML/CSS/JavaScript, no server or database), so it runs
anywhere and can be **published to free hosting** in a couple of minutes.

---

## 1. Try it on your own computer first

1. Open a terminal in this folder.
2. Run a tiny local web server:
   ```powershell
   python -m http.server 8770
   ```
3. Open **http://127.0.0.1:8770** in your browser.

> You can also just double-click `index.html`, but a server is closer to how it behaves online.

### Log in accounts (change these!)
| Username  | Password (default) | Sees |
|-----------|--------------------|------|
| `youssef` | `youssef123`       | Youssef's subjects & milestones |
| `yassine` | `yassine123`       | Yassine's subjects & milestones |
| `parent`  | `parent123`        | Both boys' progress dashboard |

**➡ Change usernames and passwords** by editing the `users` section at the top of
`js/config.js`. Save the file and refresh.

---

## 2. Publish it online for FREE

Because it's a static site, any of these free hosts work. **Easiest first:**

### Option A — Netlify Drop (no account signup needed to try) ⭐ easiest
1. Go to **https://app.netlify.com/drop**
2. **Drag this whole folder** (`Yassine and Youssef dev`) onto the page.
3. Netlify gives you a public link like `https://something.netlify.app` — done!
   Share that link with the boys. To update, drag the folder again.

### Option B — GitHub Pages (free, permanent)
1. Create a free account at github.com and a new repository.
2. Upload all the files in this folder to the repository.
3. In the repo: **Settings → Pages → Build from a branch → `main` / root → Save**.
4. Your site appears at `https://<your-username>.github.io/<repo-name>/`.

### Option C — Cloudflare Pages / Vercel (free)
1. Cloudflare Pages: **https://pages.cloudflare.com** → "Upload assets" (or connect a repo).
2. Vercel: **https://vercel.com** → "Add New Project" → import the folder/repo.
   Framework preset: **Other / Static**. No build command needed.

> **Nothing to build or compile** — just upload the files exactly as they are.

---

## 3. Add REAL password protection (recommended if the link is public)

The built-in login is a *simple gate* — good for keeping the boys' dashboards separate,
but the passwords live in `js/config.js`, which a determined person could read. For a
public link, add proper protection at the host (all free tiers support this):

- **Cloudflare Pages + Cloudflare Access** (free): protect the site with a one-time
  email code or a Google login — the strongest free option.
- **Netlify**: site-wide password is available; basic-auth via a `_headers` file /
  Netlify Identity on paid tiers. For free, pair with Cloudflare Access in front.
- **Vercel**: enable **Password Protection** in project settings.

If you just want it private-ish for family use, the built-in login is fine — keep the
link unlisted and change the default passwords.

---

## 4. How the "always fresh content" works (500+ per milestone)

Instead of storing a fixed list of questions, the portal **generates them on the fly**
using seeded randomisation (`js/generators.js`). Every Train question and every Quiz is
a **new, unique set** — the boys can practise hundreds of times without running out.

Approximate number of **distinct questions** available per milestone:

| Subject | Milestones | Distinct questions each |
|---------|-----------|--------------------------|
| **Maths** | all 6 | **≈ 650 – 7,400** ✅ |
| **English (grammar/spelling/vocab)** | all 6 quiz milestones | **≈ 440 – 2,600** ✅ |
| **English writing tasks** | 4 | Endless prompts (open-ended, self-checked) |
| **Science** | 6 | **≈ 40 – 2,000 accurate curriculum facts** |

> **A note on Science:** a few science milestones (e.g. "the 7 life processes",
> "solar system") are based on real, fixed facts. Rather than invent 500 fake "facts"
> just to hit a number, these use a **large curated bank of accurate questions**
> (40–100+), each shown with **shuffled answers** so it still feels new every time.
> Over a 6-week summer this is plenty and keeps the science **correct**. Maths and most
> English milestones genuinely exceed 500+ unique questions.

The quiz **pass marks** come straight from the boys' guides (e.g. 8/10, or 7/7 for MRS GREN).

---

## 5. What's inside (built from their real results — different for each child)

Each child's plan targets **their own weak sub-strands** from the May 2026 report, so the
two boys get **different** weeks, lessons and quizzes.

**Youssef (Learner 4005)** — Maths 44 (Outstanding), English 34 (High), Science 44 (Outstanding).
Development areas: **Statistics/data** & fractions (Maths); **spelling, grammar, structure,
creativity, reflection** (English writing); **life processes, ecosystems, human body** (Biology).

**Yassine (Learner 4006)** — Maths 32 (High), English 42 (Outstanding), Science 40 (High).
Development areas: **fractions/ratio, statistics, probability, time** (Maths); **grammar,
structure, creativity, reflection** (English writing); **fair tests, conclusions, Earth in
space, electricity** (Science enquiry).

Each subject runs a full **Week 1–8** plan (fixed — no more "Week 2/4/6" gaps), and every
week is tagged with the exact development area it targets and the report score it grows from
(e.g. *"Targets: Statistics (was 3/7)"*).

---

## 6. Where progress is stored

Each child's scores and completed milestones are saved **in that browser's local storage**
on the device they use. Nothing is uploaded anywhere. The Parent view reads the same
device's storage, so for a shared home computer everyone sees the same saved progress.
(If the boys use different devices/browsers, their progress is separate — that's normal
for a no-server app. Ask if you'd like an online shared database instead.)

The Parent dashboard has a **"Reset progress"** button per child.

---

## 7. File structure

```
Yassine and Youssef dev/
├─ index.html            ← open this
├─ css/
│  └─ styles.css
└─ js/
   ├─ config.js          ← EDIT: usernames, passwords, dev areas + weekly plan
   ├─ lessons.js         ← the "Learn" explanations
   ├─ generators.js      ← the question-generating engine (fresh questions)
   └─ app.js             ← the app (login, weekly plan, quizzes, growth charts, stars)
```

To tweak content: edit `config.js` (development areas + weeks) and `lessons.js` (explanations).
No coding tools or build step required.

---

*Made for Youssef & Yassine's summer road to Grade 7. "Little by little, a little becomes a lot."*
