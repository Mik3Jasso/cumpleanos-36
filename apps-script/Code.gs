/**
 * API de la invitación — pega este archivo en Extensiones > Apps Script
 * de tu hoja de Google. Ver SETUP.md.
 *
 * Hoja "Invitados" (fila 1 = encabezados):
 *   A nombre | B honor | C max_personas | D id | E link | F asistencia | G acompanante | H fecha_respuesta
 * Tú llenas A, B (casilla de invitado de honor) y C. D y E se generan con el menú "Invitación > Generar links".
 */
var SHEET = "Invitados";
var SITE_URL = "https://cumple.mikejasso.com.mx/"; // ← cambia por tu dominio final

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Invitación")
    .addItem("Generar links", "generarLinks")
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
  });
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

// GET ?i=ID → datos SOLO de ese invitado
function doGet(e) {
  var id = String((e.parameter && e.parameter.i) || "").trim().toLowerCase();
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
  var row = find_(sh, id);
  if (!row) return json_({ ok: false });
  var v = sh.getRange(row, 1, 1, 7).getValues()[0];
  var honor = v[1] === true || String(v[1]).toLowerCase() === "true";
  var out = { ok: true, nombre: String(v[0]).split(" ")[0], honor: honor, max: Number(v[2]) || 1, respuesta: null };
  if (v[5]) out.respuesta = { asistencia: v[5], acompanante: v[6] === "Sí" };
  return json_(out);
}

// POST {id, asistencia:"si"|"no", acompanante:bool}
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var b = JSON.parse(e.postData.contents);
    var id = String(b.id || "").trim().toLowerCase();
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
