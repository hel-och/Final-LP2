let empleos = [];
let chartRiesgo = null;
let chartFuentes = null;
let chartCategorias = null;

window.onload = async function () {
  const response = await fetch("/datos");
  empleos = await response.json();

  if (empleos.length === 0) {
    document.getElementById("mensaje").innerText = "No hay datos. Ejecuta primero python main.py";
    return;
  }

  cargarFiltros();
  document.getElementById("mensaje").style.display = "none";
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

  if (fuente !== "Todas") filtrados = filtrados.filter(e => e.fuente === fuente);
  if (categoria !== "Todas") filtrados = filtrados.filter(e => e.categoria === categoria);
  if (riesgo !== "Todos") filtrados = filtrados.filter(e => e.nivel_riesgo === riesgo);

  if (busqueda) {
    filtrados = filtrados.filter(e =>
      e.titulo.toLowerCase().includes(busqueda) ||
      e.empresa.toLowerCase().includes(busqueda)
    );
  }

  if (orden === "riesgo_desc") filtrados.sort((a, b) => b.riesgo - a.riesgo);
  if (orden === "riesgo_asc")  filtrados.sort((a, b) => a.riesgo - b.riesgo);
  if (orden === "titulo_asc")  filtrados.sort((a, b) => a.titulo.localeCompare(b.titulo));
  if (orden === "titulo_desc") filtrados.sort((a, b) => b.titulo.localeCompare(a.titulo));

  actualizarResumen(filtrados);
  actualizarGraficos(filtrados);
  renderizarOfertas(filtrados);
}

function resetFiltros() {
  document.getElementById("filtroBusqueda").value = "";
  document.getElementById("filtroFuente").value = "Todas";
  document.getElementById("filtroCategoria").value = "Todas";
  document.getElementById("filtroRiesgo").value = "Todos";
  document.getElementById("filtroOrden").value = "default";
  mostrarEmpleos();
}

function actualizarResumen(datos) {
  document.getElementById("total").innerText = datos.length;
  document.getElementById("alto").innerText = datos.filter(e => e.nivel_riesgo === "Alto").length;
  document.getElementById("medio").innerText = datos.filter(e => e.nivel_riesgo === "Medio").length;
  document.getElementById("bajo").innerText = datos.filter(e => e.nivel_riesgo === "Bajo").length;
}

function actualizarGraficos(datos) {
  // Limpiar gráficos anteriores si existen
  if (chartRiesgo) chartRiesgo.destroy();
  if (chartFuentes) chartFuentes.destroy();
  if (chartCategorias) chartCategorias.destroy();

  // 1. Gráfico de Riesgo (Barras)
  const ctxRiesgo = document.getElementById("graficoRiesgo").getContext("2d");
  const altos = datos.filter(e => e.nivel_riesgo === "Alto").length;
  const medios = datos.filter(e => e.nivel_riesgo === "Medio").length;
  const bajos = datos.filter(e => e.nivel_riesgo === "Bajo").length;

  chartRiesgo = new Chart(ctxRiesgo, {
    type: 'bar',
    data: {
      labels: ['Alto', 'Medio', 'Bajo'],
      datasets: [{
        label: 'Cantidad de ofertas',
        data: [altos, medios, bajos],
        backgroundColor: ['#f85149', '#d29922', '#3fb950'] // Colores Github Dark
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });

  // 2. Gráfico de Fuentes (Doughnut / Dona)
  const ctxFuentes = document.getElementById("graficoFuentes").getContext("2d");
  const fuentesCount = {};
  datos.forEach(e => fuentesCount[e.fuente] = (fuentesCount[e.fuente] || 0) + 1);
  
  chartFuentes = new Chart(ctxFuentes, {
    type: 'doughnut',
    data: {
      labels: Object.keys(fuentesCount),
      datasets: [{
        data: Object.values(fuentesCount),
        backgroundColor: ['#58a6ff', '#8957e5', '#3fb950', '#d29922']
      }]
    },
    options: { responsive: true }
  });

  // 3. Gráfico de Categorías (Pie / Circular)
  const ctxCategorias = document.getElementById("graficoCategorias").getContext("2d");
  const catCount = {};
  datos.forEach(e => catCount[e.categoria] = (catCount[e.categoria] || 0) + 1);

  chartCategorias = new Chart(ctxCategorias, {
    type: 'pie',
    data: {
      labels: Object.keys(catCount),
      datasets: [{
        data: Object.values(catCount),
        backgroundColor: ['#1f6feb', '#238636', '#a371f7', '#da3633', '#9e6a03']
      }]
    },
    options: { responsive: true }
  });
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
        <div class="etiqueta">Riesgo ${e.nivel_riesgo}</div>
        <div class="puntaje">${e.riesgo}</div>
        <div class="puntaje-label">PUNTOS</div>
      </div>
    `;
    contenedor.appendChild(div);
  });
}