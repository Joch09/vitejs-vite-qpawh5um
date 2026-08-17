import { useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { latLngBounds } from 'leaflet';

import 'leaflet/dist/leaflet.css';
import './App.css';

import iconCaries from './assets/menu/icono Caries.png';
import iconIndicadores from './assets/menu/icono indicadores.png';
import iconHigiene from './assets/menu/icono Higiene.png';
import iconPeriodontal from './assets/menu/icono enfperio.png';
import iconOtras from './assets/menu/icono cancer.png';

import iconMigrantes from './assets/social/icono_migrantes.png';
import iconIndigena from './assets/social/icono_indigena.png';

import logoImssBienestar from './assets/logos/Logo_imssb.png';
import logoVigilancia from './assets/logos/LOGO_BLANCO_V.png';
import logoCoordinacion from './assets/logos/logo_cordinacion.png';

const MODULOS = [
  { id: 'caries', titulo: 'CARIES', icono: iconCaries },
  { id: 'higiene', titulo: 'HIGIENE BUCAL', icono: iconHigiene },
  {
    id: 'periodontal',
    titulo: 'ENFERMEDAD PERIODONTAL',
    icono: iconPeriodontal,
  },
  { id: 'otras', titulo: 'OTRAS PATOLOGÍAS', icono: iconOtras },
  {
    id: 'evaluacion',
    titulo: 'EVALUACIÓN DE INDICADORES',
    icono: iconIndicadores,
  },
];

const ANTECEDENTES = [
  { campo: 'tabaco', etiqueta: 'Tabaquismo' },
  { campo: 'dm', etiqueta: 'Diabetes Mellitus' },
  { campo: 'hta', etiqueta: 'Enfermedades hipertensivas' },
  { campo: 'inmuno', etiqueta: 'Inmunodeficiencia' },
];

function MapAutoFit({ puntos }) {
  const map = useMap();

  useEffect(() => {
    const puntosValidos = puntos.filter(
      (item) =>
        Number.isFinite(Number(item.lat)) &&
        Number.isFinite(Number(item.lon))
    );

    if (puntosValidos.length === 0) return;

    const bounds = latLngBounds(
      puntosValidos.map((item) => [Number(item.lat), Number(item.lon)])
    );

    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: 11,
    });
  }, [puntos, map]);

  return null;
}

function decodeColumnarDataset(dataset) {
  if (!dataset?.schema || !dataset?.rows) return [];

  return dataset.rows.map((row) => {
    const objeto = {};

    dataset.schema.forEach((campo, index) => {
      objeto[campo] = row[index] ?? null;
    });

    return objeto;
  });
}

function sumar(rows, campo) {
  return rows.reduce((total, item) => {
    const valor = Number(item[campo]);
    return total + (Number.isFinite(valor) ? valor : 0);
  }, 0);
}

function porcentaje(n, N) {
  if (!N) return null;
  return (n / N) * 100;
}

function formatoNumero(valor, decimales = 2) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return '—';
  }

  return valor.toLocaleString('es-MX', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

function formatoPorcentaje(valor, decimales = 1) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return '—';
  }

  return `${formatoNumero(valor, decimales)}%`;
}

function edadCoincide(valorEdad, filtroEdad) {
  if (!filtroEdad) return true;

  const valor = Number(valorEdad);

  if (!Number.isFinite(valor)) return false;

  const filtro = String(filtroEdad).trim();

  if (filtro.endsWith('+')) {
    const minimo = Number(filtro.slice(0, -1));
    return Number.isFinite(minimo) && valor >= minimo;
  }

  if (filtro.includes('-')) {
    const [minimo, maximo] = filtro
      .split('-')
      .map((item) => Number(item));

    return (
      Number.isFinite(minimo) &&
      Number.isFinite(maximo) &&
      valor >= minimo &&
      valor <= maximo
    );
  }

  return valor === Number(filtro);
}

function hayEdadEnRango(edades, valor) {
  return edades.some((edad) => edadCoincide(edad, valor));
}

function construirGruposEdad(vista, edadesFuente) {
  const edades = edadesFuente
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
    .sort((a, b) => a - b);

  const exactas = (inicio, fin) =>
    edades
      .filter((item) => item >= inicio && item <= fin)
      .map((item) => ({
        value: String(item),
        label: `${item} años`,
      }));

  const opcion19 = edades.includes(19)
    ? [{ value: '19', label: '19 años' }]
    : [];

  const rangosAdultos = [
    ['20-24', '20 a 24 años'],
    ['25-29', '25 a 29 años'],
    ['30-34', '30 a 34 años'],
    ['35-39', '35 a 39 años'],
    ['40-44', '40 a 44 años'],
    ['45-49', '45 a 49 años'],
    ['50-54', '50 a 54 años'],
    ['55-59', '55 a 59 años'],
    ['60-64', '60 a 64 años'],
    ['65-69', '65 a 69 años'],
    ['70-74', '70 a 74 años'],
    ['75-79', '75 a 79 años'],
    ['80+', '80 y más'],
  ]
    .filter(([value]) => hayEdadEnRango(edades, value))
    .map(([value, label]) => ({ value, label }));

  if (vista === 'higiene') {
    return [
      {
        label: 'Niñas, niños y adolescentes',
        opciones: exactas(7, 18),
      },
      {
        label: 'Adultos',
        opciones: [
          ...opcion19,
          ...rangosAdultos,
        ],
      },
    ].filter((grupo) => grupo.opciones.length > 0);
  }

  if (vista === 'periodontal') {
    return [
      {
        label: 'Niñas, niños y adolescentes',
        opciones: [
          ...exactas(7, 14),
          ...(hayEdadEnRango(edades, '15-19')
            ? [{ value: '15-19', label: '15 a 19 años' }]
            : []),
        ],
      },
      {
        label: 'Adultos',
        opciones: rangosAdultos,
      },
    ].filter((grupo) => grupo.opciones.length > 0);
  }

  if (vista === 'caries') {
    return [
      {
        label: 'Niñas, niños y adolescentes',
        opciones: exactas(2, 18),
      },
      {
        label: 'Adultos',
        opciones: [
          ...opcion19,
          ...rangosAdultos,
        ],
      },
    ].filter((grupo) => grupo.opciones.length > 0);
  }

  return [
    {
      label: 'Niñas, niños y adolescentes',
      opciones: exactas(0, 18),
    },
    {
      label: 'Adultos',
      opciones: [
        ...opcion19,
        ...rangosAdultos,
      ],
    },
  ].filter((grupo) => grupo.opciones.length > 0);
}

function acortarOcupacion(etiquetaOriginal) {
  const original =
    String(etiquetaOriginal || '').trim() || 'No especificado';

  const texto = original
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (texto.includes('AMA DE CASA')) return 'Hogar';
  if (texto.includes('ESTUDIANTE')) return 'Estudiante';
  if (texto.includes('NO TRABAJA')) return 'No trabaja';
  if (texto.includes('NO APLICA')) return 'No aplica';

  if (
    texto.includes('COMERCIANTES') ||
    texto.includes('AGENTES DE VENTAS') ||
    texto.includes('EMPLEADOS DE COMERCIO')
  ) {
    return 'Comercio y ventas';
  }

  if (
    texto.includes('AGRICOL') ||
    texto.includes('GANADER') ||
    texto.includes('SILVIC') ||
    texto.includes('CAZA') ||
    texto.includes('PESCA')
  ) {
    return 'Agropecuario';
  }

  if (
    texto.includes('AYUDANTES') ||
    texto.includes('PEONES')
  ) {
    return 'Ayudantes y peones';
  }

  if (
    texto.includes('OTROS') &&
    (
      texto.includes('EMPLEADOS') ||
      texto.includes('TRABAJADORES')
    )
  ) {
    return 'Otros empleos';
  }

  if (texto.includes('PROFESION')) return 'Profesionistas';
  if (texto.includes('TECNIC')) return 'Técnicos';
  if (texto.includes('EDUCACION')) return 'Educación';

  if (
    texto.includes('FUNCIONARIOS') ||
    texto.includes('DIRECTIVOS')
  ) {
    return 'Directivos';
  }

  if (
    texto.includes('ARTESAN') ||
    texto.includes('FABRICACION') ||
    texto.includes('INDUSTRIAL')
  ) {
    return 'Manufactura';
  }

  if (
    texto.includes('OPERADORES') ||
    texto.includes('MAQUINARIA')
  ) {
    return 'Operadores';
  }

  if (
    texto.includes('SERVICIOS PERSONALES') ||
    texto.includes('SERVICIOS DIVERSOS')
  ) {
    return 'Servicios';
  }

  if (
    texto.includes('PROTECCION') ||
    texto.includes('VIGILANCIA')
  ) {
    return 'Seguridad';
  }

  if (
    texto.includes('DOMESTIC')
  ) {
    return 'Trabajo doméstico';
  }

  if (original.length <= 28) return original;

  return `${original.slice(0, 25).trim()}…`;
}

function filtrarPorLlave(
  rows,
  edad,
  mes,
  entidad,
  unidad,
  idsUnidadesEntidad
) {
  return rows.filter((item) => {
    if (edad && !edadCoincide(item.edad, edad)) return false;
    if (mes && Number(item.mes) !== Number(mes)) return false;

    if (
      entidad &&
      idsUnidadesEntidad &&
      !idsUnidadesEntidad.has(Number(item.unidad_id))
    ) {
      return false;
    }

    if (unidad && Number(item.unidad_id) !== Number(unidad)) {
      return false;
    }

    return true;
  });
}

function FilterStrip({
  gruposEdad,
  meses,
  entidades,
  unidadesFiltradas,
  edad,
  mes,
  entidad,
  unidad,
  setEdad,
  setMes,
  cambiarEntidad,
  setUnidad,
  limpiarFiltros,
  kpiSinInconsistencias,
}) {
  return (
    <div className="shared-filter-strip">
      <div className="shared-filters">
        <div className="filter-group">
          <label htmlFor="entidad">Entidad</label>

          <select
            id="entidad"
            value={entidad}
            onChange={cambiarEntidad}
          >
            <option value="">Todas</option>

            {entidades.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="unidad">Unidad centinela</label>

          <select
            id="unidad"
            value={unidad}
            onChange={(event) => setUnidad(event.target.value)}
          >
            <option value="">Todas</option>

            {unidadesFiltradas.map((item) => (
              <option key={item.unidad_id} value={item.unidad_id}>
                {item.unidad}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="mes">Mes</label>

          <select
            id="mes"
            value={mes}
            onChange={(event) => setMes(event.target.value)}
          >
            <option value="">Todos</option>

            {meses.map((item) => (
              <option key={item.mes} value={item.mes}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="edad">Edad</label>

          <select
            id="edad"
            value={edad}
            onChange={(event) => setEdad(event.target.value)}
          >
            <option value="">Todas</option>

            {gruposEdad.map((grupo) => (
              <optgroup key={grupo.label} label={grupo.label}>
                {grupo.opciones.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <button
          className="clear-filters"
          type="button"
          onClick={limpiarFiltros}
        >
          Limpiar
        </button>
      </div>

      <div className="shared-kpi">
        <div className="shared-kpi-value">
          {Number.isFinite(Number(kpiSinInconsistencias))
            ? Number(kpiSinInconsistencias).toLocaleString('es-MX')
            : '—'}
        </div>

        <div className="shared-kpi-label">
          Cuestionarios
          <br />
          Registrados sin
          <br />
          inconsistencias
        </div>
      </div>
    </div>
  );
}

function EvaluationFilterStrip({
  meses,
  entidades,
  unidadesFiltradas,
  mes,
  entidad,
  unidad,
  setMes,
  cambiarEntidad,
  setUnidad,
  limpiarFiltros,
  cuestionariosRegistrados,
  cuestionariosSinInconsistencias,
}) {
  return (
    <div className="evaluation-filter-strip">
      <div className="evaluation-filters">
        <div className="filter-group">
          <label htmlFor="eval-entidad">Entidad</label>

          <select
            id="eval-entidad"
            value={entidad}
            onChange={cambiarEntidad}
          >
            <option value="">Todas</option>

            {entidades.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="eval-unidad">Unidad centinela</label>

          <select
            id="eval-unidad"
            value={unidad}
            onChange={(event) => setUnidad(event.target.value)}
          >
            <option value="">Todas</option>

            {unidadesFiltradas.map((item) => (
              <option key={item.unidad_id} value={item.unidad_id}>
                {item.unidad}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="eval-mes">Mes</label>

          <select
            id="eval-mes"
            value={mes}
            onChange={(event) => setMes(event.target.value)}
          >
            <option value="">Todos</option>

            {meses.map((item) => (
              <option key={item.mes} value={item.mes}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          className="clear-filters"
          type="button"
          onClick={limpiarFiltros}
        >
          Limpiar
        </button>
      </div>

      <div className="evaluation-top-kpis">
        <div className="evaluation-top-kpi">
          <div className="evaluation-top-kpi-value">
            {Number(cuestionariosRegistrados || 0).toLocaleString('es-MX')}
          </div>

          <div className="evaluation-top-kpi-label">
            Cuestionarios
            <br />
            registrados
          </div>
        </div>

        <div className="evaluation-top-kpi">
          <div className="evaluation-top-kpi-value">
            {Number(cuestionariosSinInconsistencias || 0).toLocaleString(
              'es-MX'
            )}
          </div>

          <div className="evaluation-top-kpi-label">
            Cuestionarios
            <br />
            registrados sin
            <br />
            inconsistencias
          </div>
        </div>
      </div>
    </div>
  );
}

function EvaluationUnitBars({
  items,
  field,
  color,
  emptyMessage = 'Sin información evaluable para la selección.',
}) {
  const validItems = items.filter((item) =>
    Number.isFinite(item[field])
  );

  if (validItems.length === 0) {
    return (
      <div className="evaluation-bars-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="evaluation-unit-bars">
      {validItems.map((item) => {
        const valor = Math.max(
          0,
          Math.min(100, Number(item[field]) || 0)
        );

        return (
          <div
            className="evaluation-unit-bar-row"
            key={`${field}-${item.unidad_id}`}
          >
            <div
              className="evaluation-unit-name"
              title={item.unidad}
            >
              {item.unidad}
            </div>

            <div className="evaluation-unit-track">
              <div
                className="evaluation-unit-fill"
                style={{
                  width: `${valor}%`,
                  background: color,
                }}
              ></div>
            </div>

            <strong>
              {valor.toFixed(1)}%
            </strong>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBars({ items, variant = 'burgundy' }) {
  const max = Math.max(
    1,
    ...items.map((item) =>
      Number.isFinite(item.valor) ? item.valor : 0
    )
  );

  return (
    <div className={`horizontal-bars horizontal-bars-${variant}`}>
      {items.map((item) => (
        <div className="bar-row" key={item.etiqueta}>
          <div className="bar-label">{item.etiqueta}</div>

          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.max(
                  0,
                  ((item.valor || 0) / max) * 100
                )}%`,
              }}
            ></div>
          </div>

          <div className="bar-value">
            {formatoPorcentaje(item.valor, 1)}
          </div>
        </div>
      ))}
    </div>
  );
}

function PregnancyIcon() {
  return (
    <svg
      className="pregnancy-icon-svg"
      viewBox="0 0 96 96"
      role="img"
      aria-label="Embarazo"
    >
      <circle cx="49" cy="18" r="10" fill="#701039" />
      <path
        d="M43 30c-8 4-13 13-13 25v19c0 5 4 9 9 9h7V62c0-2 2-4 4-4s4 2 4 4v21h7c5 0 9-4 9-9V58c0-14-7-25-18-29-3-1-6-1-9 1Z"
        fill="#173f3a"
      />
      <circle cx="59" cy="51" r="15" fill="#b38c2e" />
      <path
        d="M51 48c5-4 12-3 16 2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="62" cy="50" r="2.8" fill="#ffffff" />
      <path
        d="M42 38c-5 5-8 13-8 22"
        fill="none"
        stroke="#701039"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PregnancySummaryCard({ valor }) {
  return (
    <div className="social-summary-card proposal-summary-card pregnancy-summary-card">
      <div className="generic-social-icon pregnancy-social-icon">
        <PregnancyIcon />
      </div>

      <div className="social-summary-copy">
        <strong>{formatoPorcentaje(valor, 1)}</strong>
        <span>Se encuentran embarazadas</span>
      </div>
    </div>
  );
}

const AJUSTES_VISUALES_20260817 = `
  /* Ajustes solicitados 17-08-2026 */
  .sidebar-menu .menu-item img {
    width: 60px !important;
    height: 60px !important;
    min-width: 60px !important;
    object-fit: contain !important;
    transform: scale(1.22);
    transform-origin: center center;
    display: block;
  }

  .sidebar-menu .menu-item {
    min-height: 84px;
    gap: 18px;
    padding: 14px 18px;
    overflow: visible;
  }


  .ihos-reference {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: flex-start !important;
    text-align: left !important;
    gap: 5px !important;
    padding: 14px 22px !important;
    white-space: normal !important;
  }

  .ihos-reference > strong,
  .ihos-reference > span {
    display: block !important;
    margin: 0 !important;
    width: 100% !important;
    line-height: 1.25 !important;
    text-align: left !important;
  }

  .proposal-summary-card {
    background: #ffffff !important;
    border-radius: 16px !important;
    border: 1px solid rgba(23, 63, 58, 0.08) !important;
    box-shadow: 0 7px 18px rgba(30, 48, 55, 0.10) !important;
  }

  .pregnancy-social-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .pregnancy-icon-svg {
    width: 100%;
    height: 100%;
    max-width: 72px;
    max-height: 72px;
    display: block;
  }

  .proposal-bars-section {
    background: #ffffff !important;
    border-radius: 18px !important;
    border: 1px solid rgba(23, 63, 58, 0.07) !important;
    box-shadow: 0 9px 22px rgba(34, 51, 59, 0.12) !important;
    padding: 18px 20px !important;
  }

  .proposal-bars-section .bar-track,
  .proposal-bars-section .bar-fill {
    border-radius: 999px !important;
  }

  .proposal-bars-section .bar-track {
    overflow: hidden;
  }

  .periodontal-reference {
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: flex-start !important;
    text-align: left !important;
    gap: 5px !important;
  }

  .periodontal-reference > strong,
  .periodontal-reference > span {
    width: 100% !important;
    text-align: left !important;
  }

  .top-header-logos .logo-coordinacion,
  .top-header-logos .logo-vigilancia {
    width: 170px !important;
    height: 68px !important;
    max-width: 170px !important;
    max-height: 68px !important;
    object-fit: contain !important;
  }

  .lesiones-no-lesion-note {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px solid rgba(23, 63, 58, 0.14);
    color: #46545a;
    font-size: 0.9rem;
    line-height: 1.4;
    font-style: italic;
  }

  .lesiones-no-lesion-note strong {
    color: #701039;
    font-style: normal;
  }
`;

function App() {
  const [catalogos, setCatalogos] = useState(null);
  const [mapa, setMapa] = useState([]);
  const [resumenNacional, setResumenNacional] = useState(null);
  const [cariesData, setCariesData] = useState(null);
  const [higieneData, setHigieneData] = useState(null);
  const [periodontalData, setPeriodontalData] = useState(null);
  const [otrasData, setOtrasData] = useState(null);
  const [evaluacionData, setEvaluacionData] = useState(null);
  const [kpiFiltrosData, setKpiFiltrosData] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');

  const [vista, setVista] = useState('inicio');

  const [edad, setEdad] = useState('');
  const [mes, setMes] = useState('');
  const [entidad, setEntidad] = useState('');
  const [unidad, setUnidad] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/data/sivepab_catalogos_v2.json').then((response) => {
        if (!response.ok) {
          throw new Error('No fue posible cargar sivepab_catalogos_v2.json');
        }
        return response.json();
      }),
      fetch('/data/sivepab_mapa_v2.json').then((response) => {
        if (!response.ok) {
          throw new Error('No fue posible cargar sivepab_mapa_v2.json');
        }
        return response.json();
      }),
      fetch('/data/sivepab_resumen_nacional_v2.json').then((response) => {
        if (!response.ok) {
          throw new Error(
            'No fue posible cargar sivepab_resumen_nacional_v2.json'
          );
        }
        return response.json();
      }),
      fetch('/data/sivepab_kpi_filtros.json').then((response) => {
        if (!response.ok) {
          throw new Error(
            'No fue posible cargar sivepab_kpi_filtros.json'
          );
        }
        return response.json();
      }),
    ])
      .then(([catalogosData, mapaData, resumenData, kpiData]) => {
        setCatalogos(catalogosData);
        setMapa(Array.isArray(mapaData) ? mapaData : []);
        setResumenNacional(resumenData);
        setKpiFiltrosData({
          ...kpiData,
          kpiDecoded: decodeColumnarDataset(kpiData.kpi),
        });
        setErrorCarga('');
      })
      .catch((error) => {
        console.error(error);
        setErrorCarga(error.message);
      });
  }, []);

  useEffect(() => {
    if (vista !== 'caries' || cariesData) return;

    fetch('/data/sivepab_caries.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('No fue posible cargar sivepab_caries.json');
        }
        return response.json();
      })
      .then((data) => {
        setCariesData({
          ...data,
          coreDecoded: decodeColumnarDataset(data.core),
          sexoDecoded: decodeColumnarDataset(data.sexo),
          antecedentesDecoded: decodeColumnarDataset(data.antecedentes),
          ocupacionDecoded: decodeColumnarDataset(data.ocupacion),
          socialDecoded: decodeColumnarDataset(data.social),
        });
        setErrorCarga('');
      })
      .catch((error) => {
        console.error(error);
        setErrorCarga(error.message);
      });
  }, [vista, cariesData]);

  useEffect(() => {
    if (vista !== 'higiene' || higieneData) return;

    fetch('/data/sivepab_higiene.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('No fue posible cargar sivepab_higiene.json');
        }
        return response.json();
      })
      .then((data) => {
        setHigieneData({
          ...data,
          coreDecoded: decodeColumnarDataset(data.core),
          sexoDecoded: decodeColumnarDataset(data.sexo),
          antecedentesDecoded: decodeColumnarDataset(data.antecedentes),
          ocupacionDecoded: decodeColumnarDataset(data.ocupacion),
          socialDecoded: decodeColumnarDataset(data.social),
        });
        setErrorCarga('');
      })
      .catch((error) => {
        console.error(error);
        setErrorCarga(error.message);
      });
  }, [vista, higieneData]);

  useEffect(() => {
    if (vista !== 'periodontal' || periodontalData) return;

    fetch('/data/sivepab_periodontal.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            'No fue posible cargar sivepab_periodontal.json'
          );
        }
        return response.json();
      })
      .then((data) => {
        setPeriodontalData({
          ...data,
          coreDecoded: decodeColumnarDataset(data.core),
          sexoDecoded: decodeColumnarDataset(data.sexo),
          antecedentesDecoded: decodeColumnarDataset(data.antecedentes),
          ocupacionDecoded: decodeColumnarDataset(data.ocupacion),
          socialDecoded: decodeColumnarDataset(data.social),
        });
        setErrorCarga('');
      })
      .catch((error) => {
        console.error(error);
        setErrorCarga(error.message);
      });
  }, [vista, periodontalData]);

  useEffect(() => {
    if (vista !== 'otras' || otrasData) return;

    fetch('/data/sivepab_otras_patologias.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            'No fue posible cargar sivepab_otras_patologias.json'
          );
        }
        return response.json();
      })
      .then((data) => {
        setOtrasData({
          ...data,
          coreDecoded: decodeColumnarDataset(data.core),
          sexoDecoded: decodeColumnarDataset(data.sexo),
          antecedentesDecoded: decodeColumnarDataset(data.antecedentes),
          ocupacionDecoded: decodeColumnarDataset(data.ocupacion),
          socialDecoded: decodeColumnarDataset(data.social),
          codigosDecoded: decodeColumnarDataset(data.codigos),
        });
        setErrorCarga('');
      })
      .catch((error) => {
        console.error(error);
        setErrorCarga(error.message);
      });
  }, [vista, otrasData]);

  useEffect(() => {
    if (vista !== 'evaluacion' || evaluacionData) return;

    fetch('/data/sivepab_evaluacion.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            'No fue posible cargar sivepab_evaluacion.json'
          );
        }

        return response.json();
      })
      .then((data) => {
        setEvaluacionData({
          ...data,
          unidadesDecoded: decodeColumnarDataset(data.unidades),
          evaluacionDecoded: decodeColumnarDataset(data.evaluacion),
        });

        setErrorCarga('');
      })
      .catch((error) => {
        console.error(error);
        setErrorCarga(error.message);
      });
  }, [vista, evaluacionData]);

  useEffect(() => {
    if (vista === 'evaluacion' && edad) {
      setEdad('');
    }
  }, [vista, edad]);

  const edades = catalogos?.filtros?.edades || [];
  const meses = catalogos?.filtros?.meses || [];
  const unidadesCatalogo = catalogos?.filtros?.unidades || [];

  const gruposEdad = useMemo(
    () => construirGruposEdad(vista, edades),
    [vista, edades]
  );

  const valoresEdadPermitidos = useMemo(
    () =>
      new Set(
        gruposEdad.flatMap((grupo) =>
          grupo.opciones.map((item) => String(item.value))
        )
      ),
    [gruposEdad]
  );

  useEffect(() => {
    if (
      vista !== 'evaluacion' &&
      edad &&
      !valoresEdadPermitidos.has(String(edad))
    ) {
      setEdad('');
    }
  }, [vista, edad, valoresEdadPermitidos]);

  const entidades = useMemo(() => {
    return [...new Set(unidadesCatalogo.map((item) => item.entidad))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'es'));
  }, [unidadesCatalogo]);

  const unidadesFiltradas = useMemo(() => {
    const base = entidad
      ? unidadesCatalogo.filter((item) => item.entidad === entidad)
      : unidadesCatalogo;

    return [...base].sort((a, b) =>
      String(a.unidad).localeCompare(String(b.unidad), 'es')
    );
  }, [unidadesCatalogo, entidad]);

  const idsUnidadesEntidad = useMemo(() => {
    if (!entidad) return null;

    return new Set(
      unidadesCatalogo
        .filter((item) => item.entidad === entidad)
        .map((item) => Number(item.unidad_id))
    );
  }, [unidadesCatalogo, entidad]);

  const puntosMapa = useMemo(() => {
    let resultado = mapa;

    if (entidad) {
      resultado = resultado.filter((item) => item.entidad === entidad);
    }

    if (unidad) {
      resultado = resultado.filter(
        (item) => String(item.unidad_id) === String(unidad)
      );
    }

    return resultado.filter(
      (item) =>
        Number.isFinite(Number(item.lat)) &&
        Number.isFinite(Number(item.lon))
    );
  }, [mapa, entidad, unidad]);

  const cariesFiltrada = useMemo(
    () =>
      filtrarPorLlave(
        cariesData?.coreDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [cariesData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const sexoFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        cariesData?.sexoDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [cariesData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const antecedentesFiltrados = useMemo(
    () =>
      filtrarPorLlave(
        cariesData?.antecedentesDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [cariesData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const ocupacionFiltrada = useMemo(
    () =>
      filtrarPorLlave(
        cariesData?.ocupacionDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [cariesData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const socialFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        cariesData?.socialDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [cariesData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const higieneCoreFiltrada = useMemo(
    () =>
      filtrarPorLlave(
        higieneData?.coreDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [higieneData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const higieneSexoFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        higieneData?.sexoDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [higieneData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const higieneAntecedentesFiltrados = useMemo(
    () =>
      filtrarPorLlave(
        higieneData?.antecedentesDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [higieneData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const higieneOcupacionFiltrada = useMemo(
    () =>
      filtrarPorLlave(
        higieneData?.ocupacionDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [higieneData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const higieneSocialFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        higieneData?.socialDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [higieneData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const periodontalCoreFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        periodontalData?.coreDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [periodontalData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const periodontalSexoFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        periodontalData?.sexoDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [periodontalData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const periodontalAntecedentesFiltrados = useMemo(
    () =>
      filtrarPorLlave(
        periodontalData?.antecedentesDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [periodontalData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const periodontalOcupacionFiltrada = useMemo(
    () =>
      filtrarPorLlave(
        periodontalData?.ocupacionDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [periodontalData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const periodontalSocialFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        periodontalData?.socialDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [periodontalData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const otrasCoreFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        otrasData?.coreDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [otrasData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const otrasSexoFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        otrasData?.sexoDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [otrasData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const otrasAntecedentesFiltrados = useMemo(
    () =>
      filtrarPorLlave(
        otrasData?.antecedentesDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [otrasData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const otrasOcupacionFiltrada = useMemo(
    () =>
      filtrarPorLlave(
        otrasData?.ocupacionDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [otrasData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const otrasSocialFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        otrasData?.socialDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [otrasData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const otrasCodigosFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        otrasData?.codigosDecoded || [],
        edad,
        mes,
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [otrasData, edad, mes, entidad, unidad, idsUnidadesEntidad]
  );

  const indicadoresCaries = useMemo(() => {
    if (!cariesData) {
      return {
        cpod: null,
        CPOD: null,
        librePct: null,
        cariesPct: null,
        sanosPct: null,
        edentPct: null,
      };
    }

    const cpodN = sumar(cariesFiltrada, 'cpod_N');
    const cpodSum = sumar(cariesFiltrada, 'cpod_sum');

    let CPODN = 0;
    let CPODSum = 0;

    if (edad) {
      const edadNum = Number(edad);

      if (edadNum === 6) {
        CPODN = sumar(cariesFiltrada, 'CPOD6_N');
        CPODSum = sumar(cariesFiltrada, 'CPOD6_sum');
      } else if (edadNum >= 7 && edadNum <= 13) {
        CPODN = sumar(cariesFiltrada, 'CPOD713_N');
        CPODSum = sumar(cariesFiltrada, 'CPOD713_sum');
      } else if (edadNum >= 14) {
        CPODN = sumar(cariesFiltrada, 'CPOD14_N');
        CPODSum = sumar(cariesFiltrada, 'CPOD14_sum');
      }
    } else {
      CPODN = sumar(cariesFiltrada, 'CPOD14_N');
      CPODSum = sumar(cariesFiltrada, 'CPOD14_sum');
    }

    const libreN = sumar(cariesFiltrada, 'libre_N');
    const libreNume = sumar(cariesFiltrada, 'libre_n');

    const carN = sumar(cariesFiltrada, 'car_N');
    const carNume = sumar(cariesFiltrada, 'car_n');

    const edentN = sumar(cariesFiltrada, 'edent_N');
    const edentNume = sumar(cariesFiltrada, 'edent_n');

    const cariesPct = porcentaje(carNume, carN);

    return {
      cpod: cpodN > 0 ? cpodSum / cpodN : null,
      CPOD: CPODN > 0 ? CPODSum / CPODN : null,
      librePct: porcentaje(libreNume, libreN),
      cariesPct,
      sanosPct:
        cariesPct === null ? null : Math.max(0, 100 - cariesPct),
      edentPct: porcentaje(edentNume, edentN),
    };
  }, [cariesData, cariesFiltrada, edad]);

  const indicadoresSociales = useMemo(() => {
    const migranteN = sumar(socialFiltrado, 'migrante_N');
    const migranteNume = sumar(socialFiltrado, 'migrante_n');

    const indigenaN = sumar(socialFiltrado, 'indigena_N');
    const indigenaNume = sumar(socialFiltrado, 'indigena_n');

    return {
      migrantePct: porcentaje(migranteNume, migranteN),
      indigenaPct: porcentaje(indigenaNume, indigenaN),
    };
  }, [socialFiltrado]);

  const sexoData = useMemo(() => {
    const porSexo = {};

    sexoFiltrado.forEach((item) => {
      const clave = String(item.sexo || '').trim() || 'No especificado';
      porSexo[clave] = (porSexo[clave] || 0) + (Number(item.n) || 0);
    });

    const total = Object.values(porSexo).reduce(
      (acum, valor) => acum + valor,
      0
    );

    const items = Object.entries(porSexo)
      .map(([etiqueta, n]) => ({
        etiqueta,
        n,
        valor: porcentaje(n, total),
      }))
      .sort((a, b) => b.n - a.n);

    return { total, items };
  }, [sexoFiltrado]);

  const antecedentesData = useMemo(() => {
    const N = sumar(antecedentesFiltrados, 'N');

    return ANTECEDENTES.map((item) => ({
      etiqueta: item.etiqueta,
      valor: porcentaje(
        sumar(antecedentesFiltrados, item.campo),
        N
      ),
    })).filter((item) => item.valor !== null);
  }, [antecedentesFiltrados]);

  const embarazoPct = useMemo(() => {
    const N = sumar(antecedentesFiltrados, 'N');
    return porcentaje(sumar(antecedentesFiltrados, 'embarazo'), N);
  }, [antecedentesFiltrados]);

  const ocupacionData = useMemo(() => {
    const acumulado = {};

    ocupacionFiltrada.forEach((item) => {
      const etiqueta = acortarOcupacion(
        item.ocupacion
      );

      acumulado[etiqueta] =
        (acumulado[etiqueta] || 0) + (Number(item.n) || 0);
    });

    const total = Object.values(acumulado).reduce(
      (acum, valor) => acum + valor,
      0
    );

    return Object.entries(acumulado)
      .map(([etiqueta, n]) => ({
        etiqueta,
        n,
        valor: porcentaje(n, total),
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
      .sort((a, b) => a.valor - b.valor);
  }, [ocupacionFiltrada]);

  const indicadoresHigiene = useMemo(() => {
    const N = sumar(higieneCoreFiltrada, 'IHOS_N');
    const suma = sumar(higieneCoreFiltrada, 'IHOS_sum');

    const excelente = sumar(higieneCoreFiltrada, 'excelente');
    const buena = sumar(higieneCoreFiltrada, 'buena');
    const regular = sumar(higieneCoreFiltrada, 'regular');
    const mala = sumar(higieneCoreFiltrada, 'mala');

    return {
      N,
      media: N > 0 ? suma / N : null,
      excelentePct: porcentaje(excelente, N),
      buenaPct: porcentaje(buena, N),
      regularPct: porcentaje(regular, N),
      malaPct: porcentaje(mala, N),
    };
  }, [higieneCoreFiltrada]);

  const higieneSociales = useMemo(() => {
    const migranteN = sumar(higieneSocialFiltrado, 'migrante_N');
    const migranteNume = sumar(higieneSocialFiltrado, 'migrante_n');

    const indigenaN = sumar(higieneSocialFiltrado, 'indigena_N');
    const indigenaNume = sumar(higieneSocialFiltrado, 'indigena_n');

    return {
      migrantePct: porcentaje(migranteNume, migranteN),
      indigenaPct: porcentaje(indigenaNume, indigenaN),
    };
  }, [higieneSocialFiltrado]);

  const higieneSexoData = useMemo(() => {
    const porSexo = {};

    higieneSexoFiltrado.forEach((item) => {
      const clave = String(item.sexo || '').trim() || 'No especificado';
      porSexo[clave] = (porSexo[clave] || 0) + (Number(item.n) || 0);
    });

    const total = Object.values(porSexo).reduce(
      (acum, valor) => acum + valor,
      0
    );

    const items = Object.entries(porSexo)
      .map(([etiqueta, n]) => ({
        etiqueta,
        n,
        valor: porcentaje(n, total),
      }))
      .sort((a, b) => b.n - a.n);

    return { total, items };
  }, [higieneSexoFiltrado]);


  const higieneSexoPieStyle = useMemo(() => {
    if (!higieneSexoData.items.length) {
      return { background: '#e7e7e7' };
    }

    const colores = ['#701039', '#173f3a', '#b38c2e', '#8b8b8b'];
    let inicio = 0;

    const segmentos = higieneSexoData.items.map((item, index) => {
      const fin = inicio + (item.valor || 0);
      const segmento = `${colores[index % colores.length]} ${inicio}% ${fin}%`;
      inicio = fin;
      return segmento;
    });

    return {
      background: `conic-gradient(${segmentos.join(', ')})`,
    };
  }, [higieneSexoData]);

  const higieneAntecedentesData = useMemo(() => {
    const N = sumar(higieneAntecedentesFiltrados, 'N');

    return ANTECEDENTES.map((item) => ({
      etiqueta: item.etiqueta,
      valor: porcentaje(
        sumar(higieneAntecedentesFiltrados, item.campo),
        N
      ),
    })).filter((item) => item.valor !== null);
  }, [higieneAntecedentesFiltrados]);

  const higieneEmbarazoPct = useMemo(() => {
    const N = sumar(higieneAntecedentesFiltrados, 'N');
    return porcentaje(
      sumar(higieneAntecedentesFiltrados, 'embarazo'),
      N
    );
  }, [higieneAntecedentesFiltrados]);

  const higieneOcupacionData = useMemo(() => {
    const acumulado = {};

    higieneOcupacionFiltrada.forEach((item) => {
      const etiqueta = acortarOcupacion(
        item.ocupacion
      );

      acumulado[etiqueta] =
        (acumulado[etiqueta] || 0) + (Number(item.n) || 0);
    });

    const total = Object.values(acumulado).reduce(
      (acum, valor) => acum + valor,
      0
    );

    return Object.entries(acumulado)
      .map(([etiqueta, n]) => ({
        etiqueta,
        n,
        valor: porcentaje(n, total),
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
      .sort((a, b) => a.valor - b.valor);
  }, [higieneOcupacionFiltrada]);

  const higieneColores = [
    '#173f3a',
    '#b38c2e',
    '#701039',
    '#8b8b8b',
  ];

  const higienePieStyle = (() => {
    const segmentosDatos = [
      indicadoresHigiene.excelentePct,
      indicadoresHigiene.buenaPct,
      indicadoresHigiene.regularPct,
      indicadoresHigiene.malaPct,
    ];

    if (!segmentosDatos.some((valor) => Number.isFinite(valor))) {
      return { background: '#e7e7e7' };
    }

    let inicio = 0;

    const segmentos = segmentosDatos.map((valor, index) => {
      const pct = Number.isFinite(valor) ? valor : 0;
      const fin = inicio + pct;
      const segmento =
        `${higieneColores[index]} ${inicio}% ${fin}%`;
      inicio = fin;
      return segmento;
    });

    return {
      background: `conic-gradient(${segmentos.join(', ')})`,
    };
  })();

  const higieneSegmentos = useMemo(() => {
    const base = [
      {
        etiqueta: 'Excelente',
        valor: indicadoresHigiene.excelentePct,
        color: higieneColores[0],
      },
      {
        etiqueta: 'Buena',
        valor: indicadoresHigiene.buenaPct,
        color: higieneColores[1],
      },
      {
        etiqueta: 'Regular',
        valor: indicadoresHigiene.regularPct,
        color: higieneColores[2],
      },
      {
        etiqueta: 'Mala',
        valor: indicadoresHigiene.malaPct,
        color: higieneColores[3],
      },
    ].filter((item) => Number.isFinite(item.valor) && item.valor > 0);

    let acumulado = 0;

    return base.map((item) => {
      const inicio = acumulado;
      const fin = acumulado + item.valor;
      const medio = (inicio + fin) / 2;
      acumulado = fin;

      const angle = medio * 3.6 - 90;
      const rad = (angle * Math.PI) / 180;

      const esPequeno = item.valor < 8;
      const radio = esPequeno ? 108 : 63;

      return {
        ...item,
        esPequeno,
        x: Math.cos(rad) * radio,
        y: Math.sin(rad) * radio,
        lado: Math.cos(rad) >= 0 ? 'derecha' : 'izquierda',
      };
    });
  }, [
    indicadoresHigiene.excelentePct,
    indicadoresHigiene.buenaPct,
    indicadoresHigiene.regularPct,
    indicadoresHigiene.malaPct,
  ]);

  const periodontalEdad7a14 = useMemo(() => {
    if (!edad) return false;

    const valor = Number(edad);

    return (
      Number.isFinite(valor) &&
      valor >= 7 &&
      valor <= 14
    );
  }, [edad]);

  const indicadoresPeriodontal = useMemo(() => {
    const N = sumar(periodontalCoreFiltrado, 'ipc_N');

    return {
      N,
      sanoPct: porcentaje(sumar(periodontalCoreFiltrado, 'ipc_sano'), N),
      hemPct: porcentaje(sumar(periodontalCoreFiltrado, 'ipc_hem'), N),
      calcPct: porcentaje(sumar(periodontalCoreFiltrado, 'ipc_calc'), N),
      b45Pct: porcentaje(sumar(periodontalCoreFiltrado, 'ipc_b45'), N),
      b6Pct: porcentaje(sumar(periodontalCoreFiltrado, 'ipc_b6'), N),
    };
  }, [periodontalCoreFiltrado]);

  const periodontalSociales = useMemo(() => {
    const migranteN = sumar(periodontalSocialFiltrado, 'migrante_N');
    const migranteNume = sumar(periodontalSocialFiltrado, 'migrante_n');
    const indigenaN = sumar(periodontalSocialFiltrado, 'indigena_N');
    const indigenaNume = sumar(periodontalSocialFiltrado, 'indigena_n');

    return {
      migrantePct: porcentaje(migranteNume, migranteN),
      indigenaPct: porcentaje(indigenaNume, indigenaN),
    };
  }, [periodontalSocialFiltrado]);

  const periodontalSexoData = useMemo(() => {
    const porSexo = {};

    periodontalSexoFiltrado.forEach((item) => {
      const clave = String(item.sexo || '').trim() || 'No especificado';
      porSexo[clave] = (porSexo[clave] || 0) + (Number(item.n) || 0);
    });

    const total = Object.values(porSexo).reduce((a, b) => a + b, 0);

    return {
      total,
      items: Object.entries(porSexo)
        .map(([etiqueta, n]) => ({
          etiqueta,
          n,
          valor: porcentaje(n, total),
        }))
        .sort((a, b) => b.n - a.n),
    };
  }, [periodontalSexoFiltrado]);

  const periodontalAntecedentesData = useMemo(() => {
    const N = sumar(periodontalAntecedentesFiltrados, 'N');

    return ANTECEDENTES.map((item) => ({
      etiqueta: item.etiqueta,
      valor: porcentaje(
        sumar(periodontalAntecedentesFiltrados, item.campo),
        N
      ),
    })).filter((item) => item.valor !== null);
  }, [periodontalAntecedentesFiltrados]);

  const periodontalEmbarazoPct = useMemo(() => {
    const N = sumar(periodontalAntecedentesFiltrados, 'N');
    return porcentaje(
      sumar(periodontalAntecedentesFiltrados, 'embarazo'),
      N
    );
  }, [periodontalAntecedentesFiltrados]);

  const periodontalOcupacionData = useMemo(() => {
    const acumulado = {};

    periodontalOcupacionFiltrada.forEach((item) => {
      const etiqueta = acortarOcupacion(
        item.ocupacion
      );
      acumulado[etiqueta] =
        (acumulado[etiqueta] || 0) + (Number(item.n) || 0);
    });

    const total = Object.values(acumulado).reduce((a, b) => a + b, 0);

    return Object.entries(acumulado)
      .map(([etiqueta, n]) => ({
        etiqueta,
        n,
        valor: porcentaje(n, total),
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
      .sort((a, b) => a.valor - b.valor);
  }, [periodontalOcupacionFiltrada]);

  const periodontalColores = [
    '#173f3a',
    '#b38c2e',
    '#701039',
    '#8f6a56',
    '#8b8b8b',
  ];

  const periodontalSegmentos = useMemo(() => {
    const categoriasBase = [
      ['Sano', indicadoresPeriodontal.sanoPct, periodontalColores[0]],
      ['Hemorragia', indicadoresPeriodontal.hemPct, periodontalColores[1]],
      ['Cálculo', indicadoresPeriodontal.calcPct, periodontalColores[2]],
    ];

    if (!periodontalEdad7a14) {
      categoriasBase.push(
        [
          'Bolsa de 4-5 mm',
          indicadoresPeriodontal.b45Pct,
          periodontalColores[3],
        ],
        [
          'Bolsa ≥ 6 mm',
          indicadoresPeriodontal.b6Pct,
          periodontalColores[4],
        ]
      );
    }

    const base = categoriasBase
      .map(([etiqueta, valor, color]) => ({ etiqueta, valor, color }))
      .filter((item) => Number.isFinite(item.valor) && item.valor > 0);

    let acumulado = 0;

    return base.map((item) => {
      const inicio = acumulado;
      const fin = acumulado + item.valor;
      const medio = (inicio + fin) / 2;
      acumulado = fin;

      const rad = ((medio * 3.6 - 90) * Math.PI) / 180;
      const esPequeno = item.valor < 4;
      const radio = 77;

      return {
        ...item,
        inicio,
        fin,
        esPequeno,
        x: Math.cos(rad) * radio,
        y: Math.sin(rad) * radio,
      };
    });
  }, [
    indicadoresPeriodontal.sanoPct,
    indicadoresPeriodontal.hemPct,
    indicadoresPeriodontal.calcPct,
    indicadoresPeriodontal.b45Pct,
    indicadoresPeriodontal.b6Pct,
    periodontalEdad7a14,
  ]);

  const periodontalPieStyle = periodontalSegmentos.length
    ? {
        background: `conic-gradient(${periodontalSegmentos
          .map((item) => `${item.color} ${item.inicio}% ${item.fin}%`)
          .join(', ')})`,
      }
    : { background: '#e7e7e7' };

  const periodontalSexoPieStyle = (() => {
    if (!periodontalSexoData.items.length) {
      return { background: '#e7e7e7' };
    }

    const colores = ['#701039', '#173f3a', '#b38c2e', '#8b8b8b'];
    let inicio = 0;

    const segmentos = periodontalSexoData.items.map((item, index) => {
      const fin = inicio + (item.valor || 0);
      const segmento = `${colores[index % colores.length]} ${inicio}% ${fin}%`;
      inicio = fin;
      return segmento;
    });

    return { background: `conic-gradient(${segmentos.join(', ')})` };
  })();

  const indicadoresOtras = useMemo(() => {
    const lesionN = sumar(otrasCoreFiltrado, 'lesion_N');
    const lesionn = sumar(otrasCoreFiltrado, 'lesion_n');

    const tiempoN = sumar(otrasCoreFiltrado, 'tiempo_N');
    const tiempoLt3 = sumar(otrasCoreFiltrado, 'tiempo_lt3');
    const tiempoGt3 = sumar(otrasCoreFiltrado, 'tiempo_gt3');

    const fluorN = sumar(otrasCoreFiltrado, 'fluor_N');
    const fluorn = sumar(otrasCoreFiltrado, 'fluor_n');

    const otraN = sumar(otrasCoreFiltrado, 'otra_N');
    const otran = sumar(otrasCoreFiltrado, 'otra_n');

    return {
      lesionN,
      lesionn,
      lesionPct: porcentaje(lesionn, lesionN),

      tiempoN,
      tiempoLt3Pct: porcentaje(tiempoLt3, tiempoN),
      tiempoGt3Pct: porcentaje(tiempoGt3, tiempoN),

      fluorN,
      fluorPct: porcentaje(fluorn, fluorN),

      otraN,
      otraPct: porcentaje(otran, otraN),

      sinLesion: Math.max(0, lesionN - lesionn),
      ulcera: sumar(otrasCoreFiltrado, 'ulcera'),
      blanca: sumar(otrasCoreFiltrado, 'blanca'),
      roja: sumar(otrasCoreFiltrado, 'roja'),
      mixta: sumar(otrasCoreFiltrado, 'mixta'),
      volumen: sumar(otrasCoreFiltrado, 'volumen'),
    };
  }, [otrasCoreFiltrado]);

  const otrasSociales = useMemo(() => {
    const migranteN = sumar(otrasSocialFiltrado, 'migrante_N');
    const migranteNume = sumar(otrasSocialFiltrado, 'migrante_n');

    const indigenaN = sumar(otrasSocialFiltrado, 'indigena_N');
    const indigenaNume = sumar(otrasSocialFiltrado, 'indigena_n');

    return {
      migrantePct: porcentaje(migranteNume, migranteN),
      indigenaPct: porcentaje(indigenaNume, indigenaN),
    };
  }, [otrasSocialFiltrado]);

  const otrasSexoData = useMemo(() => {
    const porSexo = {};

    otrasSexoFiltrado.forEach((item) => {
      const clave = String(item.sexo || '').trim() || 'No especificado';
      porSexo[clave] = (porSexo[clave] || 0) + (Number(item.n) || 0);
    });

    const total = Object.values(porSexo).reduce((a, b) => a + b, 0);

    return {
      total,
      items: Object.entries(porSexo)
        .map(([etiqueta, n]) => ({
          etiqueta,
          n,
          valor: porcentaje(n, total),
        }))
        .sort((a, b) => b.n - a.n),
    };
  }, [otrasSexoFiltrado]);

  const otrasAntecedentesData = useMemo(() => {
    const N = sumar(otrasAntecedentesFiltrados, 'N');

    return ANTECEDENTES.map((item) => ({
      etiqueta: item.etiqueta,
      valor: porcentaje(
        sumar(otrasAntecedentesFiltrados, item.campo),
        N
      ),
    })).filter((item) => item.valor !== null);
  }, [otrasAntecedentesFiltrados]);

  const otrasEmbarazoPct = useMemo(() => {
    const N = sumar(otrasAntecedentesFiltrados, 'N');
    return porcentaje(
      sumar(otrasAntecedentesFiltrados, 'embarazo'),
      N
    );
  }, [otrasAntecedentesFiltrados]);

  const otrasOcupacionData = useMemo(() => {
    const acumulado = {};

    otrasOcupacionFiltrada.forEach((item) => {
      const etiqueta = acortarOcupacion(
        item.ocupacion
      );

      acumulado[etiqueta] =
        (acumulado[etiqueta] || 0) + (Number(item.n) || 0);
    });

    const total = Object.values(acumulado).reduce((a, b) => a + b, 0);

    return Object.entries(acumulado)
      .map(([etiqueta, n]) => ({
        etiqueta,
        n,
        valor: porcentaje(n, total),
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
      .sort((a, b) => a.valor - b.valor);
  }, [otrasOcupacionFiltrada]);

  const otrasSexoPieStyle = (() => {
    if (!otrasSexoData.items.length) {
      return { background: '#e7e7e7' };
    }

    const colores = ['#701039', '#173f3a', '#b38c2e', '#8b8b8b'];
    let inicio = 0;

    const segmentos = otrasSexoData.items.map((item, index) => {
      const fin = inicio + (item.valor || 0);
      const segmento =
        `${colores[index % colores.length]} ${inicio}% ${fin}%`;
      inicio = fin;
      return segmento;
    });

    return {
      background: `conic-gradient(${segmentos.join(', ')})`,
    };
  })();

  const otrasTiempoPieStyle =
    indicadoresOtras.tiempoLt3Pct === null
      ? { background: '#e7e7e7' }
      : {
          background: `conic-gradient(
            #701039 0 ${indicadoresOtras.tiempoLt3Pct}%,
            #b38c2e ${indicadoresOtras.tiempoLt3Pct}% 100%
          )`,
        };

  const lesionesData = useMemo(
    () => [
      {
        etiqueta: 'Úlcera',
        valor: indicadoresOtras.ulcera,
        color: '#173f3a',
      },
      {
        etiqueta: 'Leucoplasia bucal',
        valor: indicadoresOtras.blanca,
        color: '#6c6c6c',
      },
      {
        etiqueta: 'Eritroplasia',
        valor: indicadoresOtras.roja,
        color: '#b38c2e',
      },
      {
        etiqueta: 'Lesión mixta',
        valor: indicadoresOtras.mixta,
        color: '#d6bd70',
      },
      {
        etiqueta: 'Aumento de volumen',
        valor: indicadoresOtras.volumen,
        color: '#d794a8',
      },
    ],
    [indicadoresOtras]
  );

  const catalogoOtrasMap = useMemo(() => {
    const mapaCatalogo = {};

    (catalogos?.otras_patologias_catalogo || []).forEach((item) => {
      const codigo = String(item.otra_patologia_codigo || '').trim();
      if (codigo) {
        mapaCatalogo[codigo] =
          String(item.descripcion || '').trim() || codigo;
      }
    });

    return mapaCatalogo;
  }, [catalogos]);

  const otrasTopDiagnosticos = useMemo(() => {
    const acumulado = {};

    otrasCodigosFiltrado.forEach((item) => {
      const codigo = String(item.otra_patologia_codigo || '').trim();
      if (!codigo) return;

      acumulado[codigo] =
        (acumulado[codigo] || 0) + (Number(item.n) || 0);
    });

    return Object.entries(acumulado)
      .map(([codigo, n]) => ({
        codigo,
        n,
        descripcion: catalogoOtrasMap[codigo] || codigo,
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
  }, [otrasCodigosFiltrado, catalogoOtrasMap]);

  const evaluacionFiltrada = useMemo(() => {
    const rows = evaluacionData?.evaluacionDecoded || [];

    return rows.filter((item) => {
      if (mes && Number(item.mes) !== Number(mes)) {
        return false;
      }

      if (
        entidad &&
        String(item.entidad || '').trim() !== String(entidad).trim()
      ) {
        return false;
      }

      if (
        unidad &&
        Number(item.unidad_id) !== Number(unidad)
      ) {
        return false;
      }

      return true;
    });
  }, [evaluacionData, mes, entidad, unidad]);

  const evaluacionCompletaFiltrada = useMemo(
    () =>
      evaluacionFiltrada.filter((item) => {
        const valor = item.periodo_completo;

        return (
          valor === true ||
          valor === 1 ||
          String(valor).toLowerCase() === 'true'
        );
      }),
    [evaluacionFiltrada]
  );

  const indicadoresEvaluacion = useMemo(() => {
    const registradosObservados = sumar(
      evaluacionFiltrada,
      'formatos_registrados'
    );

    const sinInconsistenciasObservados = sumar(
      evaluacionFiltrada,
      'cuestionarios_sin_inconsistencias'
    );

    const formatosEsperados = sumar(
      evaluacionCompletaFiltrada,
      'meta_formatos_esperados'
    );

    const oportunos = sumar(
      evaluacionCompletaFiltrada,
      'formatos_oportunos'
    );

    const sinInconsistenciasEvaluables = sumar(
      evaluacionCompletaFiltrada,
      'cuestionarios_sin_inconsistencias'
    );

    const porUnidad = {};

    evaluacionCompletaFiltrada.forEach((item) => {
      const id = Number(item.unidad_id);

      if (!porUnidad[id]) {
        porUnidad[id] = {
          unidad_id: id,
          unidad: String(item.unidad || ''),
          registrados: 0,
          oportunos: 0,
          sinInconsistencias: 0,
          esperados: 0,
        };
      }

      porUnidad[id].registrados +=
        Number(item.formatos_registrados) || 0;

      porUnidad[id].oportunos +=
        Number(item.formatos_oportunos) || 0;

      porUnidad[id].sinInconsistencias +=
        Number(item.cuestionarios_sin_inconsistencias) || 0;

      porUnidad[id].esperados +=
        Number(item.meta_formatos_esperados) || 0;
    });

    const unidadesResultados = Object.values(porUnidad)
      .map((item) => {
        const esperado = item.esperados;

        const coberturaMeta =
          esperado > 0
            ? Math.min(
                100,
                (100 * item.registrados) / esperado
              )
            : null;

        const consistencia =
          esperado > 0
            ? Math.min(
                100,
                (100 * item.oportunos) / esperado
              )
            : null;

        const calidad =
          esperado > 0
            ? Math.min(
                100,
                (100 * item.sinInconsistencias) / esperado
              )
            : null;

        return {
          ...item,
          coberturaMeta,
          consistencia,
          calidad,
          cumpleCobertura:
            esperado > 0
              ? item.registrados >= 0.5 * esperado
              : false,
        };
      })
      .sort((a, b) =>
        a.unidad.localeCompare(b.unidad, 'es')
      );

    const unidadesEvaluables = unidadesResultados.filter(
      (item) => item.esperados > 0
    );

    const cobertura =
      unidadesEvaluables.length > 0
        ? (100 *
            unidadesEvaluables.filter(
              (item) => item.cumpleCobertura
            ).length) /
          unidadesEvaluables.length
        : null;

    const consistencia =
      formatosEsperados > 0
        ? Math.min(
            100,
            (100 * oportunos) / formatosEsperados
          )
        : null;

    const calidad =
      formatosEsperados > 0
        ? Math.min(
            100,
            (100 * sinInconsistenciasEvaluables) /
              formatosEsperados
          )
        : null;

    const ponderado =
      Number.isFinite(cobertura) &&
      Number.isFinite(consistencia) &&
      Number.isFinite(calidad)
        ? cobertura * 0.2 +
          consistencia * 0.3 +
          calidad * 0.5
        : null;

    return {
      registrados: registradosObservados,
      sinInconsistencias: sinInconsistenciasObservados,
      formatosEsperados:
        formatosEsperados > 0 ? formatosEsperados : null,
      cobertura,
      consistencia,
      calidad,
      ponderado,
      unidadesResultados,
      periodoEvaluable:
        evaluacionCompletaFiltrada.length > 0,
    };
  }, [
    evaluacionFiltrada,
    evaluacionCompletaFiltrada,
  ]);

  const cambiarEntidad = (event) => {
    setEntidad(event.target.value);
    setUnidad('');
  };

  const limpiarFiltros = () => {
    setEdad('');
    setMes('');
    setEntidad('');
    setUnidad('');
  };

  const kpiSinInconsistencias = useMemo(() => {
    if (!kpiFiltrosData?.kpiDecoded) {
      const sinFiltros =
        !edad && !mes && !entidad && !unidad;

      return sinFiltros
        ? resumenNacional?.kpi_global
            ?.cuestionarios_registrados_sin_inconsistencias ?? null
        : null;
    }

    const filas = kpiFiltrosData.kpiDecoded.filter((item) => {
      if (edad && !edadCoincide(item.edad, edad)) {
        return false;
      }

      if (mes && Number(item.mes) !== Number(mes)) {
        return false;
      }

      if (
        entidad &&
        idsUnidadesEntidad &&
        !idsUnidadesEntidad.has(Number(item.unidad_id))
      ) {
        return false;
      }

      if (
        unidad &&
        Number(item.unidad_id) !== Number(unidad)
      ) {
        return false;
      }

      return true;
    });

    return sumar(
      filas,
      'n_sin_inconsistencias'
    );
  }, [
    kpiFiltrosData,
    resumenNacional,
    edad,
    mes,
    entidad,
    unidad,
    idsUnidadesEntidad,
  ]);

  const filtroProps = {
    gruposEdad,
    meses,
    entidades,
    unidadesFiltradas,
    edad,
    mes,
    entidad,
    unidad,
    setEdad,
    setMes,
    cambiarEntidad,
    setUnidad,
    limpiarFiltros,
    kpiSinInconsistencias,
  };

  const tituloVista =
    MODULOS.find((item) => item.id === vista)?.titulo || '';

  const pieStyle =
    indicadoresCaries.cariesPct === null
      ? { background: '#e7e7e7' }
      : {
          background: `conic-gradient(
            #701039 0 ${indicadoresCaries.cariesPct}%,
            #173f3a ${indicadoresCaries.cariesPct}% 100%
          )`,
        };

  const edentStyle =
    indicadoresCaries.edentPct === null
      ? { background: '#e7e7e7' }
      : {
          background: `conic-gradient(
            #b38c2e 0 ${indicadoresCaries.edentPct}%,
            #173f3a ${indicadoresCaries.edentPct}% 100%
          )`,
        };

  const sexoColores = ['#701039', '#173f3a', '#b38c2e', '#8d8d8d'];

  const sexoPieStyle = (() => {
    if (!sexoData.items.length) {
      return { background: '#e7e7e7' };
    }

    let inicio = 0;

    const segmentos = sexoData.items.map((item, index) => {
      const fin = inicio + (item.valor || 0);
      const color = sexoColores[index % sexoColores.length];
      const segmento = `${color} ${inicio}% ${fin}%`;
      inicio = fin;
      return segmento;
    });

    return {
      background: `conic-gradient(${segmentos.join(', ')})`,
    };
  })();

  return (
    <div className="app">
      <style>{AJUSTES_VISUALES_20260817}</style>
      <header className="top-header">
        <div
          className="top-header-title"
          onClick={() => setVista('inicio')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              setVista('inicio');
            }
          }}
          aria-label="Ir a la pantalla principal"
        >
          <h1>SIVEPAB</h1>
          <p>Tablero interactivo 2026</p>
        </div>

        <div className="top-header-logos">
          <img
            className="logo-imss-bienestar"
            src={logoImssBienestar}
            alt="IMSS Bienestar"
          />

          <img
            className="logo-coordinacion"
            src={logoCoordinacion}
            alt="Coordinación de Epidemiología"
          />

          <img
            className="logo-vigilancia"
            src={logoVigilancia}
            alt="Vigilancia Epidemiológica"
          />
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <nav className="sidebar-menu">
            {MODULOS.map((modulo) => (
              <button
                key={modulo.id}
                className={`menu-item ${
                  vista === modulo.id ? 'active' : ''
                }`}
                onClick={() => setVista(modulo.id)}
              >
                <img src={modulo.icono} alt="" />
                <span>{modulo.titulo}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-source">
            <strong>Fuente:</strong>
            <span>
              Secretaría de Salud. Dirección General de Epidemiología.
              SINAVE. Sistema de Vigilancia Epidemiológica de Patologías
              Bucales. Cédulas registradas de enero a julio de 2026,
              corte al 15 de julio de 2026.
            </span>
          </div>
        </aside>

        <main
          className={`dashboard-content ${
            vista === 'inicio' ? 'home-content' : ''
          }`}
        >
          {errorCarga && (
            <div className="load-error">{errorCarga}</div>
          )}

          {vista === 'inicio' && (
            <>
              <FilterStrip {...filtroProps} />

              <section className="home-main-grid">
                <article className="home-text-card">
                  <p>
                    El Sistema de Vigilancia Epidemiológica de Patologías
                    Bucales tiene por objetivo la captación de información
                    sobre enfermedades y padecimientos bucales en la
                    población mexicana.
                  </p>

                  <p>
                    Funciona como un sistema de vigilancia centinela, con
                    unidades en las 32 entidades del país, con el fin de
                    optimizar recursos para la obtención de información.
                  </p>

                  <p>
                    En este tablero interactivo encontrará información de
                    interés epidemiológico proveniente de las unidades
                    centinela de IMSS-BIENESTAR en las 24 Coordinaciones
                    Estatales. Seleccione de los filtros la entidad, unidad
                    centinela, mes y grupo de edad de interés. En el menú del
                    lado izquierdo puede seleccionar el apartado de interés.
                  </p>
                </article>

                <article className="home-map-card">
                  <h2>Mapa de unidades centinela</h2>

                  <div className="map-wrapper">
                    <MapContainer
                      center={[23.7, -102.5]}
                      zoom={5}
                      minZoom={4}
                      maxZoom={13}
                      scrollWheelZoom={true}
                      className="sivepab-map"
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {puntosMapa.map((item) => (
                        <CircleMarker
                          key={item.unidad_id}
                          center={[
                            Number(item.lat),
                            Number(item.lon),
                          ]}
                          radius={7}
                          pathOptions={{
                            color: '#294756',
                            weight: 2,
                            fillColor: '#0b5750',
                            fillOpacity: 0.9,
                          }}
                        >
                          <Tooltip>
                            <div className="map-tooltip">
                              <strong>{item.unidad}</strong>
                              <span>{item.entidad}</span>

                              {item.municipio && (
                                <span>
                                  Municipio: {item.municipio}
                                </span>
                              )}

                              {item.estatus && (
                                <span>
                                  Estatus: {item.estatus}
                                </span>
                              )}

                              <span>
                                Registros: {item.registros_total}
                              </span>
                            </div>
                          </Tooltip>
                        </CircleMarker>
                      ))}

                      <MapAutoFit puntos={puntosMapa} />
                    </MapContainer>
                  </div>

                  <div className="map-footer">
                    <span>
                      Unidades mostradas: {puntosMapa.length}
                    </span>
                  </div>
                </article>
              </section>
            </>
          )}

          {vista === 'caries' && (
            <section className="caries-module">
              <FilterStrip {...filtroProps} />

              {!cariesData ? (
                <div className="module-loading">
                  Cargando información de CARIES...
                </div>
              ) : (
                <div className="caries-proposal-grid">
                  <article className="social-panel proposal-social-panel">
                    <div className="social-left-column">
                      <div className="social-summary-card proposal-summary-card">
                        <div className="generic-social-icon" aria-hidden="true">
                          <img
                            className="social-icon-image social-icon-migrante"
                            src={iconMigrantes}
                            alt=""
                          />
                        </div>

                        <div className="social-summary-copy">
                          <strong>
                            {formatoPorcentaje(
                              indicadoresSociales.migrantePct,
                              1
                            )}
                          </strong>
                          <span>Se consideran migrantes</span>
                        </div>
                      </div>

                      <div className="social-summary-card proposal-summary-card">
                        <div className="generic-social-icon" aria-hidden="true">
                          <img
                            className="social-icon-image social-icon-indigena"
                            src={iconIndigena}
                            alt=""
                          />
                        </div>

                        <div className="social-summary-copy">
                          <strong>
                            {formatoPorcentaje(
                              indicadoresSociales.indigenaPct,
                              1
                            )}
                          </strong>
                          <span>Se consideran indígenas</span>
                        </div>
                      </div>

                      <PregnancySummaryCard valor={embarazoPct} />

                      <div className="mini-section sex-section proposal-sex-section">
                        <h3>Sexo</h3>

                        <div className="sex-chart-wrap">
                          <div
                            className="sex-pie"
                            style={sexoPieStyle}
                          >
                            {sexoData.items[0] && (
                              <span className="sex-pie-label sex-pie-label-a">
                                {formatoPorcentaje(
                                  sexoData.items[0].valor,
                                  1
                                )}
                              </span>
                            )}

                            {sexoData.items[1] && (
                              <span className="sex-pie-label sex-pie-label-b">
                                {formatoPorcentaje(
                                  sexoData.items[1].valor,
                                  1
                                )}
                              </span>
                            )}
                          </div>

                          <div className="sex-legend">
                            {sexoData.items.map((item, index) => (
                              <div
                                className="sex-legend-row"
                                key={item.etiqueta}
                              >
                                <span
                                  className="sex-legend-dot"
                                  style={{
                                    background:
                                      sexoColores[
                                        index % sexoColores.length
                                      ],
                                  }}
                                ></span>
                                <span>{item.etiqueta}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="social-right-column">
                      <div className="mini-section proposal-bars-section">
                        <h3>Antecedentes patológicos</h3>

                        <HorizontalBars
                          items={antecedentesData}
                          variant="green"
                        />
                      </div>

                      <div className="mini-section occupation-section proposal-bars-section">
                        <h3>Ocupación actual</h3>

                        <HorizontalBars
                          items={ocupacionData}
                          variant="burgundy"
                        />
                      </div>
                    </div>
                  </article>

                  <article className="dental-state-panel">
                    <h2>Evaluación del estado dentario</h2>

                    <div className="dental-pies-row">
                      <div className="proposal-pie-block">
                        <h3>Frecuencia de caries dental</h3>

                        <div
                          className="proposal-solid-pie"
                          style={pieStyle}
                        >
                          <span className="proposal-pie-label proposal-pie-label-main">
                            {formatoPorcentaje(
                              indicadoresCaries.cariesPct,
                              0
                            )}
                          </span>

                          <span className="proposal-pie-label proposal-pie-label-secondary">
                            {formatoPorcentaje(
                              indicadoresCaries.sanosPct,
                              0
                            )}
                          </span>
                        </div>

                        <div className="proposal-pie-legend">
                          <span>
                            <i className="legend-square legend-burgundy"></i>
                            Con caries
                          </span>
                          <span>
                            <i className="legend-square legend-green"></i>
                            Sanos
                          </span>
                        </div>
                      </div>

                      <div className="proposal-pie-block">
                        <h3>Frecuencia de edentulismo total</h3>

                        <div
                          className="proposal-solid-pie"
                          style={edentStyle}
                        >
                          <span className="proposal-pie-label proposal-pie-label-main">
                            {formatoPorcentaje(
                              indicadoresCaries.edentPct === null
                                ? null
                                : 100 - indicadoresCaries.edentPct,
                              0
                            )}
                          </span>

                          <span className="proposal-pie-label proposal-pie-label-secondary">
                            {formatoPorcentaje(
                              indicadoresCaries.edentPct,
                              0
                            )}
                          </span>
                        </div>

                        <div className="proposal-pie-legend">
                          <span>
                            <i className="legend-square legend-green"></i>
                            No
                          </span>
                          <span>
                            <i className="legend-square legend-gold"></i>
                            Sí
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="free-caries-banner">
                      <div className="free-caries-banner-value">
                        {formatoPorcentaje(
                          indicadoresCaries.librePct,
                          1
                        )}
                      </div>

                      <div className="free-caries-banner-label">
                        Niños y adolescentes libres de caries dental.
                      </div>
                    </div>

                    <div className="proposal-index-row">
                      <div className="proposal-index-card proposal-index-CPOD">
                        <strong>
                          {formatoNumero(indicadoresCaries.CPOD)}
                        </strong>
                        <span>CPOD</span>
                      </div>

                      <div className="proposal-index-card proposal-index-cpod">
                        <strong>
                          {formatoNumero(indicadoresCaries.cpod)}
                        </strong>
                        <span>cpod</span>
                      </div>
                    </div>
                  </article>
                </div>
              )}

            </section>
          )}

          {vista === 'higiene' && (
            <section className="higiene-module">
              <FilterStrip {...filtroProps} />

              {!higieneData ? (
                <div className="module-loading">
                  Cargando información de HIGIENE BUCAL...
                </div>
              ) : (
                <div className="higiene-proposal-grid">
                  <article className="social-panel proposal-social-panel">
                    <div className="social-left-column">
                      <div className="social-summary-card proposal-summary-card">
                        <div className="generic-social-icon" aria-hidden="true">
                          <img
                            className="social-icon-image social-icon-migrante"
                            src={iconMigrantes}
                            alt=""
                          />
                        </div>

                        <div className="social-summary-copy">
                          <strong>
                            {formatoPorcentaje(
                              higieneSociales.migrantePct,
                              1
                            )}
                          </strong>
                          <span>Se consideran migrantes</span>
                        </div>
                      </div>

                      <div className="social-summary-card proposal-summary-card">
                        <div className="generic-social-icon" aria-hidden="true">
                          <img
                            className="social-icon-image social-icon-indigena"
                            src={iconIndigena}
                            alt=""
                          />
                        </div>

                        <div className="social-summary-copy">
                          <strong>
                            {formatoPorcentaje(
                              higieneSociales.indigenaPct,
                              1
                            )}
                          </strong>
                          <span>Se consideran indígenas</span>
                        </div>
                      </div>

                      <PregnancySummaryCard valor={higieneEmbarazoPct} />


                      <div className="mini-section proposal-sex-section">
                        <h3>Sexo</h3>

                        <div className="sex-chart-wrap">
                          <div
                            className="sex-pie"
                            style={higieneSexoPieStyle}
                          >
                            {higieneSexoData.items[0] && (
                              <span className="sex-pie-label sex-pie-label-a">
                                {formatoPorcentaje(
                                  higieneSexoData.items[0].valor,
                                  1
                                )}
                              </span>
                            )}

                            {higieneSexoData.items[1] && (
                              <span className="sex-pie-label sex-pie-label-b">
                                {formatoPorcentaje(
                                  higieneSexoData.items[1].valor,
                                  1
                                )}
                              </span>
                            )}
                          </div>

                          <div className="sex-legend">
                            {higieneSexoData.items.map((item, index) => (
                              <div
                                className="sex-legend-row"
                                key={item.etiqueta}
                              >
                                <span
                                  className="sex-legend-dot"
                                  style={{
                                    background:
                                      index === 0
                                        ? '#701039'
                                        : index === 1
                                        ? '#173f3a'
                                        : index === 2
                                        ? '#b38c2e'
                                        : '#8b8b8b',
                                  }}
                                ></span>
                                <span>{item.etiqueta}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="social-right-column">
                      <div className="mini-section proposal-bars-section">
                        <h3>Antecedentes patológicos</h3>

                        <HorizontalBars
                          items={higieneAntecedentesData}
                          variant="green"
                        />
                      </div>

                      <div className="mini-section occupation-section proposal-bars-section">
                        <h3>Ocupación actual</h3>

                        <HorizontalBars
                          items={higieneOcupacionData}
                          variant="burgundy"
                        />
                      </div>
                    </div>
                  </article>

                  <article className="hygiene-state-panel">
                    <h2>Evaluación de la higiene bucal</h2>

                    <div className="hygiene-chart-block">
                      <h3>Clasificación del IHOS</h3>

                      <div className="hygiene-chart-row">
                        <div className="hygiene-pie-wrap">
                          <div
                            className="hygiene-pie"
                            style={higienePieStyle}
                          >
                            {higieneSegmentos.map((item) => (
                              <div
                                key={item.etiqueta}
                                className={`hygiene-pie-label ${
                                  item.esPequeno ? 'outside' : 'inside'
                                } ${item.lado}`}
                                style={{
                                  left: `calc(50% + ${item.x}px)`,
                                  top: `calc(50% + ${item.y}px)`,
                                }}
                              >
                                {item.esPequeno && (
                                  <span className="hygiene-pie-callout-line"></span>
                                )}
                                <span className="hygiene-pie-label-value">
                                  {formatoPorcentaje(item.valor, 1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="hygiene-legend">
                          <div>
                            <i
                              style={{
                                background: higieneColores[0],
                              }}
                            ></i>
                            <span>Excelente</span>
                          </div>

                          <div>
                            <i
                              style={{
                                background: higieneColores[1],
                              }}
                            ></i>
                            <span>Buena</span>
                          </div>

                          <div>
                            <i
                              style={{
                                background: higieneColores[2],
                              }}
                            ></i>
                            <span>Regular</span>
                          </div>

                          <div>
                            <i
                              style={{
                                background: higieneColores[3],
                              }}
                            ></i>
                            <span>Mala</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ihos-value-card">
                      <strong>
                        {formatoNumero(
                          indicadoresHigiene.media,
                          2
                        )}
                      </strong>
                      <span>IHOS</span>
                    </div>

                    <div className="ihos-reference">
                      <strong>
                        Índice de Higiene Oral Simplificado (IHOS):
                      </strong>
                      <span>Excelente = 0</span>
                      <span>Buena = 0.1 - 1.2</span>
                      <span>Regular = 1.3 - 3.0</span>
                      <span>Mala = 3.1 - 6.0</span>
                    </div>
                  </article>
                </div>
              )}
            </section>
          )}

          {vista === 'periodontal' && (
            <section className="periodontal-module">
              <FilterStrip {...filtroProps} />

              {!periodontalData ? (
                <div className="module-loading">
                  Cargando información de ENFERMEDAD PERIODONTAL...
                </div>
              ) : (
                <div className="periodontal-proposal-grid">
                  <article className="social-panel proposal-social-panel">
                    <div className="social-left-column">
                      <div className="social-summary-card proposal-summary-card">
                        <div className="generic-social-icon" aria-hidden="true">
                          <img
                            className="social-icon-image social-icon-migrante"
                            src={iconMigrantes}
                            alt=""
                          />
                        </div>
                        <div className="social-summary-copy">
                          <strong>
                            {formatoPorcentaje(
                              periodontalSociales.migrantePct,
                              1
                            )}
                          </strong>
                          <span>Se consideran migrantes</span>
                        </div>
                      </div>

                      <div className="social-summary-card proposal-summary-card">
                        <div className="generic-social-icon" aria-hidden="true">
                          <img
                            className="social-icon-image social-icon-indigena"
                            src={iconIndigena}
                            alt=""
                          />
                        </div>
                        <div className="social-summary-copy">
                          <strong>
                            {formatoPorcentaje(
                              periodontalSociales.indigenaPct,
                              1
                            )}
                          </strong>
                          <span>Se consideran indígenas</span>
                        </div>
                      </div>

                      <PregnancySummaryCard valor={periodontalEmbarazoPct} />

                      <div className="mini-section proposal-sex-section">
                        <h3>Sexo</h3>
                        <div className="sex-chart-wrap">
                          <div className="sex-pie" style={periodontalSexoPieStyle}>
                            {periodontalSexoData.items[0] && (
                              <span className="sex-pie-label sex-pie-label-a">
                                {formatoPorcentaje(
                                  periodontalSexoData.items[0].valor,
                                  1
                                )}
                              </span>
                            )}
                            {periodontalSexoData.items[1] && (
                              <span className="sex-pie-label sex-pie-label-b">
                                {formatoPorcentaje(
                                  periodontalSexoData.items[1].valor,
                                  1
                                )}
                              </span>
                            )}
                          </div>

                          <div className="sex-legend">
                            {periodontalSexoData.items.map((item, index) => (
                              <div className="sex-legend-row" key={item.etiqueta}>
                                <span
                                  className="sex-legend-dot"
                                  style={{
                                    background:
                                      index === 0
                                        ? '#701039'
                                        : index === 1
                                        ? '#173f3a'
                                        : index === 2
                                        ? '#b38c2e'
                                        : '#8b8b8b',
                                  }}
                                ></span>
                                <span>{item.etiqueta}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="social-right-column">
                      <div className="mini-section proposal-bars-section">
                        <h3>Antecedentes patológicos</h3>
                        <HorizontalBars
                          items={periodontalAntecedentesData}
                          variant="green"
                        />
                      </div>

                      <div className="mini-section occupation-section proposal-bars-section">
                        <h3>Ocupación actual</h3>
                        <HorizontalBars
                          items={periodontalOcupacionData}
                          variant="burgundy"
                        />
                      </div>
                    </div>
                  </article>

                  <article className="periodontal-state-panel">
                    <h2>Evaluación del estado periodontal</h2>
                    <div className="periodontal-chart-block">
                      <h3>Índice Periodontal Comunitario</h3>

                      <div className="periodontal-chart-row">
                        <div className="periodontal-pie-wrap">
                          <div
                            className="periodontal-pie"
                            style={periodontalPieStyle}
                          >
                            {periodontalSegmentos
                              .filter((item) => !item.esPequeno)
                              .map((item) => (
                                <div
                                  key={item.etiqueta}
                                  className="periodontal-pie-label inside"
                                  style={{
                                    left: `calc(50% + ${item.x}px)`,
                                    top: `calc(50% + ${item.y}px)`,
                                  }}
                                >
                                  <span className="periodontal-pie-label-value">
                                    {formatoPorcentaje(item.valor, 1)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>

                        <div className="periodontal-legend">
                          {periodontalSegmentos.map((item) => (
                            <div key={item.etiqueta}>
                              <i style={{ background: item.color }}></i>

                              <span className="periodontal-legend-label">
                                {item.etiqueta}

                                {item.esPequeno && (
                                  <strong>
                                    {' '}
                                    ({formatoPorcentaje(item.valor, 1)})
                                  </strong>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="periodontal-reference">
                      <strong>Índice Periodontal Comunitario (IPC)</strong>
                      <span>0 = Sano</span>
                      <span>1 = Hemorragia</span>
                      <span>2 = Cálculo</span>

                      {!periodontalEdad7a14 && (
                        <>
                          <span>3 = Bolsa de 4-5 mm</span>
                          <span>4 = Bolsa ≥ 6 mm</span>
                        </>
                      )}
                    </div>
                  </article>
                </div>
              )}
            </section>
          )}

          {vista === 'otras' && (
            <section className="otras-module">
              <FilterStrip {...filtroProps} />

              {!otrasData ? (
                <div className="module-loading">
                  Cargando información de OTRAS PATOLOGÍAS...
                </div>
              ) : (
                <div className="otras-proposal-grid">
                  <article className="social-panel proposal-social-panel">
                    <div className="social-left-column">
                      <div className="social-summary-card proposal-summary-card">
                        <div className="generic-social-icon" aria-hidden="true">
                          <img
                            className="social-icon-image social-icon-migrante"
                            src={iconMigrantes}
                            alt=""
                          />
                        </div>

                        <div className="social-summary-copy">
                          <strong>
                            {formatoPorcentaje(
                              otrasSociales.migrantePct,
                              1
                            )}
                          </strong>
                          <span>Se consideran migrantes</span>
                        </div>
                      </div>

                      <div className="social-summary-card proposal-summary-card">
                        <div className="generic-social-icon" aria-hidden="true">
                          <img
                            className="social-icon-image social-icon-indigena"
                            src={iconIndigena}
                            alt=""
                          />
                        </div>

                        <div className="social-summary-copy">
                          <strong>
                            {formatoPorcentaje(
                              otrasSociales.indigenaPct,
                              1
                            )}
                          </strong>
                          <span>Se consideran indígenas</span>
                        </div>
                      </div>

                      <PregnancySummaryCard valor={otrasEmbarazoPct} />

                      <div className="mini-section proposal-sex-section">
                        <h3>Sexo</h3>

                        <div className="sex-chart-wrap">
                          <div
                            className="sex-pie"
                            style={otrasSexoPieStyle}
                          >
                            {otrasSexoData.items[0] && (
                              <span className="sex-pie-label sex-pie-label-a">
                                {formatoPorcentaje(
                                  otrasSexoData.items[0].valor,
                                  1
                                )}
                              </span>
                            )}

                            {otrasSexoData.items[1] && (
                              <span className="sex-pie-label sex-pie-label-b">
                                {formatoPorcentaje(
                                  otrasSexoData.items[1].valor,
                                  1
                                )}
                              </span>
                            )}
                          </div>

                          <div className="sex-legend">
                            {otrasSexoData.items.map((item, index) => (
                              <div
                                className="sex-legend-row"
                                key={item.etiqueta}
                              >
                                <span
                                  className="sex-legend-dot"
                                  style={{
                                    background:
                                      index === 0
                                        ? '#701039'
                                        : index === 1
                                        ? '#173f3a'
                                        : index === 2
                                        ? '#b38c2e'
                                        : '#8b8b8b',
                                  }}
                                ></span>

                                <span>{item.etiqueta}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="social-right-column">
                      <div className="mini-section proposal-bars-section">
                        <h3>Antecedentes patológicos</h3>

                        <HorizontalBars
                          items={otrasAntecedentesData}
                          variant="green"
                        />
                      </div>

                      <div className="mini-section occupation-section proposal-bars-section">
                        <h3>Ocupación actual</h3>

                        <HorizontalBars
                          items={otrasOcupacionData}
                          variant="burgundy"
                        />
                      </div>
                    </div>
                  </article>

                  <article className="otras-state-panel">
                    <h2>Otras lesiones en mucosa bucal</h2>

                    <div className="otras-top-grid">
                      <div className="otras-kpi-stack">
                        <div className="otras-kpi-card">
                          <strong>
                            {formatoPorcentaje(
                              indicadoresOtras.fluorPct,
                              1
                            )}
                          </strong>
                          <span>Con diagnóstico de fluorosis</span>
                        </div>

                        <div className="otras-kpi-card">
                          <strong>
                            {formatoPorcentaje(
                              indicadoresOtras.otraPct,
                              1
                            )}
                          </strong>
                          <span>Reportó otras patologías</span>
                        </div>
                      </div>

                      <div className="otras-tiempo-block">
                        <h3>
                          Tiempo de evolución de lesiones
                          <br />
                          en mucosa bucal
                        </h3>

                        <div className="otras-tiempo-row">
                          <div
                            className="otras-tiempo-pie"
                            style={otrasTiempoPieStyle}
                          >
                            {Number.isFinite(
                              indicadoresOtras.tiempoLt3Pct
                            ) && (
                              <span className="otras-tiempo-label otras-tiempo-label-a">
                                {formatoPorcentaje(
                                  indicadoresOtras.tiempoLt3Pct,
                                  0
                                )}
                              </span>
                            )}

                            {Number.isFinite(
                              indicadoresOtras.tiempoGt3Pct
                            ) && (
                              <span className="otras-tiempo-label otras-tiempo-label-b">
                                {formatoPorcentaje(
                                  indicadoresOtras.tiempoGt3Pct,
                                  0
                                )}
                              </span>
                            )}
                          </div>

                          <div className="otras-tiempo-legend">
                            <div>
                              <i className="otras-dot otras-dot-wine"></i>
                              <span>Menos de tres semanas</span>
                            </div>

                            <div>
                              <i className="otras-dot otras-dot-gold"></i>
                              <span>Más de tres semanas</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="otras-bottom-grid">
                      <div className="otras-chart-card">
                        <h3>Lesiones identificadas</h3>

                        <div className="lesiones-bars">
                          {lesionesData.map((item) => {
                            const max = Math.max(
                              1,
                              ...lesionesData.map((x) => x.valor || 0)
                            );

                            return (
                              <div
                                className="lesion-bar-item"
                                key={item.etiqueta}
                              >
                                <div className="lesion-bar-value">
                                  {Number(item.valor || 0).toLocaleString(
                                    'es-MX'
                                  )}
                                </div>

                                <div className="lesion-bar-track">
                                  <div
                                    className="lesion-bar-fill"
                                    style={{
                                      height: `${Math.max(
                                        item.valor > 0 ? 8 : 0,
                                        ((item.valor || 0) / max) * 100
                                      )}%`,
                                      background: item.color,
                                    }}
                                  ></div>
                                </div>

                                <div className="lesion-bar-label">
                                  {item.etiqueta}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="lesiones-no-lesion-note">
                          <strong>
                            {Number(
                              indicadoresOtras.sinLesion || 0
                            ).toLocaleString('es-MX')}
                          </strong>{' '}
                          pacientes no registraron lesión
                        </div>
                      </div>

                      <div className="otras-chart-card">
                        <h3>
                          Otros diagnósticos y padecimientos registrados
                        </h3>

                        <div className="diagnosticos-bars">
                          {otrasTopDiagnosticos.length === 0 ? (
                            <div className="otras-no-data">
                              Sin registros para la selección.
                            </div>
                          ) : (
                            otrasTopDiagnosticos.map((item) => {
                              const max = Math.max(
                                1,
                                ...otrasTopDiagnosticos.map(
                                  (x) => x.n || 0
                                )
                              );

                              return (
                                <div
                                  className="diagnostico-row"
                                  key={item.codigo}
                                >
                                  <div className="diagnostico-label">
                                    <strong>{item.codigo}</strong>
                                    <span>{item.descripcion}</span>
                                  </div>

                                  <div className="diagnostico-track">
                                    <div
                                      className="diagnostico-fill"
                                      style={{
                                        width: `${Math.max(
                                          item.n > 0 ? 2 : 0,
                                          ((item.n || 0) / max) * 100
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>

                                  <div className="diagnostico-value">
                                    {Number(item.n || 0).toLocaleString(
                                      'es-MX'
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              )}
            </section>
          )}

          {vista === 'evaluacion' && (
            <section className="evaluation-module">
              {!evaluacionData ? (
                <div className="module-loading">
                  Cargando EVALUACIÓN DE INDICADORES...
                </div>
              ) : (
                <>
                  <EvaluationFilterStrip
                    meses={meses}
                    entidades={entidades}
                    unidadesFiltradas={unidadesFiltradas}
                    mes={mes}
                    entidad={entidad}
                    unidad={unidad}
                    setMes={setMes}
                    cambiarEntidad={cambiarEntidad}
                    setUnidad={setUnidad}
                    limpiarFiltros={limpiarFiltros}
                    cuestionariosRegistrados={
                      indicadoresEvaluacion.registrados
                    }
                    cuestionariosSinInconsistencias={
                      indicadoresEvaluacion.sinInconsistencias
                    }
                  />

                  <div className="evaluation-content-card final-evaluation-card">
                    <div className="evaluation-row">
                      <div className="evaluation-score-card eval-wine">
                        <strong>
                          {formatoPorcentaje(
                            indicadoresEvaluacion.cobertura,
                            1
                          )}
                        </strong>
                        <span>COBERTURA</span>
                      </div>

                      <div className="evaluation-real-chart">
                        <h3>Cobertura por unidad centinela</h3>

                        <EvaluationUnitBars
                          items={
                            indicadoresEvaluacion.unidadesResultados
                          }
                          field="coberturaMeta"
                          color="#701039"
                          emptyMessage="Periodo en curso: la cobertura se calcula al cierre del mes."
                        />
                      </div>
                    </div>

                    <div className="evaluation-row">
                      <div className="evaluation-score-card eval-gold">
                        <strong>
                          {formatoPorcentaje(
                            indicadoresEvaluacion.consistencia,
                            1
                          )}
                        </strong>
                        <span>CONSISTENCIA</span>
                      </div>

                      <div className="evaluation-real-chart">
                        <h3>Consistencia por unidad centinela</h3>

                        <EvaluationUnitBars
                          items={
                            indicadoresEvaluacion.unidadesResultados
                          }
                          field="consistencia"
                          color="#b38c2e"
                          emptyMessage="Periodo en curso: la consistencia se calcula al cierre del mes."
                        />
                      </div>
                    </div>

                    <div className="evaluation-row">
                      <div className="evaluation-score-card eval-gray">
                        <strong>
                          {formatoPorcentaje(
                            indicadoresEvaluacion.calidad,
                            1
                          )}
                        </strong>
                        <span>CALIDAD</span>
                      </div>

                      <div className="evaluation-real-chart">
                        <h3>Calidad por unidad centinela</h3>

                        <EvaluationUnitBars
                          items={
                            indicadoresEvaluacion.unidadesResultados
                          }
                          field="calidad"
                          color="#8d8d8d"
                          emptyMessage="Periodo en curso: la calidad se calcula al cierre del mes."
                        />
                      </div>
                    </div>

                    <div className="evaluation-right-column final-evaluation-right">
                      <div className="evaluation-pending-card evaluation-formats-card">
                        <strong>
                          {indicadoresEvaluacion.formatosEsperados === null
                            ? '—'
                            : Number(
                                indicadoresEvaluacion.formatosEsperados
                              ).toLocaleString('es-MX')}
                        </strong>
                        <span>
                          Formatos
                          <br />
                          esperados
                        </span>
                      </div>

                      <div className="evaluation-pending-card">
                        <strong>
                          {formatoPorcentaje(
                            indicadoresEvaluacion.ponderado,
                            1
                          )}
                        </strong>
                        <span>Ponderado</span>
                      </div>
                    </div>
                  </div>

                </>
              )}
            </section>
          )}

          {!['inicio', 'caries', 'higiene', 'periodontal', 'otras', 'evaluacion'].includes(vista) && (
            <section className="module-placeholder">
              <h2>{tituloVista}</h2>
              <p>
                El contenido de este módulo se integrará en un paso
                posterior.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
