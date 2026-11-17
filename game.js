(function () {
  const C = window.FWC_CONFIG;
  const $ = (id) => document.getElementById(id);
  const screens = { start: $("screen-start"), play: $("screen-play"), result: $("screen-result") };

  let deck = [], deckPos = 0, cur = null, flipped = false;
  let score = 0, correct = 0, wrong = 0, streak = 0, fishPos = 0, finishes = 0;
  let endAt = 0, raf = 0, playing = false, locked = false, log = [], nick = "";

  const show = (name) => { Object.values(screens).forEach((s) => s.classList.remove("active")); screens[name].classList.add("active"); window.scrollTo(0, 0); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function nextQuestion() {
    if (deckPos >= deck.length) { deck = shuffle(window.QUESTION_BANK.slice()); deckPos = 0; }
    cur = deck[deckPos++];
    flipped = Math.random() < 0.5; // randomise which side shows the right answer
    const left = flipped ? cur.B : cur.A, right = flipped ? cur.A : cur.B;
    $("ask").textContent = cur.ask;
    $("txt-a").textContent = left;
    $("txt-b").textContent = right;
    locked = false;
  }

  function startGame() {
    nick = $("nick").value.trim().replace(/\s+/g, " ").slice(0, 12) || "Anonymous Fish";
    try { localStorage.setItem("fwcNick", nick); } catch (e) {}
    deck = shuffle(window.QUESTION_BANK.slice()); deckPos = 0;
    score = correct = wrong = streak = finishes = 0; fishPos = 0; log = [];
    $("score").textContent = "0"; $("feedback").className = "feedback"; $("feedback").innerHTML = "";
    setFish(0, false);
    nextQuestion();
    show("play");
    playing = true;
    endAt = performance.now() + C.ROUND_SECONDS * 1000;
    raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!playing) return;
    const left = Math.max(0, endAt - now);
    $("timer-bar").style.width = (left / (C.ROUND_SECONDS * 1000)) * 100 + "%";
    $("timer-text").textContent = Math.ceil(left / 1000);
    document.querySelector(".timer").classList.toggle("low", left < 8000);
    if (left <= 0) return endGame();
    raf = requestAnimationFrame(tick);
  }

  function setFish(pct, back) {
    const f = $("fish");
    f.classList.toggle("back", !!back);
    const max = $("river").clientWidth - f.clientWidth - 8;
    f.style.left = Math.max(2, (pct / 100) * max) + "px";
  }

  function pop(text, color) {
    const p = $("pop"); p.textContent = text; p.style.color = color || "#fff";
    p.classList.remove("show"); void p.offsetWidth; p.classList.add("show");
  }

  function answer(side) { // side = which button the player pressed: "A" (left) or "B" (right)
    if (!playing || locked) return;
    locked = true;
    const picked = flipped ? (side === "A" ? "B" : "A") : side; // map back to the question's own A/B
    const ok = picked === cur.correct;
    let delta;
    if (ok) {
      correct++; streak++;
      delta = C.POINTS_CORRECT + C.STREAK_BONUS * Math.min(streak - 1, 5);
      fishPos += C.FISH_STEP;
      if (fishPos >= 100) { delta += C.FINISH_BONUS; finishes++; fishPos = 0; leap(); pop("Upstream! +" + delta, "#ffe066"); }
      else pop("+" + delta, "#c8ffd9");
      setFish(fishPos, false);
    } else {
      wrong++; streak = 0; delta = C.POINTS_WRONG;
      fishPos = Math.max(0, fishPos - C.FISH_SLIP);
      setFish(fishPos, true);
      pop(String(delta), "#ffc9c9");
    }
    score = Math.max(0, score + delta);
    $("score").textContent = score;
    log.push({ q: cur, ok, picked });
    showFeedback(ok, delta);
    setTimeout(nextQuestion, ok ? 250 : 450);
  }

  function leap() { const f = $("fish"); f.classList.remove("leap"); void f.offsetWidth; f.classList.add("leap"); }

  function showFeedback(ok, delta) {
    const q = cur, fb = $("feedback");
    const verdict = ok ? '<b class="g">Correct! ' + (delta > 0 ? "+" : "") + delta + "</b>" : '<b class="r">Not quite, ' + delta + "</b>";
    fb.className = "feedback " + (ok ? "good" : "bad");
    fb.innerHTML = verdict + " &middot; A: <b>" + esc(q.valA) + "</b> vs B: <b>" + esc(q.valB) + "</b><br>" + esc(q.why);
  }

  /* ---------- Leaderboard ---------- */
  const LS_KEY = "fwcFishScores";
  const shared = () => (C.SHARED_DB_URL || "").replace(/\/+$/, "");
  const localScores = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; } };
  const saveLocal = (e) => { try { const a = localScores(); a.push(e); a.sort((x, y) => y.score - x.score); localStorage.setItem(LS_KEY, JSON.stringify(a.slice(0, 50))); } catch (err) {} };

  async function getBoard() {
    if (shared()) {
      try {
        const r = await fetch(shared() + '/scores.json?orderBy="score"&limitToLast=10');
        if (r.ok) {
          const o = (await r.json()) || {};
          return { shared: true, rows: Object.values(o).sort((a, b) => b.score - a.score).slice(0, 10) };
        }
      } catch (e) {}
    }
    return { shared: false, rows: localScores().slice(0, 10), fallback: !!shared() };
  }

  async function submitScore(entry) {
    saveLocal(entry);
    if (shared()) { try { await fetch(shared() + "/scores.json", { method: "POST", body: JSON.stringify(entry) }); } catch (e) {} }
  }

  async function renderBoard(listId, modeId, mine) {
    const b = await getBoard();
    $(modeId).textContent = b.shared ? "Top 10 across all players" : (b.fallback ? "Couldn't reach the shared board. Showing this device only." : "Top 10 on this device");
    const el = $(listId);
    if (!b.rows.length) { el.innerHTML = '<li class="empty">No scores yet. Be the first!</li>'; return; }
    let marked = false;
    el.innerHTML = b.rows.map((r, i) => {
      const isMe = mine && !marked && r.name === mine.name && r.score === mine.score && r.t === mine.t;
      if (isMe) marked = true;
      return '<li class="' + (isMe ? "me" : "") + '"><span class="pos">' + (i + 1) + '</span><span class="nm">' + esc(r.name) + '</span><span class="sc">' + r.score + "</span></li>";
    }).join("");
  }

  async function endGame() {
    playing = false; cancelAnimationFrame(raf);
    const entry = { name: nick, score, correct, wrong, t: Date.now() };
    $("final-score").textContent = score;
    $("final-detail").textContent = correct + " right · " + wrong + " wrong" + (finishes ? " · reached the top " + finishes + "×" : "");
    $("final-rank").textContent = "";
    $("review").innerHTML = log.length ? log.map((l) => {
      const q = l.q;
      return '<div class="rev"><span class="mark ' + (l.ok ? "ok" : "no") + '">' + (l.ok ? "✓" : "✗") + "</span><b>" + esc(q.ask) + "</b><br>A: " + esc(q.A) + " (" + esc(q.valA) + ")<br>B: " + esc(q.B) + " (" + esc(q.valB) + ")<br><i>" + esc(q.why) + "</i></div>";
    }).join("") : '<div class="empty">You didn\'t answer any. Next time, go fast!</div>';
    show("result");
    await submitScore(entry);
    await renderBoard("lb-result", "lb-mode-result", entry);
    const b = await getBoard();
    const pos = b.rows.findIndex((r) => r.t === entry.t && r.name === entry.name);
    if (pos >= 0) $("final-rank").textContent = pos === 0 ? "🏆 You're #1!" : "You're #" + (pos + 1) + " on the board!";
  }

  /* ---------- Wiring ---------- */
  $("btn-go").addEventListener("click", startGame);
  $("nick").addEventListener("keydown", (e) => { if (e.key === "Enter") startGame(); });
  $("btn-again").addEventListener("click", () => { show("start"); renderBoard("lb-start", "lb-mode-start"); });
  $("btn-a").addEventListener("click", () => answer("A"));
  $("btn-b").addEventListener("click", () => answer("B"));
  document.addEventListener("keydown", (e) => {
    if (!playing) return;
    const k = e.key.toLowerCase();
    if (k === "a" || k === "arrowleft") answer("A");
    else if (k === "b" || k === "arrowright") answer("B");
  });
  window.addEventListener("resize", () => playing && setFish(fishPos, false));

  try { $("nick").value = localStorage.getItem("fwcNick") || ""; } catch (e) {}
  renderBoard("lb-start", "lb-mode-start");
})();
