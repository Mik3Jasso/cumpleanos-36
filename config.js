// ============================================================
//  CONFIGURACIÓN — edita solo este archivo para cambiar datos
// ============================================================
window.PARTY = {
  // Paleta: rojo | amarillo | cristal | plata | charmander | pocket
  // (para probar sin tocar código: agrega ?tema=cristal al link)
  tema: "cristal",

  anfitrion: "Miguel",
  edad: 36,

  // Fecha y hora de inicio (Guadalajara: -06:00).
  fechaISO: "2026-11-22T18:00:00-06:00",
  inicioISO: "2026-11-08T00:00:00-06:00", // desde cuándo corre la barra de XP
  fechaTexto: "Domingo 22 de noviembre, 2026",
  fechaCorta: "DOM 22 NOV",
  horaTexto: "6:00 PM",

  lugarNombre: "Santas Patronas",
  lugarDireccion: "Calle Efraín González Luna 2014, Col. Americana, Obrera, 44160 Guadalajara, Jal.",
  lugarMapsUrl: "https://maps.app.goo.gl/49Ko8pdphp9FQyoFA",
  vestimenta: "Libre, ven cómodo",
  fechaLimite: "Sábado 21 de noviembre",
  contactoWhatsApp: "", // solo dígitos con lada, ej. 5213312345678 (vacío = oculto)

  // Texto final del diálogo de bienvenida
  mensaje: "Trae ganas de pasarla bien. Confirma antes del sábado para guardarte tu lugar.",

  // URL del Apps Script publicado (ver SETUP.md). Vacío = modo demo local.
  apiUrl: "https://script.google.com/macros/s/AKfycbwWvSq-8pCRKRiMpCt22BUqjIUA5ZpBDWVwv9tuMO6Mwd-L793GBgSkPY0EpC6eLSDu/exec",

  // Invitados de ejemplo para modo demo (solo en localhost con ?demo=1, o si apiUrl está vacío).
  // Prueba: http://localhost:8765/?demo=1&i=demo-ana  |  &i=demo-luis
  demoGuests: {
    "demo-ana": { nombre: "Ana", max: 2, honor: true },
    "demo-luis": { nombre: "Luis", max: 1 },
  },
};
