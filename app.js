(function () {
  "use strict";
  var P = window.PARTY;
  var $ = function (id) { return document.getElementById(id); };
  var qs = new URLSearchParams(location.search);
  var token = (qs.get("i") || "").trim().toLowerCase();
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var demo = !P.apiUrl || (isLocal && qs.get("demo") === "1");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var guest = null;
  var TEMAS = ["rojo", "amarillo", "cristal", "plata", "charmander", "pocket"];
  var tema = (qs.get("tema") || P.tema || "rojo").toLowerCase();
  if (TEMAS.indexOf(tema) > -1) document.documentElement.setAttribute("data-tema", tema);

  // ---------- helpers ----------
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function isPending(v) { return !v || /por confirmar/i.test(v); }

  // ---------- sprites (pixel art 100% en código) ----------
  var SPR = {
    cake: [
      "....1...1...1...", "....2...2...2...", "....0...0...0...", "..000000000000..",
      ".02222222222220.", ".02323232323230.", ".00000000000000.", ".01111111111110.",
      ".01211121112110.", ".01111111111110.", ".00000000000000.", ".02222222222220.",
      ".02222222222220.", ".00000000000000.", "..111111111111..", ".11111111111111."],
    cal: ["0.0..0.0", "00000000", "0......0", "0.0.0..0", "0......0", "0.0.0.00", "0......0", "00000000"],
    clock: ["..0000..", ".0....0.", "0..0...0", "0..0...0", "0..000.0", "0......0", ".0....0.", "..0000.."],
    pin: ["..0000..", ".000000.", ".00..00.", ".000000.", "..0000..", "...00...", "...00...", "....0..."],
    star: ["...00...", "...00...", "00000000", ".000000.", "..0000..", "..0..0..", ".0....0.", "0......0"],
    flag: ["0000....", "00000...", "000000..", "0000....", "0.......", "0.......", "0.......", "0......."],
    heart: [".00..00.", "00000000", "00000000", "00000000", ".000000.", "..0000..", "...00...", "........"],
    alien: ["..0.....0..", "...0...0...", "..0000000..", ".00.000.00.", "00000000000", "0.0000000.0", "0.0.....0.0", "...00.00..."],
    crown: ["0..00..0", "00.00.00", "00000000", "00000000", "00000000", "00000000", "........", "........"],
  };
  function sprite(name) {
    var rows = SPR[name], NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + rows[0].length + " " + rows.length);
    svg.setAttribute("class", "spr");
    svg.setAttribute("aria-hidden", "true");
    rows.forEach(function (row, y) {
      var x = 0;
      while (x < row.length) {
        var ch = row[x], start = x;
        while (x < row.length && row[x] === ch) x++;
        if (ch === ".") continue;
        var r = document.createElementNS(NS, "rect");
        r.setAttribute("x", start); r.setAttribute("y", y);
        r.setAttribute("width", x - start); r.setAttribute("height", 1);
        r.setAttribute("class", "c" + ch);
        svg.appendChild(r);
      }
    });
    return svg;
  }

  // ---------- API (Google Apps Script) ----------
  function apiGet(id) {
    if (demo) {
      var g = P.demoGuests[id], saved = null;
      try { saved = JSON.parse(localStorage.getItem("rsvp-demo-" + id)); } catch (e) {}
      return Promise.resolve(g ? { ok: true, nombre: g.nombre, max: g.max, honor: !!g.honor, respuesta: saved } : { ok: false });
    }
    // 1) POST (no depende de la redirección del GET); 2) si no responde ok, GET
    function viaGet() { return fetch(P.apiUrl + "?i=" + encodeURIComponent(id)).then(function (r) { return r.json(); }); }
    return fetch(P.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ accion: "get", id: id }) })
      .then(function (r) { return r.json(); })
      .then(function (g) { return g && g.ok ? g : viaGet(); })
      .catch(viaGet);
  }
  function apiPost(body) {
    if (demo) {
      try { localStorage.setItem("rsvp-demo-" + body.id, JSON.stringify({ asistencia: body.asistencia, acompanante: body.acompanante })); } catch (e) {}
      return Promise.resolve({ ok: true });
    }
    // text/plain evita el preflight CORS que Apps Script no soporta
    return fetch(P.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }

  // ---------- estáticos ----------
  function calendarUrl() {
    var s = new Date(P.fechaISO), e = new Date(s.getTime() + 5 * 3600 * 1000);
    var f = function (d) { return d.toISOString().replace(/[-:]|\.\d{3}/g, ""); };
    var loc = isPending(P.lugarNombre) ? "" : P.lugarNombre + ", " + P.lugarDireccion;
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
      encodeURIComponent("Cumpleaños " + P.edad + " de " + P.anfitrion) +
      "&dates=" + f(s) + "/" + f(e) + "&location=" + encodeURIComponent(loc);
  }

  function renderStatic() {
    $("cake").appendChild(sprite("cake"));
    var hearts = $("hud-hearts");
    for (var i = 0; i < 5; i++) hearts.appendChild(sprite("heart"));
    $("hud-date").textContent = P.fechaCorta;

    var quick = $("quick");
    [["cal", P.fechaCorta], ["clock", P.horaTexto], ["pin", P.lugarNombre]].forEach(function (q) {
      var li = el("li", {}, [sprite(q[0]), el("span", { text: q[1] })]);
      quick.appendChild(li);
    });

    var rows = [
      ["cal", "FECHA", P.fechaTexto],
      ["clock", "HORA", P.horaTexto],
      ["pin", "LUGAR", P.lugarNombre, P.lugarDireccion],
      ["star", "VESTIMENTA", P.vestimenta],
      ["flag", "CONFIRMA ANTES DEL", P.fechaLimite],
    ];
    var q = $("quest");
    rows.forEach(function (r) {
      var dd = el("dd", { text: r[2] });
      if (isPending(r[2])) dd.className = "pending";
      if (r[3] && !isPending(r[3])) dd.appendChild(el("small", { text: r[3] }));
      q.appendChild(el("div", {}, [sprite(r[0]), el("dt", { text: r[1] }), dd]));
    });

    var m = $("menu");
    function item(href, text, ext) {
      var a = el("a", { href: href, text: text });
      if (ext) { a.target = "_blank"; a.rel = "noopener"; }
      m.appendChild(el("li", {}, [a]));
    }
    if (P.lugarMapsUrl) item(P.lugarMapsUrl, "VER MAPA", true);
    item(calendarUrl(), "AGREGAR AL CALENDARIO", true);
    if (P.contactoWhatsApp) item("https://wa.me/" + P.contactoWhatsApp, "WHATSAPP", true);
  }

  // ---------- diálogo con efecto máquina de escribir ----------
  function speak(text) {
    var box = $("speech");
    box.textContent = "";
    var done = el("span"), rest = el("span", { class: "rest", text: text });
    box.appendChild(done); box.appendChild(rest);
    if (reduce) { done.textContent = text; rest.textContent = ""; return; }
    var i = 0, t;
    function finish() { clearInterval(t); done.textContent = text; rest.textContent = ""; }
    t = setInterval(function () {
      i++; done.textContent = text.slice(0, i); rest.textContent = text.slice(i);
      if (i >= text.length) clearInterval(t);
    }, 16);
    $("dialog").addEventListener("click", finish, { once: true });
  }

  // ---------- cuenta regresiva + XP ----------
  var timer;
  function tick() {
    var now = new Date(), end = new Date(P.fechaISO), start = new Date(P.inicioISO);
    var ms = end - now;
    var pct = Math.max(0, Math.min(1, (now - start) / (end - start)));
    $("xp-fill").style.transform = "scaleX(" + pct + ")";
    $("xp-txt").textContent = ms > 0 ? "CARGANDO… " + Math.floor(pct * 100) + "%" : "¡NIVEL 36!";
    if (ms <= 0) {
      $("count").replaceChildren(el("p", { class: "ask", text: "¡FIESTA EN CURSO!" }));
      return clearInterval(timer);
    }
    var s = Math.floor(ms / 1000), pad = function (n) { return String(n).padStart(2, "0"); };
    $("c-d").textContent = Math.floor(s / 86400);
    $("c-h").textContent = pad(Math.floor(s % 86400 / 3600));
    $("c-m").textContent = pad(Math.floor(s % 3600 / 60));
    $("c-s").textContent = pad(s % 60);
  }

  // ---------- RSVP ----------
  function partyList(plusOn) {
    var ul = el("ul", { class: "party" });
    ul.appendChild(el("li", { class: guest.honor ? "honor-slot" : "" }, [sprite(guest.honor ? "crown" : "alien"), el("span", { text: guest.nombre.toUpperCase() }), el("span", { class: "tag", text: guest.honor ? "INVITADO DE HONOR" : "JUGADOR 1" })]));
    if (guest.max > 1) {
      var li = el("li", { class: plusOn ? "" : "empty" }, [
        sprite("alien"),
        el("span", { text: plusOn ? "ACOMPAÑANTE" : "LUGAR LIBRE" }),
        el("span", { class: "tag", text: "+1" })]);
      ul.appendChild(li);
    }
    return ul;
  }

  function confetti(host) {
    if (reduce) return;
    for (var i = 0; i < 28; i++) {
      var c = el("span", { class: "conf", "aria-hidden": "true" });
      c.style.left = Math.random() * 100 + "%";
      c.style.animationDelay = Math.random() * 0.5 + "s";
      host.appendChild(c);
    }
    setTimeout(function () { host.querySelectorAll(".conf").forEach(function (n) { n.remove(); }); }, 2800);
  }

  function renderNoLink() {
    speak("¡Acabo de subir al nivel 36 y quiero celebrarlo en mi party! " + P.mensaje);
    $("rsvp-body").replaceChildren(
      el("p", { class: "note", text: "Para confirmar necesitas tu link personal de invitación. Si no lo tienes o no te funciona, escríbeme y te lo reenvío." })
    );
  }

  function renderStatus(r, celebrate) {
    var yes = r.asistencia === "si";
    var vip = !!guest.honor;
    var kids = [
      el("h3", { text: yes ? (vip ? "¡LOGRO DESBLOQUEADO!" : "¡NIVEL DESBLOQUEADO!") : "TE VOY A EXTRAÑAR" }),
      el("p", { text: yes ? (vip ? "Tu lugar de honor está confirmado" : "Tu lugar está confirmado") + (r.acompanante ? ", y el de tu acompañante también" : "") + ". Nos vemos el " + P.fechaTexto + "." : "Gracias por avisar. Te voy a extrañar." }),
    ];
    if (yes && vip) kids.unshift(el("span", { class: "badge", text: "★ INVITADO DE HONOR" }));
    var box = el("div", { class: "unlocked" + (yes ? "" : " no") + (vip ? " honor" : ""), role: "status" }, kids);
    var b = el("button", { class: "btn ghost", type: "button", text: "CAMBIAR RESPUESTA" });
    b.addEventListener("click", function () { renderForm(r); });
    box.appendChild(b);
    $("rsvp-body").replaceChildren(partyList(yes && r.acompanante), box);
    if (yes && celebrate) confetti(box);
  }

  function renderForm(prev) {
    var form = el("form", { novalidate: "" });
    form.appendChild(el("p", { class: "ask", text: "¿TE UNES A LA AVENTURA?" }));
    var fs = el("fieldset", { class: "choices" }, [el("legend", { class: "hidden", text: "¿Vienes a la fiesta?" })]);
    [["si", "¡CLARO, VOY!"], ["no", "NO PUEDO"]].forEach(function (o) {
      var inp = el("input", { type: "radio", name: "asistencia", value: o[0], required: "" });
      if (prev && prev.asistencia === o[0]) inp.checked = true;
      fs.appendChild(el("label", { class: "choice" }, [inp, el("span", { text: o[1] })]));
    });
    form.appendChild(fs);

    var plus = null, lab = null;
    if (guest.max > 1) {
      plus = el("input", { type: "checkbox", name: "acompanante" });
      if (prev && prev.acompanante) plus.checked = true;
      lab = el("label", { class: "check" }, [plus, el("span", { text: "Llevaré acompañante (+1)" })]);
      form.appendChild(lab);
    }
    var btn = el("button", { class: "btn", type: "submit", text: "▶ ENVIAR RESPUESTA" });
    var err = el("p", { class: "err hidden", role: "alert" });
    form.appendChild(btn); form.appendChild(err);

    var party = partyList(!!(plus && plus.checked));
    function sync() {
      var v = form.elements.asistencia.value;
      if (lab) lab.classList.toggle("hidden", v !== "si");
      var fresh = partyList(!!(plus && plus.checked && v === "si"));
      party.replaceWith(fresh); party = fresh;
    }
    form.addEventListener("change", sync);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = form.elements.asistencia.value;
      if (!v) { err.textContent = "Elige si vienes o no para continuar."; err.classList.remove("hidden"); return; }
      err.classList.add("hidden");
      btn.disabled = true; btn.textContent = "ENVIANDO…";
      var payload = { id: token, asistencia: v, acompanante: !!(plus && plus.checked && v === "si") };
      apiPost(payload).then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || "Error");
        renderStatus(payload, true);
      }).catch(function () {
        btn.disabled = false; btn.textContent = "▶ ENVIAR RESPUESTA";
        err.textContent = "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.";
        err.classList.remove("hidden");
      });
    });

    var body = $("rsvp-body");
    body.replaceChildren(party, form);
    sync();
    if (demo) body.appendChild(el("p", { class: "demo", text: "MODO DEMO: las respuestas solo se guardan en este navegador." }));
  }

  // La hoja guarda "Sí"/"No" con acento; la página trabaja con "si"/"no".
  function normalizeResp(r) {
    if (!r || !r.asistencia) return null;
    var a = String(r.asistencia).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    var plus = r.acompanante === true || String(r.acompanante).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "si";
    return { asistencia: a === "si" ? "si" : "no", acompanante: plus };
  }

  function applyHonor() {
    var rb = $("ribbon");
    rb.appendChild(sprite("crown"));
    rb.appendChild(el("span", { text: "INVITADO DE HONOR" }));
    rb.appendChild(sprite("crown"));
    rb.hidden = false;
    $("title-card").classList.add("honor");
    $("rsvp").classList.add("honor");
  }

  function init() {
    renderStatic(); tick(); timer = setInterval(tick, 1000);
    if (!token) return renderNoLink();
    $("rsvp-body").replaceChildren(el("p", { class: "note", text: "Buscando tu invitación…" }));
    apiGet(token).then(function (g) {
      if (!g || !g.ok) return renderNoLink();
      guest = g;
      if (g.honor) applyHonor();
      speak(g.honor
        ? "¡" + g.nombre + "! Estás en mi lista de invitados de honor. Acabo de subir al nivel 36 y no sería lo mismo sin ti. " + P.mensaje
        : "¡" + g.nombre + "! Acabo de subir al nivel 36 y te necesito en mi party. " + P.mensaje);
      var resp = normalizeResp(g.respuesta);
      if (resp) renderStatus(resp, false); else renderForm(null);
    }).catch(function () {
      speak("¡Acabo de subir al nivel 36 y quiero celebrarlo en mi party!");
      $("rsvp-body").replaceChildren(el("p", { class: "err", text: "No pudimos cargar tu invitación. Recarga la página." }));
    });
  }
  init();
})();
