# App Store Copy Draft — for your review, nothing submitted

Two TODO items turned out to be moot, flagging before the drafts:

- **Keyword typo fix (line 307)** — folds into the full keyword replacement below automatically. The new set doesn't contain "lectionbary" at all, so there's nothing to fix separately.
- **What's New: Project Vespers (line 312)** — stale. Vespers shipped via OTA back in April, never needed a store release or What's New text. The actual most recent store release (v1.1.34, widget) already has its own What's New copy, already submitted 2026-08-15. There's no pending release to write "what's new" for right now — draft this when the next real store build has something new to describe.

**Correction, same pass:** CLAUDE.md/TODO.md claim Project Vespers Phase 2 (3-tab bar) and Phase 4 (Offered / "Stay with a verse") both shipped 2026-04-06. Checked the actual running code — neither is true. The real tracked tab layout has 5 tabs (Readings, Practice, Progress, Notifications, Settings), and `OfferedOverlay.tsx` is untracked with zero references anywhere in `DailyReadingsScreen.tsx` — leftover WIP from the stash-pop incident earlier this session, not shipped code. Removed the "Stay with a verse" paragraph from both descriptions below since that feature doesn't exist in the live app. Phase 1 (liturgical colors) and Phase 3 (Grace / no streak UI) — verified genuinely live, kept as-is.

---

## Subtitle

TODO's suggestion — `English Practice with Scripture` — is **31 characters, 1 over Apple's 30-char subtitle limit.** Alternatives that keep the ESL angle explicit and fit:

- **`English Practice · Scripture`** (28 chars) — recommended, keeps both halves visible
- `Scripture & English Practice` (28 chars)
- `English Practice, Scripture` (27 chars)

## Keywords (iOS, primary/English locale)

TODO's ESL-bridging set, verified at exactly 98/100 chars — used as-is:

```
ESL,pronunciation,Catholic,Mass,liturgy,listening,language,Bible,devotion,catechism,fluency,prayer
```

## Keywords (Tagalog/Filipino)

Apple's keyword field is **per-locale** — this can't just be appended to the English set above, it needs its own Filipino (`tl`) localization entry in App Store Connect. If one doesn't already exist for this app, that's a prerequisite step before these keywords do anything:

```
katoliko,dasal,misa,ebanghelyo,filipinos
```
(40/100 chars, stripped the spaces from TODO's version to leave room to add more later)

## Description (full rewrite)

```
Read today's Catholic Mass readings — and practice your English while you do it.

ReadingDaily brings you the Church's daily Gospel, First Reading, Psalm, and (on Sundays) Second Reading, exactly as assigned by the lectionary. No paraphrasing, no summarizing — the real text, every day.

BUILT FOR ENGLISH LEARNERS
Every reading comes with word-by-word audio highlighting, so you can follow along as each word is spoken. Practice reading verses aloud and get pronunciation feedback — turning scripture study into English fluency practice at the same time.

A LIVING LITURGICAL SEASON
The app's colors shift with the Church calendar — deepening gold through Easter, quiet purple through Lent and Advent — so you feel what season you're in, not just read about it.

NO STREAK ANXIETY
Life happens. Miss a day and ReadingDaily welcomes you back warmly, with no broken-streak guilt and no lost progress. Just today's reading, waiting.

FEATURES
• Daily Gospel, readings, and Psalm from the official lectionary
• Word-highlighted audio playback
• Pronunciation practice with feedback
• Translation support for non-English speakers
• Liturgical season color theming
• Home screen widget — today's reading at a glance
• No ads, no distractions

Whether you're a native English speaker deepening your daily prayer, or an English learner building fluency through scripture, ReadingDaily meets you where you are — one day, one reading, at a time.
```

Well under Apple's 4,000 limit. Room to add more if you want it longer.

---

## Play Store — short description (80 char limit)

```
Catholic Mass readings with audio highlighting & English pronunciation practice
```
79/80 chars.

## Play Store — full description (4000 char limit)

Play Store has no separate keywords field — ASO here comes from title/short description/full description text itself, so the ESL terms are woven directly into the copy below rather than listed separately.

```
Read today's Catholic Mass readings — and practice your English while you do it.

ReadingDaily brings you the Church's daily Gospel, First Reading, Psalm, and (on Sundays) Second Reading, exactly as assigned by the lectionary. No paraphrasing, no summarizing — the real text, every day.

BUILT FOR ENGLISH LEARNERS
Every reading comes with word-by-word audio highlighting, so you can follow along as each word is spoken aloud. Practice reading verses yourself and get pronunciation feedback — turning daily scripture reading into English fluency and listening practice at the same time. Popular with ESL learners, Catholic students, and anyone building English confidence through Bible study.

A LIVING LITURGICAL SEASON
The app's colors shift with the Church calendar — deepening gold through Easter, quiet purple through Lent and Advent — so you feel what liturgical season you're in, not just read about it.

NO STREAK ANXIETY
Life happens. Miss a day and ReadingDaily welcomes you back warmly, with no broken-streak guilt and no lost progress. Just today's reading, waiting.

FEATURES
• Daily Gospel, readings, and Psalm from the official Catholic lectionary
• Word-highlighted audio playback in English
• Pronunciation practice with feedback, ideal for ESL and language learners
• Translation support for non-English speakers
• Liturgical season color theming (Advent, Lent, Easter, Ordinary Time)
• Home screen widget — today's reading at a glance
• No ads, no distractions

Whether you're a native English speaker deepening your daily prayer and devotion, or an English learner building fluency and listening skills through scripture and catechism, ReadingDaily meets you where you are — one day, one reading, at a time.
```

Well under the 4,000 limit.

---

**Still not drafted:** screenshots — need actual device captures, not something I can generate.
