// "Who echoes whom": a slide tour. Every claim opens the passages behind it,
// played from the catalog's transcription notes (the same synth as the archive).
const data = JSON.parse(document.getElementById("stats-data").textContent);
const el = (tag, text, cls, attrs) => {
  const e = document.createElement(tag);
  if (text != null) e.textContent = text;
  if (cls) e.className = cls;
  for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
  return e;
};
const fmt = n => n.toLocaleString("en-US");
const deck = document.getElementById("deck");
let portraits = {};
fetch("artist-portraits.json").then(r => r.json()).then(p => { portraits = p; document.querySelectorAll("[data-face]").forEach(paintFace); }).catch(() => {});

// ---- faces: portrait, else the album cover of a solo they play on, else initials
function faceSrc(name, solo) {
  if (portraits[name]?.image) return portraits[name].image;
  return solo?.c || null;
}
function paintFace(node) {
  const name = node.dataset.face, src = faceSrc(name, data.solos[node.dataset.solo]);
  node.textContent = "";
  if (src) { const img = el("img", null, null, { alt: "", loading: "lazy" }); img.src = src; img.onerror = () => { node.textContent = initials(name); }; node.append(img); }
  else node.textContent = initials(name);
}
const initials = n => n.split(/[ →]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("");
const face = (name, soloId, cls) => { const f = el("span", null, "face " + (cls || ""), { "data-face": name, "data-solo": soloId }); paintFace(f); return f; };

// ---- audio: the passages travel inside the page; played with the archive's triangle synth
let ctx = null, sources = [], playToken = 0;
function stop() { playToken++; for (const s of sources) { try { s.stop(); } catch {} } sources = []; document.querySelectorAll(".play.on").forEach(b => b.classList.remove("on")); }
function schedule(notes, at) {
  const first = notes[0][2];
  let end = at;
  for (const [, pitch, onset, dur] of notes) {
    const t = at + onset - first, d = Math.max(.07, Math.min(dur, .8));
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle"; o.frequency.value = 440 * Math.pow(2, (pitch - 69) / 12);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .018); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + .02);
    sources.push(o); end = Math.max(end, t + d);
  }
  return end;
}
async function play(btn, parts) {
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  await ctx.resume();
  const token = playToken;
  btn.classList.add("on");
  let t = ctx.currentTime + .1, end = t;
  for (const notes of parts) { end = schedule(notes, t) ; t = end + .9; }
  setTimeout(() => { if (token === playToken) stop(); }, (end - ctx.currentTime) * 1000 + 100);
}
// ---- scores: the archive's own notation (abcjs, bundled)
function abcPitch(midi, accidentals) {
  const steps = [["C", 0], ["D", -1], ["D", 0], ["E", -1], ["E", 0], ["F", 0], ["G", -1], ["G", 0], ["A", -1], ["A", 0], ["B", -1], ["B", 0]];
  const [letter, alter] = steps[((midi % 12) + 12) % 12], octave = Math.floor(midi / 12) - 1, key = letter + octave;
  const previous = accidentals.get(key) || 0, prefix = alter === previous ? "" : alter === -1 ? "_" : "=";
  accidentals.set(key, alter);
  return prefix + (octave >= 5 ? letter.toLowerCase() + "'".repeat(Math.max(0, octave - 5)) : letter + ",".repeat(Math.max(0, 4 - octave)));
}
function scoreAbc(notes) {
  const accidentals = new Map();
  const rates = notes.slice(1).map((n, i) => { const sec = n.onset - notes[i].onset, beats = n.beat - notes[i].beat; return sec > 1e-6 && beats > 0 ? beats / sec : null; }).filter(r => r !== null);
  const fallback = rates.length ? [...rates].sort((x, y) => x - y)[Math.floor(rates.length / 2)] : 2;
  const units = beats => Math.max(1, Math.min(32, Math.round(beats * 4)));
  const body = notes.map((note, i) => {
    const next = notes[i + 1], sec = next ? next.onset - note.onset : null, beats = next ? next.beat - note.beat : null;
    const rate = sec > 1e-6 && beats > 0 ? beats / sec : fallback, dur = Math.max(.0625, (note.duration || 0) * rate), len = units(dur);
    const out = `${abcPitch(note.pitch, accidentals)}${len === 1 ? "" : len}`;
    if (!next) return out;
    const rest = Math.round(Math.max(0, beats - dur) * 4);
    return rest > 0 ? `${out} z${Math.min(32, rest)}` : out;
  }).join(" ");
  const pitches = notes.map(n => n.pitch).sort((x, y) => x - y);
  return `X:1\nM:none\nL:1/16\nK:C clef=${pitches[Math.floor(pitches.length / 2)] < 57 ? "bass" : "treble"}\n${body}`;
}
let abcLoad;
const loadAbc = () => abcLoad ??= window.ABCJS ? Promise.resolve() : new Promise((ok, fail) => { const s = el("script"); s.src = "vendor/abcjs-basic-min.js"; s.onload = ok; s.onerror = () => { abcLoad = null; fail(); }; document.head.append(s); });
const clock = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

// ---- the pair panel
const toNotes = list => list.map(n => ({ pitch: n[0], onset: n[1], duration: n[2], beat: n[3] }));
function scorePanel(letter, solo, notes, sec, cls) {
  const sp = el("section", null, "score-panel " + cls);
  const head = el("div", null, "score-heading"), who = el("div");
  who.append(el("span", letter, "score-letter"), el("strong", `${solo.p} · ${solo.t}`));
  head.append(who, el("span", `${notes.length} notes`));
  const paper = el("div", null, "score-paper", { role: "img", "aria-label": `Staff notation for ${solo.p} playing ${solo.t}` });
  const scroll = el("div", null, "score-scroll", { role: "region", tabindex: "0" }); scroll.append(paper);
  const body = el("div", null, "score-body"); body.append(scroll);
  const foot = el("div", null, "score-footer");
  const play = el("button", null, "score-play", { type: "button", title: "Play MIDI transcription", "aria-label": `Play MIDI transcription for ${solo.p}, ${solo.t}` });
  play.append(el("span", "▶", null, { "aria-hidden": "true" }));
  play.onclick = () => togglePlay(play, notes);
  foot.append(el("span", String(solo.y)), play);
  sp.append(head, body, foot);
  const links = el("div", null, "listen-links");
  if (solo.v && sec != null) {
    const a = el("a", null, "youtube-link", { href: `https://www.youtube.com/watch?v=${solo.v}&t=${sec}s`, target: "_blank", rel: "noopener noreferrer" });
    a.append(el("span", "▶", "youtube-mark"), ` Play recording at ${clock(sec)} ↗`); links.append(a);
  } else links.append(el("span", "No matched video", "no-video"));
  sp.append(links);
  loadAbc().then(() => window.ABCJS.renderAbc(paper, scoreAbc(notes), { staffwidth: Math.max(520, notes.length * 43), scale: .9, paddingtop: 4, paddingbottom: 2, paddingleft: 2, paddingright: 2 }), () => { paper.textContent = "Score renderer unavailable"; });
  return sp;
}
function togglePlay(btn, notes) {
  const was = btn.classList.contains("on");
  stop();
  if (was) return;
  play(btn, [notes.map(n => [0, n.pitch, n.onset, n.duration])]);
}
function showPair(panel, item) {
  stop(); panel.textContent = "";
  const ev = item.ev, s = data.solos, A = s[ev.e], B = s[ev.l];
  const na = toNotes(ev.ne), nb = toNotes(ev.nl);
  const split = el("div", null, "pair-split");
  split.append(scorePanel("A", A, na, ev.ve, "a"), scorePanel("B", B, nb, ev.vl, "b"));
  const stats = el("div", null, "pair-stats");
  for (const [n, t] of [[ev.n, "paired notes"], [`${(ev.s * 100).toFixed(1)}%`, "similarity"]]) { const d = el("div"); d.append(el("strong", String(n)), el("span", t)); stats.append(d); }
  const open = el("a", "Open in the archive ↗", "open-archive", { href: "index.html?pair=" + ev.key });
  panel.append(split, stats, el("p", "Played from the transcription (MIDI), not the original audio.", "pair-foot"), open);
}

// ---- slides
function stage(slide, bigEl, claimEl) {
  const root = el("div", null, "stage");
  const note = el("p", null, "chip-note"), chips = el("div", null, "chips"), panel = el("div", null, "pair");
  const picker = el("div", null, "picker"), sides = [], toggle = el("button", null, "switch", { type: "button", role: "switch", "aria-checked": "false", "aria-label": "Switch musician" });
  toggle.append(el("span", null, "knob"));
  function pick(subject, i) {
    chips.querySelectorAll(".chip").forEach((c, j) => c.setAttribute("aria-pressed", j === i));
    showPair(panel, subject.items[i]);
  }
  function open(si) {
    const subject = slide.subjects[si];
    toggle.setAttribute("aria-checked", String(si === 1));
    sides.forEach((b, j) => b.setAttribute("aria-pressed", j === si));
    if (subject.big) { bigEl.textContent = subject.big; claimEl.textContent = subject.text; }
    note.textContent = subject.items[0]?.count ? `Number: their ${slide.id === "sources" ? "later" : "earlier"} solos that match ${subject.name}.` : ""; note.hidden = !note.textContent;
    chips.textContent = "";
    subject.items.forEach((it, i) => {
      const c = el("button", null, "chip", { type: "button", "aria-pressed": "false" });
      const who = data.solos[it.ev.l].p === it.name ? it.ev.l : it.ev.e;
      c.append(face(it.name, String(who)));
      const t = el("span", null, "chip-text"); t.append(el("strong", it.label), el("small", it.sub));
      c.append(t);
      if (it.count) { const b = el("b", fmt(it.count)); c.append(b); }
      c.onclick = () => pick(subject, i);
      chips.append(c);
    });
    if (subject.items.length) pick(subject, 0); else { panel.textContent = ""; panel.append(el("p", "No passages here.", "pair-foot")); }
  }
  if (slide.subjects.length > 1) {
    slide.subjects.forEach((s, i) => {
      const b = el("button", null, "side-pick", { type: "button", "aria-pressed": "false" });
      b.append(face(s.name, String(s.items[0].ev.e), "big"), el("strong", s.name));
      b.onclick = () => open(i);
      sides.push(b);
    });
    toggle.onclick = () => open(toggle.getAttribute("aria-checked") === "true" ? 0 : 1);
    picker.append(sides[0], toggle, sides[1]);
  }
  root.append(note, chips, panel);
  return { root, picker, start: () => open(0) };
}
function ranking(r) {
  const d = el("details", null, "ranking"); d.append(el("summary", "See the ranking"));
  const max = Math.max(...r.rows.map(x => x.value)), ol = el("ol", null, "bars");
  for (const row of r.rows) {
    const li = el("li"), n = el("span", row.name); n.append(el("small", row.sub));
    const tr = el("span", null, "track"), f = el("span", null, "fill"); f.style.width = (100 * row.value / max) + "%"; tr.append(f);
    li.append(n, tr, el("b", row.label)); ol.append(li);
  }
  d.append(el("p", r.title, "rank-title"), el("p", r.explain, "rank-note"), ol, el("p", "Only musicians with 8+ solos are ranked.", "rank-note"));
  return d;
}
const slides = [];
function add(node, id, bg) { node.id = id; node.style.setProperty("--bg", bg); node.setAttribute("role", "group"); deck.append(node); slides.push(node); }

const intro = el("section", null, "slide intro");
const sc = data.scope;
intro.append(el("div", null, "copy"));
intro.firstChild.append(el("p", "A listening tour · WJazzD + JTD", "small-caps"),
  Object.assign(el("h1", "Who echoes "), { }), el("p", `We searched ${fmt(1558)} transcribed jazz solos for the same phrase turning up in different recordings. So whose phrases travel furthest?`, "deck-text"));
intro.querySelector("h1").append(el("em", "whom"));
const facts = el("div", null, "facts");
for (const [n, t] of [[fmt(sc.solo_pairs), "substantial solo-pair matches"], [sc.musicians, "musicians"], [sc.median_lag + " yrs", "median gap, source to echo"]]) { const d = el("div"); d.append(el("strong", n), el("span", t)); facts.append(d); }
const begin = el("button", "Start the tour →", "begin", { type: "button" }); begin.onclick = () => go(1);
const about = el("aside", null, "about");
const li = (...parts) => { const l = el("li"); for (const p of parts) l.append(p); return l; };
const link = (t, href) => el("a", t, null, { href, target: href.startsWith("http") ? "_blank" : null, rel: "noopener" });
const list = el("ul");
list.append(
  li("111 musicians (1925–2015): 456 horn solos from the ", link("Weimar Jazz Database", "https://jazzomat.hfm-weimar.de/download/download.html"), " and 1,102 piano-trio solos from the ", link("Jazz Trio Database", "https://github.com/HuwCheston/Jazz-Trio-Database"), "."));
const code = el("p", null, "about-links");
code.append(link("Code for this analysis ↗", "https://github.com/dsleo/jazz-footprints/blob/main/jazzmine/quotation_stats.py"));
about.append(list, code);
intro.firstChild.insertBefore(about, intro.firstChild.querySelector(".deck-text").nextSibling);
intro.firstChild.append(facts);
const cta = el("div", null, "cta"); cta.append(begin);
intro.append(cta);
add(intro, "intro", "20% 40%");

const starts = [];
data.slides.forEach((s, i) => {
  const sec = el("section", null, "slide");
  const copy = el("div", null, "copy"), bigEl = el("div", s.big, "big"), claimEl = el("p", s.text, "claim"), st = stage(s, bigEl, claimEl);
  copy.append(el("p", s.kicker, "small-caps"), bigEl, claimEl);
  if (s.subjects.length > 1) copy.append(st.picker);
  if (s.ranking) copy.append(ranking(s.ranking));
  sec.append(copy, st.root);
  add(sec, s.id, `${(i * 17) % 100}% ${30 + (i * 13) % 40}%`);
  starts.push(st.start);
});



// ---- navigation
const dots = document.getElementById("dots"), count = document.getElementById("count");
slides.forEach((s, i) => { const b = el("button", null, null, { type: "button", "aria-label": `Slide ${i + 1}` }); b.onclick = () => go(i); dots.append(b); });
let index = 0;
function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); deck.scrollTo({ left: i * deck.clientWidth, behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" }); }
function sync() {
  const i = Math.round(deck.scrollLeft / deck.clientWidth);
  if (i === index && count.textContent) return;
  if (i !== index) stop();
  index = i;
  count.textContent = `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  dots.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-current", j === i));
  document.getElementById("prev").disabled = i === 0; document.getElementById("next").disabled = i === slides.length - 1;
  history.replaceState(null, "", "#" + slides[i].id);
}
deck.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
document.getElementById("prev").onclick = () => go(index - 1);
document.getElementById("next").onclick = () => go(index + 1);
addEventListener("keydown", e => { if (e.target.closest("input,textarea")) return; if (e.key === "ArrowRight") go(index + 1); if (e.key === "ArrowLeft") go(index - 1); });
addEventListener("resize", () => go(index));
starts.forEach(f => f());
const start = slides.findIndex(s => "#" + s.id === location.hash);
if (start > 0) deck.scrollTo({ left: start * deck.clientWidth, behavior: "auto" });
sync();
