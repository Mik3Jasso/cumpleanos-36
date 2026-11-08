// ============================================================
//  CONFIGURACIÓN — edita solo este archivo para cambiar datos
// ============================================================
window.PARTY = {
  anfitrion: "Miguel",
  edad: 36,

  // Fecha y hora de inicio. Ajusta el offset a tu zona horaria
  // (-06:00 = CDMX/centro de México sin horario de verano).
  fechaISO: "2026-11-22T18:00:00-06:00",
  fechaTexto: "Domingo 22 de noviembre, 2026",
  horaTexto: "6:00 PM",

  // ⚠️ PENDIENTES: reemplaza con los datos reales
  lugarNombre: "Santas Patronas",
  lugarDireccion: "Calle Efraín González Luna 2014, Col. Americana, Obrera, 44160 Guadalajara, Jal.",
  lugarMapsUrl: "https://maps.app.goo.gl/49Ko8pdphp9FQyoFA",
  vestimenta: "Libre, ven cómodo",
  fechaLimite: "Sábado 21 de noviembre",
  contactoTexto: "Dudas por WhatsApp",
  contactoWhatsApp: "", // solo dígitos con lada, ej. 5215512345678 (vacío = oculto)

  mensaje:
    "Otro año, otro nivel desbloqueado. Quiero compartir el 36 contigo: comida, música y buena compañía. ¡Confirma para que te guarde lugar!",

  // URL del Apps Script publicado (ver SETUP.md). Vacío = modo demo local.
  apiUrl: "",

  // Invitados de ejemplo para el modo demo (solo se usan si apiUrl está vacío).
  // Prueba: index.html?i=demo-ana  |  ?i=demo-luis
  demoGuests: {
    "demo-ana": { nombre: "Ana", max: 2 },
    "demo-luis": { nombre: "Luis", max: 1 },
  },
};
