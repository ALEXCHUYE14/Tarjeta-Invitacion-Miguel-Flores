/**
 * =========================================================
 *  Miguel_Flores_v31.0 — RSVP Backend (Google Apps Script)
 *  Web App endpoint para invitación de cumpleaños.
 *
 *  DESPLIEGUE:
 *   1. Abre la hoja de cálculo con ID:
 *      1zeD1CQKWda5wf0uPHAzJRXrXvWGXTVCnL1EeKiCfp-I
 *   2. Extensiones > Apps Script. Pega este código en Code.gs.
 *   3. (Opcional) Ejecuta setupSheet() una vez para crear los encabezados.
 *   4. Implementar > Nueva implementación > Tipo: "Aplicación web".
 *        - Ejecutar como: Yo (tu cuenta)
 *        - Quién tiene acceso: Cualquier usuario
 *   5. Copia la URL /exec y pégala en CONFIG.scriptURL dentro de script.js.
 * =========================================================
 */

var SHEET_ID = "1zeD1CQKWda5wf0uPHAzJRXrXvWGXTVCnL1EeKiCfp-I";
var SHEET_NAME = "RSVP"; // nombre de la pestaña donde se guardan las respuestas
var HEADERS = ["Timestamp", "Nombre", "Asistencia", "Aporte", "Mensaje"];

/**
 * Devuelve (creando si hace falta) la pestaña de RSVP con encabezados.
 */
function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Ejecuta esto UNA vez manualmente para inicializar la hoja (opcional).
 */
function setupSheet() {
  getSheet_();
}

/**
 * Maneja el POST del formulario RSVP.
 * Acepta tanto application/x-www-form-urlencoded (e.parameter)
 * como JSON crudo (e.postData.contents).
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // evita colisiones de escritura concurrente

    var data = parsePayload_(e);

    var nombre       = String(data.nombre || "").trim();
    var asistencia   = String(data.asistencia || "").trim();
    var aporte       = String(data.aporte || "").trim();
    var mensaje      = String(data.mensaje || "").trim();

    if (!nombre) {
      return jsonOut_({ status: "error", code: 400, message: "Nombre requerido" });
    }

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),      // Timestamp exacto del servidor
      nombre,
      asistencia,
      aporte,
      mensaje
    ]);

    return jsonOut_({
      status: "success",
      code: 200,
      message: "RSVP_ACCEPTED_200_OK",
      data: {
        nombre: nombre,
        asistencia: asistencia,
        aporte: aporte
      }
    });
  } catch (err) {
    return jsonOut_({ status: "error", code: 500, message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Endpoint de verificación (abre la URL /exec en el navegador para probar).
 */
function doGet() {
  return jsonOut_({
    status: "online",
    code: 200,
    service: "Miguel_Flores_v31.0 RSVP endpoint"
  });
}

/**
 * Extrae los campos del formulario sin importar el content-type.
 */
function parsePayload_(e) {
  if (!e) return {};

  // 1) URLSearchParams / form-urlencoded / FormData
  if (e.parameter && Object.keys(e.parameter).length > 0) {
    return e.parameter;
  }

  // 2) JSON crudo
  if (e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    try {
      return JSON.parse(raw);
    } catch (jsonErr) {
      // 3) fallback: query string en el cuerpo
      var out = {};
      raw.split("&").forEach(function (pair) {
        var kv = pair.split("=");
        if (kv[0]) out[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || "").replace(/\+/g, " "));
      });
      return out;
    }
  }
  return {};
}

/**
 * Respuesta JSON con status 200 (ContentService).
 */
function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
