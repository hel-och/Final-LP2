let empleos = [];

let graficoRiesgo = null;
let graficoFuentes = null;
let graficoCategorias = null;

window.onload = async function () {
  const response = await fetch("/datos");
  empleos = await response.json();

  if (empleos.length === 0) {
    document.getElementById("mensaje").innerText = "No hay datos. Ejecuta primero python main.py";
    return;
  }

  cargarFiltros();
  document.getElementById("mensaje").innerText = "Datos cargados correctamente.";
  mostrarEmpleos();
};

function cargarFiltros() {
  const selectCategoria = document.getElementById("filtroCategoria");
  const selectFuente    = document.getElementById("filtroFuente");

  [...new Set(empleos.map(e => e.categoria))].forEach(c => {
    const o = document.createElement("option");
    o.value = o.textContent = c;
    selectCategoria.appendChild(o);
  });

  [...new Set(empleos.map(e => e.fuente))].forEach(f => {
    const o = document.createElement("option");
    o.value = o.textContent = f;
    selectFuente.appendChild(o);
  });
}

function mostrarEmpleos() {
  const categoria = document.getElementById("filtroCategoria").value;
  const fuente    = document.getElementById("filtroFuente").value;
  const riesgo    = document.getElementById("filtroRiesgo").value;
  const orden     = document.getElementById("filtroOrden").value;
  const busqueda  = document.getElementById("filtroBusqueda").value.toLowerCase().trim();

  let filtrados = empleos;

  if (fuente    !== "Todas")  filtrados = filtrados.filter(e => e.fuente === fuente);
  if (categoria !== "Todas")  filtrados = filtrados.filter(e => e.categoria === categoria);
  if (riesgo    !== "Todos")  filtrados = filtrados.filter(e => e.nivel_riesgo === riesgo);
  if (busqueda)               filtrados = filtrados.filter(e =>
    e.titulo.toLowerCase().includes(busqueda) ||
    e.empresa.toLowerCase().includes(busqueda)
  );

  if (orden === "riesgo_desc") filtrados = [...filtrados].sort((a, b) => b.riesgo - a.riesgo);
  if (orden === "riesgo_asc")  filtrados = [...filtrados].sort((a, b) => a.riesgo - b.riesgo);
  if (orden === "titulo_asc")  filtrados = [...filtrados].sort((a, b) => a.titulo.localeCompare(b.titulo));
  if (orden === "titulo_desc") filtrados = [...filtrados].sort((a, b) => b.titulo.localeCompare(a.titulo));

  actualizarMetricas(filtrados);
  actualizarGrafico(filtrados);
  renderizarOfertas(filtrados);
}

function resetFiltros() {
  document.getElementById("filtroBusqueda").value = "";
  document.getElementById("filtroFuente").value   = "Todas";
  document.getElementById("filtroCategoria").value = "Todas";
  document.getElementById("filtroRiesgo").value   = "Todos";
  document.getElementById("filtroOrden").value    = "default";
  mostrarEmpleos();
}

function actualizarMetricas(datos) {
  document.getElementById("total").innerText  = datos.length;
  document.getElementById("alto").innerText   = datos.filter(e => e.nivel_riesgo === "Alto").length;
  document.getElementById("medio").innerText  = datos.filter(e => e.nivel_riesgo === "Medio").length;
  document.getElementById("bajo").innerText   = datos.filter(e => e.nivel_riesgo === "Bajo").length;
}

function actualizarGrafico(datos) {

  if (graficoRiesgo) graficoRiesgo.destroy();
  if (graficoFuentes) graficoFuentes.destroy();
  if (graficoCategorias) graficoCategorias.destroy();

  // --- GRÁFICO 1: BARRAS (Riesgo) ---
  const alto  = datos.filter(e => e.nivel_riesgo === "Alto").length;
  const medio = datos.filter(e => e.nivel_riesgo === "Medio").length;
  const bajo  = datos.filter(e => e.nivel_riesgo === "Bajo").length;

  const ctxRiesgo = document.getElementById("graficoRiesgo");
  if (ctxRiesgo) {
    graficoRiesgo = new Chart(ctxRiesgo, {
      type: "bar",
      data: {
        labels: ["Alto", "Medio", "Bajo"],
        datasets: [{
          label: "Ofertas",
          data: [alto, medio, bajo],
          backgroundColor: ["rgba(248,81,73,0.7)", "rgba(210,153,34,0.7)", "rgba(63,185,80,0.7)"],
          borderColor:     ["#f85149", "#d29922", "#3fb950"],
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: "#30363d" }, ticks: { color: "#7d8590" } },
          y: { grid: { color: "#30363d" }, ticks: { color: "#7d8590", precision: 0 }, beginAtZero: true }
        }
      }
    });
  }

  // --- GRÁFICO 2: DONA (Fuentes) ---
  const conteoFuentes = {};
  datos.forEach(e => { conteoFuentes[e.fuente] = (conteoFuentes[e.fuente] || 0) + 1; });

  const ctxFuentes = document.getElementById("graficoFuentes");
  if (ctxFuentes) {
    graficoFuentes = new Chart(ctxFuentes, {
      type: "doughnut",
      data: {
        labels: Object.keys(conteoFuentes),
        datasets: [{
          data: Object.values(conteoFuentes),
          backgroundColor: ["#58a6ff", "#8957e5"],
          borderColor: "#0d1117",
          borderWidth: 2
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: "#e6edf3" } } } }
    });
  }

  // --- GRÁFICO 3: PASTEL (Categorías) ---
  const conteoCategorias = {};
  datos.forEach(e => { conteoCategorias[e.categoria] = (conteoCategorias[e.categoria] || 0) + 1; });

  const ctxCategorias = document.getElementById("graficoCategorias");
  if (ctxCategorias) {
    graficoCategorias = new Chart(ctxCategorias, {
      type: "pie",
      data: {
        labels: Object.keys(conteoCategorias),
        datasets: [{
          data: Object.values(conteoCategorias),
          backgroundColor: ["#f78166", "#e3b341", "#238636", "#58a6ff"],
          borderColor: "#0d1117",
          borderWidth: 2
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: "#e6edf3" } } } }
    });
  }
}

function renderizarOfertas(datos) {
  const contenedor = document.getElementById("contenedor");
  contenedor.innerHTML = `<h2 class="titulo-ofertas">Ofertas analizadas — ${datos.length} resultado${datos.length !== 1 ? 's' : ''}</h2>`;

  if (datos.length === 0) {
    contenedor.innerHTML += `<div class="oferta"><div>No hay ofertas para este filtro.</div></div>`;
    return;
  }

  datos.forEach(e => {
    const div = document.createElement("div");
    div.className = "oferta";

    div.innerHTML = `
      <div>
        <div class="oferta-titulo">${e.titulo}</div>
        <div class="oferta-empresa">${e.empresa} · ${e.fuente}</div>
        <div class="oferta-meta">
          <span class="meta-tag">${e.categoria}</span>
          <span class="meta-tag">${e.ubicacion}</span>
          <span class="meta-tag">${e.salario}</span>
        </div>
        <div class="oferta-descripcion">${e.descripcion}</div>
        <div class="oferta-razones">${e.razones}</div>
        <a class="oferta-link" href="${e.url}" target="_blank">Ver oferta original →</a>
      </div>
      <div class="oferta-riesgo-panel riesgo-${e.nivel_riesgo}">
        <span class="etiqueta riesgo-${e.nivel_riesgo}">${e.nivel_riesgo}</span>
        <span class="puntaje">${e.riesgo}</span>
        <span class="puntaje-label">puntos</span>
      </div>
    `;

    contenedor.appendChild(div);
  });
}