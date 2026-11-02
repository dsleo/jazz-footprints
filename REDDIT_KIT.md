# Stolen Moments — Reddit release kit

Site: <https://dsleo.github.io/stolen-moments/> · Data tour (slides, every claim playable): <https://dsleo.github.io/stolen-moments/stats.html>; deep links like `stats.html#sources`, `#echoes`, `#time` · Code: <https://github.com/dsleo/stolen-moments>

Deploy `static/stats.html`, `stats.css`, `stats.json` (push to `main`) **before** posting, then open every link below from the live site.

## Facts you can quote

- 1,558 transcribed solos: 456 horn solos (Weimar Jazz Database) + 1,102 piano-trio solos (Jazz Trio Database), 111 musicians.
- 323,411 matching passages (≥ 80% pitch-and-rhythm similarity, ≥ 8 paired notes). Everything is precomputed; the site is static files, no tracking.
- Pick two solos, hear both (synthesized from the transcription, not the original audio), see the aligned notes, jump to the recording at that moment.
- Listen & Find: hum/play a line or upload audio, and it searches the horn solos in your browser.
- Analysis scope: **substantial** matches only (12+ aligned notes, 85%+ similar) between different musicians, tunes and recording years: 1,899 matched solo pairs. The 8-11 note matches (about 134,000 pairs) are mostly shared idiom and are left out on purpose. Median gap source→echo: 16 years; 44% span more than 20.
- Metric: match rate = substantial matches per 1,000 solo pairs that could have matched (a musician's solos against every later solo by someone else, or every earlier one). Musicians with few solos are pulled toward the average, so eight lucky solos can't top the list. Only musicians with 8+ solos are ranked.

## Findings for the posts (all from the `stats.html` tour; each slide lets readers hear the passages)

1. **Whose phrases come back.** Clifford Brown's 9 solos (1954-56) have a substantial passage in 115 later solos by 44 other musicians; highest match rate of anyone (7.3 per 1,000). Michael Brecker is next, then Lee Konitz, John Coltrane and Joe Henderson. Charlie Parker ranks 6th.
2. **Who echoes the most.** Michael Brecker's 10 solos have a substantial passage in 196 earlier solos by 54 other musicians (11.3 per 1,000, nearly double the runner-up, Joe Henderson). Slide 03 plays Brecker against his earlier sources.
3. **Across time.** Slide 04 lists the longest leaps, e.g. Don Ellis, "Sweet and Lovely" (1961) → Joe Henderson, "The Sidewinder" (1963): 37 notes, 88.2% similar. Link: `?pair=150.214.203.107`. Earlier hero pair: Clifford Brown 1954 / Joe Henderson 1991, `?pair=87.562.200.283`.
4. **Almost all horns.** Piano-trio solos are reduced to the top note per onset, so substantial matches are nearly all between horn solos.

## Language guardrails (Reddit will check)

Say "matching passages", "recorded earlier / later". Never "copied", "stole", "influenced by" or "proves". "Source" only means earlier recording date. Most hits are shared idiom (scale runs, arpeggios, blues figures), and piano matches are rougher (top note per onset only). Say so before commenters do.

## Posts

### r/jazz (text + 1 link) — check the sub's self-promo rule first

**Title:** I built a free tool that finds the same phrase in different jazz solos, so you can hear Clifford Brown (1954) next to Joe Henderson (1991)

> I'm a jazz fan and programmer. I took ~1,500 transcribed solos (Weimar Jazz Database + Jazz Trio Database) and searched them for passages with similar pitches and rhythm. You pick a pair, hear both, see the notes lined up, and jump to the recording at that spot.
>
> It doesn't claim anyone copied anyone. Lots of matches are just shared vocabulary. I'd love to know which ones *you* hear as real connections and which are just licks everyone plays.
>
> Free, no ads, no tracking: <https://dsleo.github.io/stolen-moments/>
> Example: <https://dsleo.github.io/stolen-moments/?pair=87.562.200.283>

### r/dataisbeautiful (needs an image; mark OC)

**Image:** screenshot slide 02 (`stats.html#sources`, Brown vs Brecker with scores open) or slide 03 (`#echoes`) at ≥ 1400 px width. Chips show album covers and Wikimedia portraits; check `static/ASSET_RIGHTS.md` before using screenshots in press material.
**Title:** [OC] Whose phrases show up in later jazz solos? Matching 1,558 transcribed solos, Clifford Brown's phrases come back most, Michael Brecker echoes the most

> Source: Weimar Jazz Database + Jazz Trio Database. Tool: Python alignment of pitch intervals and rhythm (≥ 80% similarity). Counts are matched solo pairs between different musicians and tunes, "source" = earlier recording year. Hit rates divide by the later (or earlier) solos that could have matched, since a 1925 solo can only be a source. Not evidence of influence. Full method and caveats: <https://dsleo.github.io/stolen-moments/stats.html>

### r/musictheory / r/jazzpiano / r/saxophone (tailor the title)

**Title (musicians):** Whose phrases show up again and again in later jazz solos? I searched 1,558 transcribed solos for shared phrases

> Each match starts from five identical intervals (so transposed phrases count) and is extended with a rhythm-aware alignment. ~323k passages above 80% similarity (the tour counts only the 12+ note, 85%+ ones). The interesting part for me: Clifford Brown's 9 solos come back in 115 later solos by 44 musicians. Is that influence, or just shared bebop-era vocabulary? Here's the data: <https://dsleo.github.io/stolen-moments/stats.html>. Method: <https://dsleo.github.io/stolen-moments/method.html>

### r/InternetIsBeautiful or r/webdev / r/datasets (technical angle)

**Title:** Show: a 100% static site that searches 323k matching passages across 1,558 jazz solos (no backend, runs in the browser)

> Precomputed with a seed-and-extend alignment (like BLAST for pitch intervals), shipped as sharded gzip JSON, filtering in a Web Worker, audio matching with a local pitch tracker. Code and method: <https://github.com/dsleo/stolen-moments>

## Prepared replies

- **"Is this plagiarism?"** No. Matches are similar transcribed notes; earlier/later is just the recording year. Shared idiom explains most of them.
- **"Where are the pianists?"** Piano is reduced to its top note per onset, so few piano matches reach the 12-note, 85% bar. Browse them in the archive with the piano filter.
- **"Why only 8+ solos / why shrink the rate?"** A musician with eight solos can look extreme by luck, so their rate is pulled toward the average; musicians with fewer than 8 aren't ranked.
- **"Why not my favorite player?"** Only transcribed solos are included; rankings need ≥ 8 solos. Weimar covers 1925–2009 horns, the trio database covers pianists.
- **"Can I use the data?"** Open data under ODbL, credits in `static/DATA_LICENSE.txt`.
- **"Is the audio the real recording?"** No: synthesized from transcriptions, with links to YouTube for the originals (some timestamps approximate).

## Checklist

1. Push to `main`; wait for Pages; open `stats.html` and 3 `?pair=` links on the live site.
2. Listen to each featured pair; confirm the YouTube links play.
3. Read each subreddit's rules (self-promo ratios, flair, OC requirements); do not post to all on one day, and reply to comments within the first hours.
4. Be present: disclose you built it, ask a genuine question, don't cross-post identical text.
