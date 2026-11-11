/**
 * API de la invitación — pega este archivo en Extensiones > Apps Script
 * de tu hoja de Google. Ver SETUP.md.
 *
 * Hoja "Invitados" (fila 1 = encabezados):
 *   A nombre | B honor | C max_personas | D id | E link | F asistencia | G acompanante | H fecha_respuesta | I mensaje
 * Tú llenas A, B (casilla de invitadx de honor) y C. D, E e I se generan con el menú "Invitación > Generar links".
 * Menú "Invitación > Copiar mensaje de la fila activa": abre una ventana con el texto y un botón Copiar.
 */
var SHEET = "Invitados";
var SITE_URL = "https://cumple.mikejasso.com.mx/"; // ← cambia por tu dominio final

// Texto que se envía con el link. {LINK} y {MAS1} se reemplazan solos.
var MENSAJE_BASE =
  "¡Hola! 👋\n\n" +
  "Voy a subir al nivel 36 y quiero celebrarlo contigo 🎂\n\n" +
  "📅 Domingo 22 de noviembre, 6:00 PM\n" +
  "📍 Santas Patronas\n\n" +
  "Esta es tu invitación personal. Aquí puedes ver todos los detalles y confirmar tu asistencia.{MAS1}\n\n" +
  "{LINK}\n\n" +
  "Confírmame antes del sábado 21, porfa. ¡Te espero!";
var LINEA_MAS1 = " Si quieres venir con alguien, ahí mismo puedes confirmarlo."; // solo si max_personas > 1

function mensaje_(link, max) {
  return MENSAJE_BASE.replace("{MAS1}", Number(max) > 1 ? LINEA_MAS1 : "").replace("{LINK}", link);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Invitación")
    .addItem("Generar links y mensajes", "generarLinks")
    .addItem("Copiar mensaje de la fila activa", "mostrarMensaje")
    .addToUi();
}

function generarLinks() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
  var rows = sh.getLastRow();
  if (rows < 2) return;
  var data = sh.getRange(2, 1, rows - 1, 5).getValues();
  var used = {};
  data.forEach(function (r) { if (r[3]) used[r[3]] = true; });
  data.forEach(function (r, i) {
    if (!r[0]) return;
    if (!r[3]) {
      var id;
      do { id = slug_(r[0]) + "-" + Math.random().toString(36).slice(2, 6); } while (used[id]);
      used[id] = true;
      r[3] = id;
    }
    r[4] = SITE_URL + "?i=" + r[3];
    sh.getRange(i + 2, 4, 1, 2).setValues([[r[3], r[4]]]);
    sh.getRange(i + 2, 9).setValue(mensaje_(r[4], r[2]));
  });
  sh.getRange(1, 9).setValue("mensaje");
  sh.getRange(2, 9, rows - 1, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP); // filas compactas
}

// Abre una ventana con el mensaje de la fila seleccionada y un botón Copiar
function mostrarMensaje() {
  var ui = SpreadsheetApp.getUi();
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
  var row = SpreadsheetApp.getActiveRange().getRow();
  if (!sh || row < 2) { ui.alert("Selecciona una celda de la fila de un invitadx (no el encabezado)."); return; }
  var v = sh.getRange(row, 1, 1, 5).getValues()[0];
  if (!v[0] || !v[4]) { ui.alert("Esa fila aún no tiene link. Usa primero «Generar links y mensajes»."); return; }
  var esc = function (t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var html =
    '<div style="font-family:Arial,sans-serif;font-size:13px">' +
    '<p style="margin:0 0 8px">Mensaje para <b>' + esc(v[0]) + "</b></p>" +
    '<textarea id="t" readonly style="width:100%;height:240px;box-sizing:border-box;font-size:13px">' + esc(mensaje_(v[4], v[2])) + "</textarea>" +
    '<p style="margin:10px 0 0"><button id="b" style="padding:8px 16px;font-size:14px">Copiar</button> <span id="ok" style="color:#188038"></span></p>' +
    "<script>var t=document.getElementById('t');t.focus();t.select();" +
    "document.getElementById('b').onclick=function(){t.focus();t.select();" +
    "var done=function(){document.getElementById('ok').textContent='¡Copiado!'};" +
    "try{if(document.execCommand('copy')){done();return;}}catch(e){}" +
    "if(navigator.clipboard){navigator.clipboard.writeText(t.value).then(done);}};" +
    "<\/script></div>";
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(440).setHeight(400), "Copiar mensaje");
}

function slug_(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20);
}

function find_(sh, id) {
  if (!id) return null;
  var rows = sh.getLastRow();
  if (rows < 2) return null;
  var ids = sh.getRange(2, 4, rows - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).toLowerCase() === id) return i + 2;
  }
  return null;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Datos SOLO de un invitado (los usa GET y POST accion:"get")
function lookup_(id) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
  var row = find_(sh, id);
  if (!row) return { ok: false };
  var v = sh.getRange(row, 1, 1, 7).getValues()[0];
  var honor = v[1] === true || String(v[1]).toLowerCase() === "true";
  var out = { ok: true, nombre: String(v[0]).trim(), honor: honor, max: Number(v[2]) || 1, respuesta: null };
  if (v[5]) out.respuesta = { asistencia: v[5], acompanante: v[6] === "Sí" };
  return out;
}

// GET ?i=ID
function doGet(e) {
  var p = (e && e.parameter) || {};
  var id = String(p.i || "").trim().toLowerCase();
  return json_(lookup_(id));
}

// POST {id, asistencia:"si"|"no", acompanante:bool}
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var b = JSON.parse(e.postData.contents);
    var id = String(b.id || "").trim().toLowerCase();
    if (b.accion === "get") return json_(lookup_(id));
    var sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
    var row = find_(sh, id);
    if (!row) return json_({ ok: false, error: "invitado no encontrado" });
    if (b.asistencia !== "si" && b.asistencia !== "no") return json_({ ok: false, error: "dato inválido" });
    var max = Number(sh.getRange(row, 3).getValue()) || 1;
    var plus = b.asistencia === "si" && b.acompanante === true && max > 1;
    sh.getRange(row, 6, 1, 3).setValues([[
      b.asistencia === "si" ? "Sí" : "No",
      plus ? "Sí" : "No",
      new Date()
    ]]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: "error" });
  } finally {
    lock.releaseLock();
  }
}
