(function () {
  "use strict";
  var P = window.PARTY;
  var $ = function (id) { return document.getElementById(id); };
  var token = (new URLSearchParams(location.search).get("i") || "").trim().toLowerCase();
  var demo = !P.apiUrl;
  var guest = null;

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

  // ---------- API (Google Apps Script) ----------
  function apiGet(id) {
    if (demo) {
      var g = P.demoGuests[id];
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem("rsvp-demo-" + id)); } catch (e) {}
      return Promise.resolve(g ? { ok: true, nombre: g.nombre, max: g.max, respuesta: saved } : { ok: false });
    }
    return fetch(P.apiUrl + "?i=" + encodeURIComponent(id)).then(function (r) { return r.json(); });
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

  // ---------- static content ----------
  function renderInfo() {
    $("msg").textContent = P.mensaje;
    var rows = [
      ["FECHA", P.fechaTexto],
      ["HORA", P.horaTexto],
      ["LUGAR", P.lugarNombre + (isPending(P.lugarNombre) ? "" : " · " + P.lugarDireccion)],
      ["VESTIMENTA", P.vestimenta],
      ["CONFIRMAR ANTES DE", P.fechaLimite],
    ];
    var dl = $("info");
    rows.forEach(function (r) {
      var dd = el("dd", { text: r[1] });
      if (isPending(r[1])) dd.className = "pending";
      dl.appendChild(el("div", {}, [el("dt", { text: r[0] }), dd]));
    });
    var a = $("actions");
    if (P.lugarMapsUrl) a.appendChild(el("a", { class: "btn alt", href: P.lugarMapsUrl, target: "_blank", rel: "noopener", text: "VER MAPA" }));
    if (P.contactoWhatsApp) a.appendChild(el("a", { class: "btn ghost", href: "https://wa.me/" + P.contactoWhatsApp, target: "_blank", rel: "noopener", text: "WHATSAPP" }));
    a.appendChild(el("a", { class: "btn ghost", href: calendarUrl(), target: "_blank", rel: "noopener", text: "+ CALENDARIO" }));
  }

  function calendarUrl() {
    var s = new Date(P.fechaISO), e = new Date(s.getTime() + 5 * 3600 * 1000);
    var f = function (d) { return d.toISOString().replace(/[-:]|\.\d{3}/g, ""); };
    var loc = isPending(P.lugarNombre) ? "" : P.lugarNombre + ", " + P.lugarDireccion;
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
      encodeURIComponent("Cumpleaños " + P.edad + " de " + P.anfitrion) +
      "&dates=" + f(s) + "/" + f(e) + "&location=" + encodeURIComponent(loc);
  }

  // ---------- countdown ----------
  function tick() {
    var ms = new Date(P.fechaISO) - new Date();
    if (ms <= 0) {
      $("count").replaceChildren(el("p", { class: "tag", text: "¡EL JUEGO YA COMENZÓ! 🎉" }));
      return clearInterval(timer);
    }
    var s = Math.floor(ms / 1000);
    var pad = function (n) { return String(n).padStart(2, "0"); };
    $("c-d").textContent = Math.floor(s / 86400);
    $("c-h").textContent = pad(Math.floor(s % 86400 / 3600));
    $("c-m").textContent = pad(Math.floor(s % 3600 / 60));
    $("c-s").textContent = pad(s % 60);
  }
  var timer = setInterval(tick, 1000);

  // ---------- RSVP ----------
  function renderNoLink() {
    $("greeting").textContent = "¡Estás invitado al nivel 36!";
    $("rsvp-body").replaceChildren(
      el("p", { class: "note", text: "Para confirmar necesitas tu link personal de invitación. Si no lo tienes o no te funciona, escríbeme y te lo reenvío." })
    );
  }

  function renderStatus(r) {
    var yes = r.asistencia === "si";
    var txt = yes
      ? "✔ ¡Confirmado! Te esperamos" + (r.acompanante ? " a ti y a tu acompañante." : ".")
      : "✖ Registramos que no podrás asistir. ¡Gracias por avisar!";
    var wrap = el("div", {}, [
      el("p", { class: "status" + (yes ? "" : " no"), role: "status", text: txt }),
      el("p", { class: "note", text: "¿Cambió algo? Puedes actualizar tu respuesta." }),
    ]);
    var b = el("button", { class: "btn ghost", type: "button", text: "CAMBIAR RESPUESTA" });
    b.addEventListener("click", function () { renderForm(r); });
    wrap.appendChild(b);
    $("rsvp-body").replaceChildren(wrap);
  }

  function renderForm(prev) {
    var form = el("form", { novalidate: "" });
    var fs = el("fieldset", { class: "choices" }, [el("legend", { text: "¿Vienes a la fiesta?" })]);
    [["si", "yes", "¡SÍ VOY!"], ["no", "no", "NO PUEDO"]].forEach(function (o) {
      var inp = el("input", { type: "radio", name: "asistencia", value: o[0], required: "" });
      if (prev && prev.asistencia === o[0]) inp.checked = true;
      fs.appendChild(el("label", {}, [inp, el("span", { class: "opt " + o[1], text: o[2] })]));
    });
    form.appendChild(fs);

    var plus = null, lab = null;
    if (guest.max > 1) {
      plus = el("input", { type: "checkbox", name: "acompanante" });
      if (prev && prev.acompanante) plus.checked = true;
      lab = el("label", { class: "check" }, [plus, el("span", { text: "Llevaré acompañante (+1)" })]);
      form.appendChild(lab);
    }
    var btn = el("button", { class: "btn", type: "submit", text: "ENVIAR RESPUESTA" });
    var err = el("p", { class: "status err hidden", role: "alert" });
    form.appendChild(btn); form.appendChild(err);

    function sync() {
      var v = form.elements.asistencia.value;
      if (lab) lab.classList.toggle("hidden", v !== "si");
    }
    form.addEventListener("change", sync);
    sync();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = form.elements.asistencia.value;
      if (!v) { err.textContent = "Elige si vienes o no."; err.classList.remove("hidden"); return; }
      err.classList.add("hidden");
      btn.disabled = true; btn.textContent = "ENVIANDO…";
      var payload = { id: token, asistencia: v, acompanante: !!(plus && plus.checked && v === "si") };
      apiPost(payload).then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || "Error");
        renderStatus(payload);
      }).catch(function () {
        btn.disabled = false; btn.textContent = "ENVIAR RESPUESTA";
        err.textContent = "No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.";
        err.classList.remove("hidden");
      });
    });

    var body = $("rsvp-body");
    body.replaceChildren(form);
    if (demo) body.appendChild(el("p", { class: "demo", text: "MODO DEMO: las respuestas solo se guardan en este navegador." }));
  }

  function init() {
    renderInfo(); tick();
    if (!token) return renderNoLink();
    $("rsvp-body").replaceChildren(el("p", { class: "note", text: "Buscando tu invitación…" }));
    apiGet(token).then(function (g) {
      if (!g || !g.ok) return renderNoLink();
      guest = g;
      $("greeting").textContent = "¡" + g.nombre + ", estás invitado al nivel 36!";
      if (g.respuesta && g.respuesta.asistencia) renderStatus(g.respuesta); else renderForm(null);
    }).catch(function () {
      $("rsvp-body").replaceChildren(el("p", { class: "status err", text: "No pudimos cargar tu invitación. Recarga la página." }));
    });
  }
  init();
})();
