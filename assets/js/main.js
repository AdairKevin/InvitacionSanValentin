/* Los datos vienen de contenido.json (los carga motor.js en window.INVITACION) */
const DATOS = window.INVITACION;

/* Time: la fecha se cambia en evento.inicio de contenido.json */
const second = 1000,
  minute = second * 60,
  hour = minute * 60,
  day = hour * 24;

let countDown = new Date(DATOS.evento.inicio).getTime(),
  x = setInterval(function () {
    let now = new Date().getTime(),
      distance = countDown - now;

    if (distance < 0) {
      clearInterval(x);
      document.getElementById("dias").innerText = 0;
      document.getElementById("horas").innerText = 0;
      document.getElementById("minutos").innerText = 0;
      document.getElementById("segundos").innerText = 0;
      console.log("¡El tiempo ha terminado!");
      return; // Termina la ejecución de la función
    }

    const dias = Math.floor(distance / day);
    const horas = Math.floor((distance % day) / hour);
    const minutos = Math.floor((distance % hour) / minute);
    const segundos = Math.floor((distance % minute) / second);

    document.getElementById("dias").innerText = dias;
    document.getElementById("horas").innerText = horas;
    document.getElementById("minutos").innerText = minutos;
    document.getElementById("segundos").innerText = segundos;

    console.log(dias, horas, minutos, segundos);
  }, second);

if (segundos == 0) {
  ((document.getElementById("dias").innerText = "00"),
    (document.getElementById("horas").innerText = "00"),
    (document.getElementById("minutos").innerText = "00"),
    (document.getElementById("segundos").innerText = "00"));
}
const audio = document.getElementById("audioPlayer");
const playPauseBtn = document.getElementById("playPauseBtn");

// (este modelo no trae reproductor; se valida que exista)
playPauseBtn && playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = "⏸";
  } else {
    audio.pause();
    playPauseBtn.textContent = "▶";
  }
});

audio && audio.addEventListener("ended", () => {
  playPauseBtn.textContent = "▶";
  progressBar.style.width = "0%";
});

/* Calendario (semana de lunes a domingo): mes, año, días y botón de Google Calendar salen de evento.inicio */
(function () {
  const contenedor = document.getElementById("calendarioDias");
  if (!contenedor) return;
  const fecha = new Date(DATOS.evento.inicio);
  const anio = fecha.getFullYear(),
    mes = fecha.getMonth();
  document.getElementById("calendarioMes").textContent = DATOS.calendario.meses[mes];
  document.getElementById("calendarioAnio").textContent = anio;
  let celdas = "<span></span>\n".repeat((new Date(anio, mes, 1).getDay() + 6) % 7);
  for (let d = 1, total = new Date(anio, mes + 1, 0).getDate(); d <= total; d++) {
    celdas += (d === fecha.getDate() ? '<span class="dia-especial">' + d + "</span>" : "<span>" + d + "</span>") + "\n";
  }
  contenedor.innerHTML = celdas;

  const pad = (n) => String(n).padStart(2, "0");
  const formato = (f) => f.getFullYear() + pad(f.getMonth() + 1) + pad(f.getDate()) + "T" + pad(f.getHours()) + pad(f.getMinutes()) + "00";
  const fin = new Date(fecha.getTime() + DATOS.evento.duracionHoras * hour);
  const google =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=" + encodeURIComponent(DATOS.evento.tituloCalendario) +
    "&dates=" + formato(fecha) + "/" + formato(fin) +
    "&details=" + encodeURIComponent(DATOS.evento.detallesCalendario) +
    "&location=" + encodeURIComponent(DATOS.evento.lugarCalendario);
  document.getElementById("calendarioBoton").addEventListener("click", () => window.open(google, "_blank"));
})();
