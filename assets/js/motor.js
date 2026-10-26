/* =====================================================================
   MOTOR DE CONTENIDO · Mirai
   Lee contenido.json y llena las {{variables}} de la plantilla del index.html.
   No hace falta editar este archivo: todos los textos se cambian en contenido.json.

   Cómo se escribe en el HTML (dentro de <template id="plantilla">):
     {{portada.nombre}}                   → pone ese valor del JSON
     {{#cronograma}} … {{/cronograma}}    → repite el bloque por cada elemento de la lista
                                            (adentro: {{hora}}, {{actividad}}; {{.}} si la lista es de textos)
     {{#instagram}} … {{/instagram}}      → muestra el bloque solo si existe en el JSON y no es false
     {{^instagram}} … {{/instagram}}      → muestra el bloque solo si NO existe o es false
     {{?padres}} … {{/padres}}            → muestra el bloque UNA vez si la lista tiene elementos (sin repetir)
     {{@indice}} / {{@numero}} / {{@lado}} → dentro de una lista: número del elemento (1, 2, 3…),
                                            el mismo con dos cifras (01, 02…) y "left"/"right" alternados
     {{@posicion}}                        → dentro de una lista: posición contando desde 0 (0, 1, 2…)
     {{#@primero}} … {{/@primero}}        → dentro de una lista: solo en el primer elemento
                                            (útil para la clase "active" de los carruseles)

   Los valores del JSON aceptan HTML sencillo (por ejemplo <br> o <em>).
   Para ocultar una sección completa, pon su clave en false en contenido.json,
   o agrega "mostrar": false dentro de ella para ocultarla sin borrar sus textos.
   Nota: el JSON se lee con fetch, así que abre la invitación con Live Server
   (VS Code) o desde Netlify; con doble clic al archivo no carga.
   Al terminar, el motor vuelve a avisar los eventos DOMContentLoaded y load,
   para que los scripts y librerías (como Bootstrap) que los esperan funcionen igual.
   ===================================================================== */
(async function () {
  const plantilla = document.getElementById("plantilla");
  const archivo = plantilla.dataset.contenido || "./contenido.json";

  let datos;
  try {
    const respuesta = await fetch(archivo, { cache: "no-cache" });
    datos = await respuesta.json();
  } catch (error) {
    console.error(error);
    document.body.insertAdjacentHTML(
      "beforeend",
      `<p style="padding:24px;font-family:sans-serif;line-height:1.5">
        No se pudo leer <b>${archivo}</b>.<br>
        Revisa que no le falten comas o comillas, y abre la invitación con Live Server o desde Netlify.
      </p>`
    );
    return;
  }
  window.INVITACION = datos;
  if (datos.pagina && datos.pagina.titulo) document.title = datos.pagina.titulo;

  /* Busca "a.b.c" empezando por el bloque actual y subiendo hasta la raíz */
  function buscar(ruta, pila) {
    if (ruta === ".") return pila[pila.length - 1];
    const partes = ruta.split(".");
    for (let i = pila.length - 1; i >= 0; i--) {
      const base = pila[i];
      if (base && typeof base === "object" && partes[0] in base) {
        return partes.reduce((valor, parte) => (valor == null ? undefined : valor[parte]), base);
      }
    }
    return undefined;
  }

  /* Convierte el texto en un árbol de bloques {{#…}}…{{/…}} (se pueden anidar) */
  function analizar(texto) {
    const raiz = { hijos: [] };
    const abiertos = [raiz];
    const marca = /\{\{\s*([#^?\/]?)\s*([\w.@]+)\s*\}\}/g;
    let ultimo = 0;
    let m;
    while ((m = marca.exec(texto))) {
      const actual = abiertos[abiertos.length - 1];
      actual.hijos.push(texto.slice(ultimo, m.index));
      ultimo = marca.lastIndex;
      const [, tipo, ruta] = m;
      if (tipo === "#" || tipo === "^" || tipo === "?") {
        const bloque = { tipo, ruta, hijos: [] };
        actual.hijos.push(bloque);
        abiertos.push(bloque);
      } else if (tipo === "/") {
        if (abiertos.length > 1 && actual.ruta === ruta) abiertos.pop();
        else console.warn(`Cierre {{/${ruta}}} sin su apertura en la plantilla`);
      } else {
        actual.hijos.push({ ruta });
      }
    }
    abiertos[abiertos.length - 1].hijos.push(texto.slice(ultimo));
    if (abiertos.length > 1) console.warn(`Falta cerrar {{/${abiertos[abiertos.length - 1].ruta}}} en la plantilla`);
    return raiz.hijos;
  }

  function render(nodos, pila) {
    return nodos
      .map((nodo) => {
        if (typeof nodo === "string") return nodo;
        const valor = buscar(nodo.ruta, pila);
        if (!nodo.tipo) {
          if (valor == null) {
            console.warn(`Falta "${nodo.ruta}" en ${archivo}`);
            return "";
          }
          return valor;
        }
        const vacio =
          valor == null ||
          valor === false ||
          valor === "" ||
          (Array.isArray(valor) && !valor.length) ||
          (typeof valor === "object" && valor.mostrar === false);
        if (nodo.tipo === "^") return vacio ? render(nodo.hijos, pila) : "";
        if (vacio) return "";
        if (nodo.tipo === "?") return render(nodo.hijos, pila);
        if (Array.isArray(valor))
          return valor
            .map((item, i) => render(nodo.hijos, [...pila, {
                  "@indice": i + 1,
                  "@posicion": i,
                  "@numero": String(i + 1).padStart(2, "0"),
                  "@lado": i % 2 ? "right" : "left",
                  "@primero": i === 0,
                  "@ultimo": i === valor.length - 1,
                }, item]))
            .join("");
        return render(nodo.hijos, typeof valor === "object" ? [...pila, valor] : pila);
      })
      .join("");
  }

  /* Inserta la invitación ya llenada y luego carga sus scripts en orden */
  const resultado = document.createElement("template");
  resultado.innerHTML = render(analizar(plantilla.innerHTML), [datos]);
  const scripts = [...resultado.content.querySelectorAll("script")];
  scripts.forEach((s) => s.remove());
  plantilla.replaceWith(resultado.content);

  for (const original of scripts) {
    await new Promise((listo) => {
      const s = document.createElement("script");
      [...original.attributes].forEach((a) => s.setAttribute(a.name, a.value));
      if (original.src) {
        s.onload = s.onerror = listo;
        document.body.appendChild(s);
      } else {
        s.textContent = original.textContent;
        document.body.appendChild(s);
        listo();
      }
    });
  }

  /* La página ya había terminado de cargar antes de que existiera la invitación:
     se vuelven a avisar los eventos para los scripts que los esperan */
  document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true }));
  if (document.readyState === "complete") window.dispatchEvent(new Event("load"));
})();
