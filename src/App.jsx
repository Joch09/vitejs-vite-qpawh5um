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
import iconEmbarazo from './assets/social/icono_embarazo.png';

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


function claveEntidadMapa(valor) {
  const normalizado = String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  const equivalencias = {
    'CIUDAD DE MEXICO': 'CDMX',
    'DISTRITO FEDERAL': 'CDMX',
    CDMX: 'CDMX',

    'ESTADO DE MEXICO': 'MEXICO',
    MEXICO: 'MEXICO',

    'MICHOACAN DE OCAMPO': 'MICHOACAN',
    MICHOACAN: 'MICHOACAN',

    'VERACRUZ DE IGNACIO DE LA LLAVE': 'VERACRUZ',
    VERACRUZ: 'VERACRUZ',

    'COAHUILA DE ZARAGOZA': 'COAHUILA',
    COAHUILA: 'COAHUILA',

    'QUERETARO DE ARTEAGA': 'QUERETARO',
    QUERETARO: 'QUERETARO',
  };

  return equivalencias[normalizado] || normalizado;
}

const CENTROS_ENTIDADES_MEXICO = {
  'AGUASCALIENTES': { center: [21.88, -102.30], zoom: 8 },
  'BAJA CALIFORNIA': { center: [30.55, -115.17], zoom: 6 },
  'BAJA CALIFORNIA SUR': { center: [25.03, -111.67], zoom: 6 },
  'CAMPECHE': { center: [19.00, -90.50], zoom: 7 },
  'CHIAPAS': { center: [16.75, -93.10], zoom: 7 },
  'CHIHUAHUA': { center: [28.63, -106.08], zoom: 6 },
  'CDMX': { center: [19.43, -99.13], zoom: 10 },
  'COAHUILA': { center: [27.30, -102.05], zoom: 6 },
  'COLIMA': { center: [19.24, -103.72], zoom: 8 },
  'DURANGO': { center: [24.03, -104.67], zoom: 6 },
  'GUANAJUATO': { center: [21.02, -101.25], zoom: 7 },
  'GUERRERO': { center: [17.55, -99.50], zoom: 7 },
  'HIDALGO': { center: [20.10, -98.75], zoom: 8 },
  'JALISCO': { center: [20.67, -103.35], zoom: 7 },
  'MEXICO': { center: [19.35, -99.65], zoom: 8 },
  'MICHOACAN': { center: [19.60, -101.80], zoom: 7 },
  'MORELOS': { center: [18.75, -99.10], zoom: 9 },
  'NAYARIT': { center: [21.75, -104.85], zoom: 7 },
  'NUEVO LEON': { center: [25.67, -100.31], zoom: 7 },
  'OAXACA': { center: [17.05, -96.72], zoom: 7 },
  'PUEBLA': { center: [19.05, -98.20], zoom: 8 },
  'QUERETARO': { center: [20.59, -100.39], zoom: 8 },
  'QUINTANA ROO': { center: [19.50, -88.30], zoom: 7 },
  'SAN LUIS POTOSI': { center: [22.15, -100.97], zoom: 7 },
  'SINALOA': { center: [24.80, -107.40], zoom: 7 },
  'SONORA': { center: [29.10, -110.95], zoom: 6 },
  'TABASCO': { center: [17.95, -92.95], zoom: 8 },
  'TAMAULIPAS': { center: [23.75, -98.90], zoom: 7 },
  'TLAXCALA': { center: [19.32, -98.24], zoom: 9 },
  'VERACRUZ': { center: [19.20, -96.80], zoom: 7 },
  'YUCATAN': { center: [20.97, -89.62], zoom: 7 },
  'ZACATECAS': { center: [22.77, -102.58], zoom: 7 },
};

function coordenadasMapaNormalizadas(item) {
  const latRaw = item?.lat;
  const lonRaw = item?.lon;

  if (
    latRaw === null ||
    latRaw === undefined ||
    latRaw === '' ||
    lonRaw === null ||
    lonRaw === undefined ||
    lonRaw === ''
  ) {
    return null;
  }

  let lat = Number(latRaw);
  let lon = Number(lonRaw);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }

  const enMexico = (latitud, longitud) =>
    latitud >= 14 &&
    latitud <= 33.5 &&
    longitud >= -119 &&
    longitud <= -86;

  if (enMexico(lat, lon)) {
    return { lat, lon };
  }

  // Corrección defensiva si latitud y longitud vinieran intercambiadas.
  if (enMexico(lon, lat)) {
    return {
      lat: lon,
      lon: lat,
    };
  }

  return null;
}

function coordenadasMapaValidas(item) {
  return coordenadasMapaNormalizadas(item) !== null;
}

function MapAutoFit({
  puntos,
  vistaNacional,
  entidadSeleccionada,
}) {
  const map = useMap();

  useEffect(() => {
    if (vistaNacional) {
      map.setView([23.7, -102.5], 5, {
        animate: false,
      });
      return;
    }

    const puntosValidos = puntos
      .map((item) => {
        const coords =
          coordenadasMapaNormalizadas(item);

        if (!coords) return null;

        return {
          ...item,
          ...coords,
        };
      })
      .filter(Boolean);

    if (puntosValidos.length === 0) {
      const clave =
        claveEntidadMapa(entidadSeleccionada);

      const respaldo =
        CENTROS_ENTIDADES_MEXICO[clave];

      if (respaldo) {
        map.setView(
          respaldo.center,
          respaldo.zoom,
          { animate: false }
        );
      } else {
        map.setView(
          [23.7, -102.5],
          5,
          { animate: false }
        );
      }

      return;
    }

    if (puntosValidos.length === 1) {
      map.setView(
        [
          puntosValidos[0].lat,
          puntosValidos[0].lon,
        ],
        10,
        { animate: false }
      );
      return;
    }

    const bounds = latLngBounds(
      puntosValidos.map((item) => [
        item.lat,
        item.lon,
      ])
    );

    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: 10,
      animate: false,
    });
  }, [
    puntos,
    vistaNacional,
    entidadSeleccionada,
    map,
  ]);

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


function calcularSegmentosPie(
  items,
  {
    radioInterior = 29,
    radioExterior = 58,
    umbralExterior = 6,
    umbralOcultar = 0,
    separacionExterior = 12,
  } = {}
) {
  const validos = (items || [])
    .map((item) => ({
      ...item,
      valor: Number(item.valor),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.valor) &&
        item.valor > 0
    );

  const total = validos.reduce(
    (acum, item) => acum + item.valor,
    0
  );

  if (!total) return [];

  let acumulado = 0;

  const segmentos = validos.map((item) => {
    const inicio = (acumulado / total) * 100;
    acumulado += item.valor;
    const fin = (acumulado / total) * 100;
    const medio = (inicio + fin) / 2;

    const rad =
      ((medio * 3.6 - 90) * Math.PI) / 180;

    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const ocultarEtiqueta =
      item.valor < umbralOcultar;

    const esExterior =
      !ocultarEtiqueta &&
      item.valor < umbralExterior;

    const radio =
      esExterior
        ? radioExterior
        : radioInterior;

    return {
      ...item,
      inicio,
      fin,
      medio,
      ocultarEtiqueta,
      esExterior,
      lado: cos >= 0 ? 'derecha' : 'izquierda',
      x: 50 + cos * radio,
      y: 50 + sin * radio,
    };
  });

  // Separa etiquetas exteriores pequeñas que queden en el mismo lado.
  ['izquierda', 'derecha'].forEach((lado) => {
    const exteriores = segmentos
      .filter(
        (item) =>
          item.esExterior &&
          item.lado === lado
      )
      .sort((a, b) => a.y - b.y);

    if (!exteriores.length) return;

    exteriores.forEach((item) => {
      item.y = Math.max(5, Math.min(95, item.y));
    });

    for (let i = 1; i < exteriores.length; i += 1) {
      const minimo =
        exteriores[i - 1].y +
        separacionExterior;

      if (exteriores[i].y < minimo) {
        exteriores[i].y = minimo;
      }
    }

    const ultimo =
      exteriores[exteriores.length - 1];

    if (ultimo.y > 95) {
      const desplazamiento = ultimo.y - 95;

      exteriores.forEach((item) => {
        item.y -= desplazamiento;
      });
    }

    const primero = exteriores[0];

    if (primero.y < 5) {
      const desplazamiento = 5 - primero.y;

      exteriores.forEach((item) => {
        item.y += desplazamiento;
      });
    }
  });

  return segmentos;
}

function PieLabels({
  segmentos,
  decimales = 1,
}) {
  return (
    <>
      {(segmentos || [])
        .filter((item) => !item.ocultarEtiqueta)
        .map((item) => (
          <span
            key={item.etiqueta}
            className={`smart-pie-label ${
              item.esExterior ? 'outside' : 'inside'
            } ${item.lado}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
            }}
          >
            {formatoPorcentaje(
              item.valor,
              decimales
            )}
          </span>
        ))}
    </>
  );
}


function PieLegendText({
  item,
  decimales = 1,
}) {
  return (
    <>
      {item.etiqueta}
      {item.ocultarEtiqueta && (
        <strong className="pie-legend-small-value">
          {' '}
          ({formatoPorcentaje(item.valor, decimales)})
        </strong>
      )}
    </>
  );
}

function PeriodontalLegendText({ item, decimales = 1 }) {
  const etiquetaCompacta =
    item.etiqueta === 'Bolsa de 4-5 mm'
      ? 'Bolsa 4-5 mm'
      : item.etiqueta === 'Bolsa ≥ 6 mm'
      ? 'Bolsa ≥6 mm'
      : item.etiqueta;

  return (
    <>
      {etiquetaCompacta}
      {item.ocultarEtiqueta && (
        <strong className="pie-legend-small-value">
          {' '}
          ({formatoPorcentaje(item.valor, decimales)})
        </strong>
      )}
    </>
  );
}

function claveEntidadComparacion(valor) {
  const texto = String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (
    texto === 'CIUDAD DE MEXICO' ||
    texto === 'DISTRITO FEDERAL' ||
    texto === 'CDMX'
  ) {
    return 'CDMX';
  }

  if (
    texto === 'ESTADO DE MEXICO' ||
    texto === 'MEXICO'
  ) {
    return 'MEXICO';
  }

  return texto;
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
  formatosEsperados,
}) {
  const mostrarEntero = (valor) => {
    if (valor === null || valor === undefined) {
      return '—';
    }

    return Number.isFinite(Number(valor))
      ? Number(valor).toLocaleString('es-MX')
      : '—';
  };

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
        <div className="evaluation-top-kpi evaluation-top-kpi-green">
          <div className="evaluation-top-kpi-value">
            {mostrarEntero(formatosEsperados)}
          </div>

          <div className="evaluation-top-kpi-label">
            Formatos
            <br />
            esperados
          </div>
        </div>

        <div className="evaluation-top-kpi evaluation-top-kpi-green">
          <div className="evaluation-top-kpi-value">
            {mostrarEntero(cuestionariosRegistrados)}
          </div>

          <div className="evaluation-top-kpi-label">
            Cuestionarios
            <br />
            registrados
          </div>
        </div>

        <div className="evaluation-top-kpi evaluation-top-kpi-green">
          <div className="evaluation-top-kpi-value">
            {mostrarEntero(cuestionariosSinInconsistencias)}
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
    Number.isFinite(Number(item[field]))
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
        const valorRaw = Math.max(
          0,
          Number(item[field]) || 0
        );

        const valorBar = Math.min(
          100,
          valorRaw
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
                  width: `${valorBar}%`,
                  background: color,
                }}
              ></div>
            </div>

            <strong>
              {valorRaw.toFixed(1)}%
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

function PregnancySummaryCard({ valor }) {
  return (
    <div className="social-summary-card proposal-summary-card pregnancy-summary-card">
      <div
        className="generic-social-icon pregnancy-social-icon"
        aria-hidden="true"
      >
        <img
          className="social-icon-image social-icon-embarazo"
          src={iconEmbarazo}
          alt=""
        />
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

  .social-icon-embarazo {
    width: 72px !important;
    height: 72px !important;
    max-width: 72px !important;
    max-height: 72px !important;
    object-fit: contain !important;
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

  /* ==========================================================
     Ajustes integrados 19-08-2026
     ========================================================== */

  .top-header-title h1 {
    font-size: 2.35rem !important;
    line-height: 1 !important;
    letter-spacing: 0.04em !important;
    margin-bottom: 5px !important;
  }

  .top-header-title p {
    font-size: 1.03rem !important;
  }

  .sidebar-menu .menu-item img {
    width: 68px !important;
    height: 68px !important;
    min-width: 68px !important;
    transform: scale(1.18) !important;
  }

  .sidebar-menu .menu-item {
    min-height: 92px !important;
    gap: 20px !important;
  }

  .top-header-logos .logo-coordinacion,
  .top-header-logos .logo-vigilancia {
    width: 190px !important;
    height: 76px !important;
    max-width: 190px !important;
    max-height: 76px !important;
    object-fit: contain !important;
  }

  .top-header-logos .logo-imss-bienestar {
    max-height: 76px !important;
    object-fit: contain !important;
  }

  .free-caries-banner {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 5px !important;
    text-align: center !important;
    margin-top: 18px !important;
  }

  .free-caries-banner-label {
    order: 1 !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
  }

  .free-caries-banner-value {
    order: 2 !important;
    font-size: 2rem !important;
    line-height: 1 !important;
    font-weight: 800 !important;
  }

  .proposal-solid-pie .proposal-pie-label {
    font-weight: 800 !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.22);
  }

  .hygiene-legend span,
  .ihos-reference span {
    text-transform: none !important;
  }

  .periodontal-state-panel {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
  }

  .periodontal-epo-section {
    border-radius: 16px;
    padding: 14px 16px;
    background: rgba(23, 63, 58, 0.045);
    border: 1px solid rgba(23, 63, 58, 0.10);
  }

  .periodontal-epo-section > h3 {
    margin: 0 0 10px 0;
    text-align: left;
  }

  .periodontal-epo-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .periodontal-epo-card {
    min-height: 94px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid rgba(112, 16, 57, 0.12);
    box-shadow: 0 5px 14px rgba(30, 48, 55, 0.08);
    padding: 10px;
    text-align: center;
  }

  .periodontal-epo-card span {
    font-size: 0.86rem;
    line-height: 1.2;
    font-weight: 650;
  }

  .periodontal-epo-card strong {
    margin-top: 5px;
    font-size: 1.7rem;
    color: #701039;
    line-height: 1;
  }

  .periodontal-distributions-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    align-items: stretch;
  }

  .periodontal-chart-block.periodontal-probe-block {
    margin: 0 !important;
    height: 100%;
  }

  .periodontal-probe-pie {
    width: 172px;
    height: 172px;
    border-radius: 50%;
    position: relative;
    flex: 0 0 auto;
  }

  .periodontal-probe-pie .periodontal-pie-label {
    position: absolute;
    transform: translate(-50%, -50%);
  }

  .periodontal-reference-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px !important;
  }

  .periodontal-reference-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    padding: 12px 14px;
    border-radius: 12px;
    background: #f7f7f5;
  }

  .otras-state-panel {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
  }

  .otras-section-group {
    border-radius: 18px;
    border: 1px solid rgba(23, 63, 58, 0.10);
    background: #ffffff;
    padding: 16px 18px;
    box-shadow: 0 7px 18px rgba(30, 48, 55, 0.08);
  }

  .otras-section-title {
    margin: 0 0 14px 0 !important;
    text-align: left !important;
    font-size: 1.14rem !important;
    color: #173f3a;
  }

  .otras-kpi-card.fluorosis-card {
    text-align: left !important;
    align-items: flex-start !important;
  }

  .otras-kpi-card.fluorosis-card span,
  .otras-kpi-card.fluorosis-card strong {
    width: 100%;
    text-align: left !important;
  }

  .lesion-time-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    margin: 2px 0 12px;
    font-size: 0.82rem;
  }

  .lesion-time-legend > span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .lesion-time-legend i {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    display: inline-block;
  }

  .lesion-time-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .lesion-time-row {
    display: grid;
    grid-template-columns: minmax(145px, 0.95fr) minmax(220px, 2.2fr) 54px;
    gap: 10px;
    align-items: center;
  }

  .lesion-time-name {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
    font-size: 0.86rem;
    line-height: 1.2;
    font-weight: 650;
  }

  .lesion-time-track {
    height: 20px;
    border-radius: 999px;
    background: #eceeec;
    overflow: hidden;
    position: relative;
  }

  .lesion-time-total {
    height: 100%;
    display: flex;
    border-radius: 999px;
    overflow: hidden;
  }

  .lesion-time-segment {
    height: 100%;
    min-width: 0;
  }

  .lesion-time-count {
    text-align: right;
    font-size: 0.83rem;
    font-weight: 750;
  }

  .lesiones-no-lesion-note {
    text-align: left !important;
  }

  .diagnostico-label span {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  .evaluation-filter-strip {
    align-items: stretch !important;
  }

  .evaluation-top-kpis {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(190px, 1fr)) !important;
    gap: 12px !important;
    align-items: stretch !important;
    background: transparent !important;
  }

  .evaluation-top-kpi {
    min-width: 0 !important;
    min-height: 92px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    align-items: center !important;
    text-align: center !important;
    padding: 8px 12px 10px !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    color: #111111 !important;
    box-shadow: none !important;
    border: 0 !important;
  }

  .evaluation-top-kpi-green,
  .evaluation-top-kpi-clean {
    background: #ffffff !important;
    color: #111111 !important;
  }

  .evaluation-top-kpi-value {
    min-width: 124px !important;
    padding: 6px 12px !important;
    border-radius: 6px !important;
    background: #ffffff !important;
    border: 3px solid #7a0f3f !important;
    color: #111111 !important;
    font-weight: 800 !important;
    font-size: 1rem !important;
    line-height: 1 !important;
    box-sizing: border-box !important;
  }

  .evaluation-top-kpi-label {
    white-space: normal !important;
    line-height: 1.05 !important;
    margin-top: 7px !important;
    color: #bd8612 !important;
    font-weight: 700 !important;
    font-size: 0.82rem !important;
  }

  .evaluation-official-note {
    margin: 10px 0 14px;
    padding: 9px 12px;
    border-radius: 10px;
    background: rgba(23, 63, 58, 0.06);
    color: #46545a;
    font-size: 0.82rem;
    line-height: 1.35;
  }

  .evaluation-official-note strong {
    color: #173f3a;
  }

  .final-evaluation-right {
    display: flex !important;
    align-items: stretch !important;
    justify-content: center !important;
  }

  .final-evaluation-right .evaluation-pending-card {
    width: 100% !important;
  }

  @media (max-width: 1180px) {
    .periodontal-distributions-grid {
      grid-template-columns: 1fr;
    }

    .evaluation-top-kpis {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 760px) {
    .periodontal-epo-grid,
    .periodontal-reference-grid {
      grid-template-columns: 1fr !important;
    }

    .lesion-time-row {
      grid-template-columns: 1fr;
    }

    .lesion-time-count {
      text-align: left;
    }
  }

  /* ==========================================================
     Etiquetas inteligentes para TODOS los gráficos de pastel
     ========================================================== */

  .sex-pie,
  .proposal-solid-pie,
  .hygiene-pie,
  .periodontal-pie,
  .periodontal-probe-pie {
    position: relative !important;
    overflow: visible !important;
  }

  .sex-chart-wrap,
  .proposal-pie-block,
  .dental-pies-row,
  .hygiene-pie-wrap,
  .hygiene-chart-row,
  .periodontal-pie-wrap,
  .periodontal-chart-row {
    overflow: visible !important;
  }
  .periodontal-chart-row-centered {
    justify-content: center;
  }

  .periodontal-distributions-grid .periodontal-pie-wrap {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .periodontal-inline-legend {
    width: auto !important;
    max-width: 390px !important;
    margin: 12px auto 0 !important;
    display: flex !important;
    flex-wrap: wrap !important;
    align-items: center !important;
    justify-content: center !important;
    column-gap: 13px !important;
    row-gap: 7px !important;
    padding: 0 6px !important;
  }

  .periodontal-probe-block:nth-child(2) .periodontal-inline-legend {
    max-width: 350px !important;
  }

  .periodontal-inline-legend-row {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
    min-width: 0 !important;
    font-size: 0.64rem !important;
    font-weight: 650 !important;
    color: #143f3a !important;
    text-align: left !important;
    white-space: nowrap !important;
  }

  .periodontal-inline-legend-dot {
    width: 8px !important;
    height: 8px !important;
    border-radius: 0 !important;
    flex: 0 0 8px !important;
  }

  .periodontal-inline-legend-text {
    min-width: 0 !important;
    line-height: 1.05 !important;
    white-space: nowrap !important;
  }

  .smart-pie-label {
    position: absolute;
    z-index: 8;
    transform: translate(-50%, -50%);
    pointer-events: none;
    white-space: nowrap;
    font-weight: 800;
    line-height: 1;
    box-sizing: border-box;
  }

  .smart-pie-label.inside {
    color: #ffffff;
    font-size: 0.82rem;
    padding: 5px 7px;
    border-radius: 999px;
    background: rgba(255,255,255,0.17);
    text-shadow: 0 1px 2px rgba(0,0,0,0.34);
  }

  .smart-pie-label.outside {
    color: #173f3a;
    font-size: 0.76rem;
    padding: 5px 7px;
    border-radius: 999px;
    background: #ffffff;
    border: 1px solid rgba(23,63,58,0.18);
    box-shadow: 0 2px 6px rgba(30,48,55,0.18);
    text-shadow: none;
  }

  .smart-pie-label.outside::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 18px;
    border-top: 1.5px solid rgba(23,63,58,0.55);
    transform: translateY(-50%);
  }

  .smart-pie-label.outside.derecha::after {
    right: 100%;
  }

  .smart-pie-label.outside.izquierda::after {
    left: 100%;
  }

  .proposal-solid-pie .smart-pie-label.inside {
    font-size: 0.9rem;
  }

  .sex-pie .smart-pie-label.inside {
    font-size: 0.82rem;
  }

  .periodontal-pie .smart-pie-label.inside,
  .periodontal-probe-pie .smart-pie-label.inside,
  .hygiene-pie .smart-pie-label.inside {
    font-size: 0.78rem;
  }


  .pie-legend-small-value {
    color: #701039;
    font-weight: 800;
  }

  /* IPC y otro tipo de sonda con el mismo peso visual */
  .periodontal-distributions-grid .periodontal-pie,
  .periodontal-distributions-grid .periodontal-probe-pie {
    width: 200px !important;
    height: 200px !important;
    min-width: 200px !important;
    min-height: 200px !important;
    max-width: 200px !important;
    max-height: 200px !important;
  }

  .periodontal-distributions-grid .periodontal-chart-row {
    align-items: center !important;
  }



  /* ==========================================================
     CARIES - edentulismo parcial + edentulismo total como %
     ========================================================== */

  .edent-partial-block {
    min-width: 0 !important;
  }

  .edent-partial-subtitle {
    margin: -2px 0 10px !important;
    color: #58656a !important;
    font-size: 0.72rem !important;
    line-height: 1.2 !important;
    text-align: center !important;
    font-weight: 650 !important;
  }

  .edent-partial-chart {
    width: 100%;
    min-height: 176px;
    display: grid;
    grid-template-columns: repeat(5, minmax(42px, 1fr));
    gap: 9px;
    align-items: end;
    padding: 12px 8px 0;
    border-bottom: 1px solid rgba(23, 63, 58, 0.22);
    box-sizing: border-box;
  }

  .edent-partial-group {
    height: 164px;
    display: grid;
    grid-template-rows: 24px 112px 28px;
    align-items: end;
    min-width: 0;
  }

  .edent-partial-value {
    text-align: center;
    color: #173f3a;
    font-size: 0.76rem;
    line-height: 1;
    font-weight: 800;
  }

  .edent-partial-bar-area {
    height: 112px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    border-bottom: 1px solid rgba(23, 63, 58, 0.10);
  }

  .edent-partial-bar {
    width: min(32px, 68%);
    min-height: 2px;
    border-radius: 7px 7px 2px 2px;
    background: #173f3a;
    box-shadow: 0 3px 8px rgba(23, 63, 58, 0.16);
  }

  .edent-partial-label {
    align-self: start;
    padding-top: 7px;
    text-align: center;
    color: #4b585d;
    font-size: 0.66rem;
    line-height: 1.05;
    font-weight: 700;
    white-space: nowrap;
  }

  .edent-partial-footnote {
    margin-top: 8px;
    text-align: center;
    color: #6a7478;
    font-size: 0.66rem;
    line-height: 1.2;
  }

  .dental-index-row-three {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 12px !important;
  }

  .dental-index-row-two {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    max-width: 360px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }

  .proposal-index-edent-total {
    background: #b38c2e !important;
    color: #ffffff !important;
  }

  .proposal-index-edent-total strong,
  .proposal-index-edent-total span,
  .proposal-index-edent-total small {
    color: #ffffff !important;
  }

  .proposal-index-edent-total span {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 2px !important;
  }

  .proposal-index-edent-total small {
    font-size: 0.64rem !important;
    line-height: 1 !important;
    font-weight: 650 !important;
    opacity: 0.92;
  }

  /* CARIES: proporciones y paleta homogéneas */
  .dental-pies-row .proposal-pie-block {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
    min-width: 0 !important;
  }

  .dental-pies-row .proposal-solid-pie {
    width: 178px !important;
    height: 178px !important;
    min-width: 178px !important;
    min-height: 178px !important;
    max-width: 178px !important;
    max-height: 178px !important;
    border-radius: 50% !important;
  }

  .dental-pies-row .proposal-pie-legend {
    width: 100% !important;
    min-height: 30px !important;
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: center !important;
    align-items: flex-start !important;
    gap: 6px 12px !important;
    margin-top: 9px !important;
    font-size: 0.69rem !important;
    line-height: 1.1 !important;
    text-align: center !important;
  }

  .dental-pies-row .proposal-pie-legend > span {
    display: inline-flex !important;
    align-items: center !important;
    gap: 5px !important;
  }

  .dental-pies-row .legend-square {
    width: 9px !important;
    height: 9px !important;
    min-width: 9px !important;
    flex: 0 0 9px !important;
  }

  .dental-index-row-three .proposal-index-card {
    min-height: 112px !important;
    height: 112px !important;
    padding: 12px 10px !important;
    box-sizing: border-box !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 7px !important;
  }

  .dental-index-row-three .proposal-index-card strong {
    font-size: 1.7rem !important;
    line-height: 1 !important;
  }

  .dental-index-row-three .proposal-index-card span {
    font-size: 0.96rem !important;
    line-height: 1.08 !important;
    font-weight: 750 !important;
    text-align: center !important;
  }

  @media (max-width: 900px) {
    .dental-index-row-three {
      grid-template-columns: 1fr !important;
    }

    .edent-partial-chart {
      grid-template-columns: repeat(5, minmax(38px, 1fr));
      gap: 6px;
    }
  }

  /* ==========================================================
     OTRAS PATOLOGÍAS - composición basada en boceto SIVEPAB
     ========================================================== */

  .otras-state-panel.boceto-otras {
    display: block !important;
    padding: 18px 20px 20px !important;
  }

  .otras-state-panel.boceto-otras > h2 {
    display: none !important;
  }

  .otras-boceto-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.9fr);
    gap: 28px;
    align-items: stretch;
  }

  .otras-boceto-col {
    min-width: 0;
  }

  .otras-boceto-col.left {
    padding-right: 10px;
  }

  .otras-boceto-title {
    margin: 0 0 18px 0 !important;
    text-align: left !important;
    font-size: 1.25rem !important;
    line-height: 1.15 !important;
    color: #b07c13 !important;
    font-weight: 800 !important;
  }

  .otras-boceto-title.right {
    max-width: 320px;
  }

  .lesion-grouped-chart {
    min-height: 390px;
    display: flex;
    flex-direction: column;
  }

  .lesion-grouped-legend {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px 22px;
    margin: 0 0 14px;
    font-size: 0.8rem;
  }

  .lesion-grouped-legend span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
  }

  .lesion-grouped-legend i {
    width: 10px;
    height: 10px;
    display: inline-block;
  }

  .lesion-grouped-plot {
    flex: 1;
    min-height: 300px;
    display: grid;
    grid-template-columns: repeat(5, minmax(72px, 1fr));
    align-items: end;
    gap: 10px;
    padding: 12px 8px 0 48px;
    position: relative;
    border-bottom: 1px solid #cfd4d2;
  }

  .lesion-grouped-plot::before {
    content: "";
    position: absolute;
    left: 48px;
    right: 8px;
    top: 12px;
    bottom: 0;
    background:
      repeating-linear-gradient(
        to bottom,
        rgba(23,63,58,0.12) 0,
        rgba(23,63,58,0.12) 1px,
        transparent 1px,
        transparent 20%
      );
    pointer-events: none;
  }

  .lesion-group {
    min-width: 0;
    height: 100%;
    display: grid;
    grid-template-rows: 1fr auto;
    align-items: end;
    position: relative;
    z-index: 1;
  }

  .lesion-bars {
    height: 100%;
    display: flex;
    align-items: end;
    justify-content: center;
    gap: 7px;
    padding: 0 5px;
  }

  .lesion-vbar-wrap {
    flex: 0 0 22px;
    height: 100%;
    display: flex;
    align-items: end;
    justify-content: center;
    position: relative;
  }

  .lesion-vbar {
    width: 100%;
    min-height: 0;
    position: relative;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }

  .lesion-vbar.lt3 {
    background: #a71f4d;
  }

  .lesion-vbar.gt3 {
    background: #235d53;
  }

  .lesion-vbar-value {
    position: absolute;
    left: 50%;
    top: -18px;
    transform: translateX(-50%);
    font-size: 0.68rem;
    font-weight: 750;
    color: #173f3a;
    white-space: nowrap;
  }

  .lesion-group-label {
    min-height: 48px;
    margin-top: 8px;
    text-align: center;
    font-size: 0.76rem;
    line-height: 1.15;
    font-weight: 650;
    color: #555;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .lesion-grouped-note {
    margin-top: 12px;
    padding-left: 48px;
    text-align: left;
    font-size: 0.74rem;
    line-height: 1.35;
    color: #6c6c6c;
  }

  .lesion-grouped-note strong {
    color: #701039;
  }

  .otras-right-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .otras-boceto-kpi {
    min-height: 94px;
    border-radius: 8px;
    padding: 16px 18px;
    background: #ffffff;
    border: 1px solid rgba(23,63,58,0.08);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    box-shadow: none;
  }

  .otras-boceto-kpi strong {
    font-size: 1.95rem;
    line-height: 1;
    color: #a71f4d;
    font-weight: 850;
  }

  .otras-boceto-kpi span {
    margin-top: 7px;
    font-size: 0.74rem;
    line-height: 1.2;
    color: #173f3a;
    font-weight: 700;
  }

  .otras-boceto-diagnosticos {
    margin-top: 8px;
    padding: 16px 16px 12px;
    border-radius: 8px;
    background: #f6f6f4;
  }

  .otras-boceto-diagnosticos h3 {
    margin: 0 0 14px !important;
    text-align: center !important;
    font-size: 0.82rem !important;
    color: #173f3a !important;
  }

  .otras-boceto-diagnosticos .diagnosticos-bars {
    gap: 9px;
  }

  .otras-boceto-diagnosticos .diagnostico-row {
    grid-template-columns: minmax(115px, 1.2fr) minmax(90px, 1fr) 44px;
    gap: 8px;
  }

  .otras-boceto-diagnosticos .diagnostico-label {
    text-align: right;
  }

  .otras-boceto-diagnosticos .diagnostico-label strong {
    font-size: 0.72rem;
  }

  .otras-boceto-diagnosticos .diagnostico-label span {
    font-size: 0.66rem;
    line-height: 1.12;
  }

  .otras-boceto-diagnosticos .diagnostico-value {
    font-size: 0.7rem;
  }

  @media (max-width: 980px) {
    .otras-boceto-grid {
      grid-template-columns: 1fr;
    }

    .otras-boceto-col.left {
      padding-right: 0;
    }

    .otras-boceto-title.right {
      max-width: none;
    }
  }

  @media (max-width: 680px) {
    .lesion-grouped-plot {
      grid-template-columns: repeat(5, minmax(58px, 1fr));
      padding-left: 24px;
      overflow-x: auto;
    }

    .lesion-grouped-plot::before {
      left: 24px;
    }

    .lesion-grouped-note {
      padding-left: 24px;
    }

    .lesion-vbar-wrap {
      flex-basis: 18px;
    }
  }


  /* ==========================================================
     OTRAS PATOLOGÍAS - corrección de desbordamiento de columnas
     ========================================================== */

  .otras-state-panel.boceto-otras {
    overflow: hidden !important;
  }

  .otras-boceto-grid {
    grid-template-columns:
      minmax(0, 1.28fr)
      minmax(0, 0.92fr) !important;
    gap: 24px !important;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  .otras-boceto-col {
    min-width: 0 !important;
    max-width: 100%;
    overflow: hidden;
  }

  .otras-boceto-col.left {
    padding-right: 0 !important;
  }

  .lesion-grouped-chart {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    min-height: 360px;
    overflow: hidden;
  }

  .lesion-grouped-legend {
    justify-content: center;
    gap: 10px 18px;
    margin-bottom: 12px;
  }

  .lesion-grouped-plot {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 280px;
    box-sizing: border-box;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: 6px !important;
    padding: 12px 4px 0 24px !important;
    overflow: hidden !important;
  }

  .lesion-grouped-plot::before {
    left: 24px !important;
    right: 4px !important;
  }

  .lesion-group {
    width: 100%;
    min-width: 0;
    overflow: visible;
  }

  .lesion-bars {
    width: 100%;
    min-width: 0;
    gap: 4px !important;
    padding: 0 2px !important;
  }

  .lesion-vbar-wrap {
    flex: 0 1 18px !important;
    width: 18px;
    max-width: 18px;
    min-width: 10px;
  }

  .lesion-vbar-value {
    font-size: 0.62rem !important;
    top: -15px !important;
  }

  .lesion-group-label {
    min-width: 0;
    min-height: 54px;
    padding: 0 2px;
    font-size: 0.68rem !important;
    line-height: 1.08 !important;
    overflow-wrap: anywhere;
    word-break: normal;
  }

  .lesion-grouped-note {
    padding-left: 24px !important;
    padding-right: 8px;
    margin-top: 10px;
    font-size: 0.7rem !important;
  }

  .otras-boceto-title {
    font-size: 1.1rem !important;
    margin-bottom: 15px !important;
  }

  .otras-boceto-title.right {
    max-width: 100% !important;
  }

  .otras-right-stack {
    width: 100%;
    min-width: 0;
    gap: 11px;
  }

  .otras-boceto-kpi {
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    min-height: 88px;
    padding: 14px 16px;
    overflow: hidden;
  }

  .otras-boceto-kpi strong {
    font-size: 1.75rem !important;
  }

  .otras-boceto-kpi span {
    font-size: 0.7rem !important;
  }

  .otras-boceto-diagnosticos {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    padding: 14px 10px 12px !important;
    overflow: hidden;
  }

  .otras-boceto-diagnosticos h3 {
    font-size: 0.74rem !important;
    line-height: 1.25 !important;
    margin-bottom: 12px !important;
  }

  .otras-boceto-diagnosticos .diagnostico-row {
    width: 100%;
    min-width: 0;
    grid-template-columns:
      minmax(82px, 1.25fr)
      minmax(62px, 1fr)
      40px !important;
    gap: 6px !important;
  }

  .otras-boceto-diagnosticos .diagnostico-label {
    min-width: 0;
  }

  .otras-boceto-diagnosticos .diagnostico-label strong {
    font-size: 0.66rem !important;
  }

  .otras-boceto-diagnosticos .diagnostico-label span {
    font-size: 0.59rem !important;
    line-height: 1.08 !important;
    overflow-wrap: anywhere;
  }

  .otras-boceto-diagnosticos .diagnostico-track {
    min-width: 0;
  }

  .otras-boceto-diagnosticos .diagnostico-value {
    font-size: 0.66rem !important;
  }

  /*
    En pantallas realmente angostas sí conviene apilar.
    Se baja el breakpoint para conservar las dos columnas
    en el tamaño mostrado en la captura.
  */
  @media (max-width: 650px) {
    .otras-boceto-grid {
      grid-template-columns: 1fr !important;
      overflow: visible;
    }

    .otras-state-panel.boceto-otras,
    .otras-boceto-col {
      overflow: visible !important;
    }

    .lesion-grouped-plot {
      grid-template-columns: repeat(5, minmax(54px, 1fr)) !important;
      overflow-x: auto !important;
    }
  }



  /* Estado informativo cuando existen lesiones, pero no temporalidad válida */
  .lesion-temporal-empty {
    min-height: 330px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 28px 34px;
    box-sizing: border-box;
  }

  .lesion-temporal-empty-card {
    width: min(100%, 420px);
    padding: 24px 26px;
    border-radius: 14px;
    background: #f6f0db;
    border: 1px solid rgba(176,124,19,0.15);
  }

  .lesion-temporal-empty-card strong {
    display: block;
    margin-bottom: 8px;
    color: #173f3a;
    font-size: 0.92rem;
    line-height: 1.35;
  }

  .lesion-temporal-empty-card span {
    display: block;
    color: #5f6764;
    font-size: 0.78rem;
    line-height: 1.45;
  }

  .lesion-temporal-empty-card b {
    color: #a71f4d;
    font-weight: 850;
  }

  .lesion-temporal-empty-note {
    width: min(100%, 420px);
    margin-top: 14px;
    color: #6b6b6b;
    font-size: 0.72rem;
    line-height: 1.4;
  }



  .lesion-grouped-legend-bottom {
    margin-top: 12px !important;
    margin-bottom: 4px !important;
    justify-content: center !important;
  }



  /* ==========================================================
     OTRAS PATOLOGÍAS - gráfica de lesiones más amplia y legible
     ========================================================== */

  .otras-boceto-grid {
    grid-template-columns:
      minmax(0, 1.48fr)
      minmax(290px, 0.82fr) !important;
    gap: 20px !important;
  }

  .lesion-grouped-chart {
    min-height: 400px !important;
  }

  .lesion-grouped-plot {
    min-height: 315px !important;
    grid-template-columns: repeat(5, minmax(64px, 1fr)) !important;
    gap: 8px !important;
    padding-left: 18px !important;
    padding-right: 4px !important;
    overflow: hidden !important;
  }

  .lesion-grouped-plot::before {
    left: 18px !important;
    right: 4px !important;
  }

  .lesion-bars {
    gap: 5px !important;
    padding: 0 3px !important;
  }

  .lesion-vbar-wrap {
    flex-basis: 20px !important;
    width: 20px !important;
    max-width: 20px !important;
  }

  .lesion-group-label {
    min-height: 68px !important;
    margin-top: 9px !important;
    padding: 0 3px !important;
    font-size: 0.72rem !important;
    line-height: 1.12 !important;
    font-weight: 650 !important;

    /* Nunca cortar una palabra por la mitad */
    overflow-wrap: normal !important;
    word-break: normal !important;
    hyphens: none !important;
    white-space: normal !important;
  }

  .lesion-grouped-legend-bottom {
    margin-top: 8px !important;
  }

  .lesion-grouped-note {
    margin-top: 9px !important;
    padding-left: 18px !important;
  }

  /* La columna derecha se mantiene compacta sin invadir la gráfica */
  .otras-boceto-col.right {
    min-width: 0 !important;
  }

  .otras-boceto-kpi {
    padding-left: 14px !important;
    padding-right: 14px !important;
  }

  @media (max-width: 1100px) and (min-width: 651px) {
    .otras-boceto-grid {
      grid-template-columns:
        minmax(0, 1.42fr)
        minmax(270px, 0.78fr) !important;
    }

    .lesion-grouped-plot {
      grid-template-columns: repeat(5, minmax(58px, 1fr)) !important;
      gap: 6px !important;
    }

    .lesion-group-label {
      font-size: 0.68rem !important;
    }
  }



  /* ==========================================================
     OTRAS PATOLOGÍAS - ajuste final de etiquetas del eje X
     ========================================================== */

  .otras-boceto-grid {
    grid-template-columns:
      minmax(0, 1.62fr)
      minmax(255px, 0.68fr) !important;
    gap: 16px !important;
  }

  .otras-boceto-col.left {
    min-width: 0 !important;
    padding-right: 4px !important;
  }

  .lesion-grouped-plot {
    grid-template-columns: repeat(5, minmax(72px, 1fr)) !important;
    gap: 10px !important;
    padding-left: 8px !important;
    padding-right: 4px !important;
    min-height: 320px !important;
  }

  .lesion-grouped-plot::before {
    left: 8px !important;
    right: 4px !important;
  }

  .lesion-group {
    min-width: 0 !important;
  }

  .lesion-bars {
    padding-left: 1px !important;
    padding-right: 1px !important;
    gap: 4px !important;
  }

  .lesion-group-label {
    width: 100% !important;
    min-width: 0 !important;
    min-height: 64px !important;
    margin-top: 8px !important;
    padding: 0 2px !important;

    font-size: 0.62rem !important;
    line-height: 1.08 !important;
    font-weight: 650 !important;

    text-align: center !important;
    white-space: normal !important;
    word-break: normal !important;
    overflow-wrap: normal !important;
    hyphens: none !important;

    display: flex !important;
    align-items: flex-start !important;
    justify-content: center !important;
  }

  .lesion-vbar-value {
    font-size: 0.60rem !important;
  }

  .lesion-grouped-note {
    padding-left: 8px !important;
    padding-right: 4px !important;
  }

  /* Mantener la columna derecha compacta para privilegiar la gráfica */
  .otras-boceto-title.right {
    font-size: 1rem !important;
  }

  .otras-boceto-kpi {
    min-height: 82px !important;
    padding: 12px 13px !important;
  }

  .otras-boceto-kpi strong {
    font-size: 1.55rem !important;
  }

  .otras-boceto-kpi span {
    font-size: 0.66rem !important;
  }

  .otras-boceto-diagnosticos {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

  @media (max-width: 1200px) and (min-width: 651px) {
    .otras-boceto-grid {
      grid-template-columns:
        minmax(0, 1.58fr)
        minmax(245px, 0.72fr) !important;
      gap: 14px !important;
    }

    .lesion-grouped-plot {
      grid-template-columns: repeat(5, minmax(66px, 1fr)) !important;
      gap: 8px !important;
    }

    .lesion-group-label {
      font-size: 0.59rem !important;
    }
  }


  /* ==========================================================
     OTRAS PATOLOGÍAS - distribución vertical solicitada 20/08
     Lesiones arriba; patologías + diagnósticos abajo.
     ========================================================== */
  .otras-layout-v2 {
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 26px;
  }

  .otras-layout-v2-top {
    width: 100%;
    min-width: 0;
    padding-bottom: 22px;
    border-bottom: 1px solid rgba(23, 63, 58, 0.12);
  }

  .otras-layout-v2-top .otras-boceto-title {
    margin-bottom: 14px !important;
  }

  .otras-layout-v2-top .lesion-grouped-chart {
    width: 100% !important;
    min-height: 360px !important;
  }

  .otras-layout-v2-top .lesion-grouped-plot {
    width: 100% !important;
    min-height: 285px !important;
    grid-template-columns: repeat(5, minmax(105px, 1fr)) !important;
    gap: 18px !important;
    padding-left: 14px !important;
    padding-right: 14px !important;
    overflow: visible !important;
  }

  .otras-layout-v2-top .lesion-grouped-plot::before {
    left: 14px !important;
    right: 14px !important;
  }

  .otras-layout-v2-top .lesion-vbar-wrap {
    flex-basis: 26px !important;
    width: 26px !important;
    max-width: 26px !important;
  }

  .otras-layout-v2-top .lesion-group-label {
    min-height: 44px !important;
    font-size: 0.72rem !important;
    line-height: 1.1 !important;
    overflow-wrap: normal !important;
    word-break: normal !important;
    hyphens: none !important;
  }

  .otras-layout-v2-top .lesion-grouped-legend-bottom {
    margin-top: 12px !important;
    margin-bottom: 8px !important;
  }

  .otras-layout-v2-top .lesion-grouped-note {
    max-width: 920px;
    margin: 8px auto 0 !important;
    padding: 0 14px !important;
    text-align: left;
  }

  .otras-layout-v2-bottom {
    width: 100%;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(250px, 0.82fr) minmax(360px, 1.35fr);
    gap: 34px;
    align-items: start;
  }

  .otras-layout-v2-summary,
  .otras-layout-v2-diagnosticos {
    min-width: 0;
  }

  .otras-layout-v2-summary .otras-boceto-title.right {
    margin: 0 0 14px !important;
    max-width: 280px !important;
    font-size: 1rem !important;
    line-height: 1.18 !important;
    text-align: left !important;
  }

  .otras-layout-v2-kpis {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .otras-layout-v2-kpis .otras-boceto-kpi {
    width: 100% !important;
    min-height: 86px !important;
    padding: 14px 16px !important;
    background: #ffffff !important;
  }

  .otras-layout-v2-kpis .otras-boceto-kpi {
    align-items: center !important;
    text-align: center !important;
  }

  .otras-layout-v2-kpis .otras-boceto-kpi strong {
    font-size: 1.65rem !important;
    width: 100% !important;
    text-align: center !important;
  }

  .otras-layout-v2-kpis .otras-boceto-kpi span {
    width: 100% !important;
    text-align: center !important;
  }

  .otras-layout-v2-diagnosticos .otras-boceto-diagnosticos {
    width: 100% !important;
    min-height: 230px;
    padding: 12px 18px 16px !important;
    background: #ffffff;
  }

  .otras-layout-v2-diagnosticos .otras-boceto-diagnosticos h3 {
    margin-bottom: 16px !important;
    font-size: 0.82rem !important;
    line-height: 1.22 !important;
    text-align: center;
  }

  .otras-layout-v2-diagnosticos .diagnostico-row {
    grid-template-columns: minmax(120px, 1.2fr) minmax(150px, 1.35fr) 52px !important;
    gap: 10px !important;
  }

  .otras-layout-v2-diagnosticos .diagnostico-label strong {
    font-size: 0.70rem !important;
  }

  .otras-layout-v2-diagnosticos .diagnostico-label span {
    font-size: 0.64rem !important;
    line-height: 1.12 !important;
  }

  .otras-layout-v2-diagnosticos .diagnostico-value {
    font-size: 0.70rem !important;
  }

  @media (max-width: 900px) {
    .otras-layout-v2-bottom {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .otras-layout-v2-summary .otras-boceto-title.right {
      max-width: none !important;
    }

    .otras-layout-v2-top .lesion-grouped-plot {
      grid-template-columns: repeat(5, minmax(76px, 1fr)) !important;
      gap: 10px !important;
      overflow-x: auto !important;
    }
  }

  /* ==========================================================
     Ajustes responsivos generales para pantallas pequeñas
     ========================================================== */

  @media (max-width: 1100px) {
    .top-header {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 16px !important;
      padding: 18px 20px !important;
    }

    .top-header-title {
      width: 100% !important;
      text-align: center !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .top-header-logos {
      width: 100% !important;
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 14px !important;
      align-items: center !important;
      justify-items: center !important;
    }

    .top-header-logos .logo-imss-bienestar,
    .top-header-logos .logo-coordinacion,
    .top-header-logos .logo-vigilancia {
      width: 100% !important;
      max-width: 180px !important;
      height: auto !important;
      max-height: 74px !important;
      object-fit: contain !important;
    }

    .app-body {
      display: flex !important;
      flex-direction: column !important;
      gap: 16px !important;
    }

    .sidebar {
      width: 100% !important;
      min-width: 0 !important;
    }

    .sidebar-menu {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 12px !important;
    }

    .dashboard-content {
      width: 100% !important;
      min-width: 0 !important;
    }

    .home-main-grid,
    .caries-proposal-grid,
    .higiene-proposal-grid,
    .periodontal-proposal-grid,
    .otras-proposal-grid {
      grid-template-columns: 1fr !important;
    }

    .social-panel,
    .proposal-social-panel {
      grid-template-columns: 1fr !important;
    }

    .shared-filter-strip,
    .evaluation-filter-strip {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 14px !important;
    }

    .shared-filters,
    .evaluation-filters {
      width: 100% !important;
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 12px !important;
      align-items: end !important;
    }

    .shared-filters > .clear-filters,
    .evaluation-filters > .clear-filters {
      width: 100% !important;
      min-height: 44px !important;
      justify-self: stretch !important;
    }

    .shared-kpi {
      width: 100% !important;
      max-width: 280px !important;
      margin: 0 auto !important;
    }

    .evaluation-top-kpis {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
  }

  @media (max-width: 760px) {
    .top-header {
      padding: 16px !important;
    }

    .top-header-title h1 {
      font-size: 1.9rem !important;
    }

    .top-header-title p {
      font-size: 0.92rem !important;
    }

    .top-header-logos {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    .top-header-logos .logo-imss-bienestar,
    .top-header-logos .logo-coordinacion,
    .top-header-logos .logo-vigilancia {
      max-width: 190px !important;
      max-height: 64px !important;
    }

    .sidebar-menu {
      grid-template-columns: 1fr !important;
    }

    .sidebar-menu .menu-item {
      min-height: 78px !important;
      padding: 12px 14px !important;
      gap: 14px !important;
    }

    .sidebar-menu .menu-item img {
      width: 54px !important;
      height: 54px !important;
      min-width: 54px !important;
      transform: scale(1.08) !important;
    }

    .sidebar-source {
      display: none !important;
    }

    .shared-filters,
    .evaluation-filters,
    .evaluation-top-kpis,
    .periodontal-epo-grid,
    .periodontal-reference-grid {
      grid-template-columns: 1fr !important;
    }

    .shared-kpi {
      max-width: 100% !important;
    }

    .shared-kpi-value,
    .evaluation-top-kpi-value {
      min-width: 0 !important;
      width: min(100%, 140px) !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    .shared-kpi-label,
    .evaluation-top-kpi-label {
      text-align: center !important;
    }

    .home-text-card,
    .home-map-card,
    .proposal-social-panel,
    .proposal-bars-section,
    .periodontal-state-panel,
    .otras-state-panel {
      padding-left: 14px !important;
      padding-right: 14px !important;
    }

    .dental-index-row-three,
    .dental-index-row-two {
      width: 100% !important;
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 520px) {
    .shared-filters,
    .evaluation-filters {
      gap: 10px !important;
    }

    .filter-group label {
      font-size: 0.84rem !important;
    }

    .filter-group select,
    .clear-filters {
      font-size: 0.94rem !important;
    }

    .shared-kpi-value,
    .evaluation-top-kpi-value {
      font-size: 0.95rem !important;
    }

    .shared-kpi-label,
    .evaluation-top-kpi-label {
      font-size: 0.78rem !important;
      line-height: 1.05 !important;
    }
  }

  /* ==========================================================
     Responsive v2 — evita solapamiento real de filtros y KPI
     ========================================================== */

  .shared-filter-strip {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 190px !important;
    gap: 16px !important;
    align-items: center !important;
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  .shared-filters {
    display: grid !important;
    grid-template-columns:
      minmax(170px, 1.1fr)
      minmax(260px, 1.7fr)
      minmax(130px, 0.8fr)
      minmax(150px, 0.9fr)
      minmax(90px, auto) !important;
    gap: 12px !important;
    align-items: end !important;
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  .shared-filters .filter-group {
    min-width: 0 !important;
    width: 100% !important;
  }

  .shared-filters .filter-group select {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .shared-filters .clear-filters {
    width: 100% !important;
    min-width: 90px !important;
    max-width: 130px !important;
    min-height: 44px !important;
    align-self: end !important;
    justify-self: stretch !important;
    box-sizing: border-box !important;
  }

  .shared-kpi {
    width: 190px !important;
    min-width: 190px !important;
    max-width: 190px !important;
    margin: 0 !important;
    align-self: center !important;
    justify-self: end !important;
    box-sizing: border-box !important;
  }

  .shared-kpi-value {
    width: 100% !important;
    max-width: 190px !important;
    box-sizing: border-box !important;
  }

  .shared-kpi-label {
    width: 100% !important;
    box-sizing: border-box !important;
    text-align: center !important;
    overflow-wrap: anywhere !important;
  }

  /* En pantallas medianas o con zoom, el KPI baja a una fila propia.
     Así nunca invade Edad ni el botón Limpiar. */
  @media (max-width: 1500px) {
    .shared-filter-strip {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }

    .shared-kpi {
      width: 190px !important;
      min-width: 190px !important;
      max-width: 190px !important;
      justify-self: end !important;
    }

    .shared-filters {
      grid-template-columns:
        minmax(160px, 1.1fr)
        minmax(230px, 1.7fr)
        minmax(120px, 0.8fr)
        minmax(140px, 0.9fr)
        minmax(90px, 0.55fr) !important;
    }
  }

  /* Tablet / zoom alto */
  @media (max-width: 1050px) {
    .shared-filters {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 12px !important;
    }

    .shared-filters .clear-filters {
      grid-column: 1 / -1 !important;
      width: 100% !important;
      max-width: none !important;
    }

    .shared-kpi {
      justify-self: center !important;
    }

    .evaluation-filter-strip {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 14px !important;
    }

    .evaluation-filters {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 12px !important;
      width: 100% !important;
      min-width: 0 !important;
    }

    .evaluation-filters .filter-group,
    .evaluation-filters .filter-group select {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .evaluation-filters .clear-filters {
      grid-column: 1 / -1 !important;
      width: 100% !important;
      max-width: none !important;
    }

    .evaluation-top-kpis {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
  }

  /* Móvil */
  @media (max-width: 650px) {
    .shared-filters,
    .evaluation-filters {
      grid-template-columns: 1fr !important;
    }

    .shared-filters .clear-filters,
    .evaluation-filters .clear-filters {
      grid-column: auto !important;
    }

    .shared-kpi {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      justify-self: stretch !important;
    }

    .shared-kpi-value {
      width: min(100%, 170px) !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    .evaluation-top-kpis {
      grid-template-columns: 1fr !important;
    }
  }

  /* ==========================================================
     Responsive v3 — corrige solapamiento en sociales
     ========================================================== */

  .social-panel.proposal-social-panel {
    display: grid !important;
    grid-template-columns: minmax(300px, 0.95fr) minmax(340px, 1.05fr) !important;
    gap: 18px !important;
    align-items: start !important;
    min-width: 0 !important;
  }

  .social-left-column,
  .social-right-column {
    min-width: 0 !important;
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 18px !important;
  }

  .proposal-bars-section {
    width: 100% !important;
    min-width: 0 !important;
    height: auto !important;
    overflow: hidden !important;
  }

  .proposal-bars-section .horizontal-bars {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important;
    width: 100% !important;
    min-width: 0 !important;
  }

  .proposal-bars-section .bar-row {
    display: grid !important;
    grid-template-columns: minmax(150px, 1.35fr) minmax(120px, 2fr) minmax(52px, auto) !important;
    align-items: center !important;
    gap: 12px !important;
    width: 100% !important;
    min-width: 0 !important;
  }

  .proposal-bars-section .bar-label,
  .proposal-bars-section .bar-track,
  .proposal-bars-section .bar-value {
    min-width: 0 !important;
  }

  .proposal-bars-section .bar-label {
    overflow-wrap: anywhere !important;
    word-break: break-word !important;
  }

  .proposal-bars-section .bar-value {
    text-align: right !important;
    white-space: nowrap !important;
  }

  @media (max-width: 1450px) {
    .caries-proposal-grid,
    .higiene-proposal-grid,
    .periodontal-proposal-grid {
      grid-template-columns: 1fr !important;
    }
  }

  @media (max-width: 900px) {
    .social-panel.proposal-social-panel {
      grid-template-columns: 1fr !important;
    }

    .proposal-bars-section .bar-row {
      grid-template-columns: minmax(120px, 1.25fr) minmax(100px, 2fr) minmax(48px, auto) !important;
      gap: 10px !important;
    }
  }

  @media (max-width: 560px) {
    .proposal-bars-section .bar-row {
      grid-template-columns: 1fr !important;
      gap: 6px !important;
    }

    .proposal-bars-section .bar-value {
      text-align: left !important;
    }
  }

  /* ==========================================================
     Responsive v4 — filtros de Evaluación sin compresión
     ========================================================== */

  .evaluation-filter-strip {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 14px !important;
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
    container-type: inline-size;
  }

  .evaluation-filters {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)) !important;
    gap: 12px !important;
    align-items: end !important;
    width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box !important;
  }

  .evaluation-filters .filter-group {
    width: 100% !important;
    min-width: 0 !important;
  }

  .evaluation-filters .filter-group label {
    display: block !important;
    width: 100% !important;
    margin-bottom: 7px !important;
    text-align: center !important;
    white-space: normal !important;
    line-height: 1.15 !important;
  }

  .evaluation-filters .filter-group select {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: 46px !important;
    box-sizing: border-box !important;
  }

  .evaluation-filters .clear-filters {
    width: 100% !important;
    min-width: 0 !important;
    max-width: none !important;
    height: 46px !important;
    box-sizing: border-box !important;
    align-self: end !important;
  }

  .evaluation-top-kpis {
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)) !important;
    width: 100% !important;
    min-width: 0 !important;
  }

  @container (max-width: 720px) {
    .evaluation-filters {
      grid-template-columns: 1fr 1fr !important;
    }

    .evaluation-filters .clear-filters {
      grid-column: 1 / -1 !important;
    }
  }

  @container (max-width: 470px) {
    .evaluation-filters {
      grid-template-columns: 1fr !important;
    }

    .evaluation-filters .clear-filters {
      grid-column: auto !important;
    }
  }

  /* ==========================================================
     CARIES — reacomodo solicitado por revisión
     ========================================================== */

  .caries-gravity-section {
    margin-top: 18px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    width: 100% !important;
  }

  .caries-gravity-title {
    margin: 0 0 2px !important;
    text-align: center !important;
    color: #b98212 !important;
    font-size: 1.45rem !important;
    line-height: 1.1 !important;
    font-weight: 800 !important;
  }

  .caries-gravity-row {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 124px !important;
    gap: 18px !important;
    align-items: center !important;
    width: min(100%, 460px) !important;
    margin: 0 auto !important;
  }

  .caries-gravity-copy {
    text-align: center !important;
    color: #1f2a2d !important;
    font-size: 0.9rem !important;
    line-height: 1.15 !important;
    font-weight: 700 !important;
  }

  .caries-gravity-bullet {
    width: 124px !important;
    min-width: 124px !important;
    min-height: 92px !important;
    margin: 0 !important;
  }

  .caries-summary-stack {
    display: flex !important;
    flex-direction: column !important;
    gap: 14px !important;
    width: min(100%, 540px) !important;
    margin: 4px auto 0 !important;
  }

  .caries-summary-card {
    display: grid !important;
    grid-template-columns: 74px minmax(0, 1fr) !important;
    gap: 14px !important;
    align-items: center !important;
    min-height: 98px !important;
    padding: 12px 18px !important;
    border-radius: 16px !important;
    background: #ffffff !important;
    border: 1px solid rgba(23, 63, 58, 0.08) !important;
    box-shadow: 0 8px 20px rgba(30, 48, 55, 0.11) !important;
    box-sizing: border-box !important;
  }

  .caries-summary-icon {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .caries-summary-icon img {
    width: 58px !important;
    height: 58px !important;
    object-fit: contain !important;
  }

  .caries-summary-content {
    min-width: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    justify-content: center !important;
    gap: 5px !important;
  }

  .caries-summary-content strong {
    color: #a91f4b !important;
    font-size: 1.7rem !important;
    line-height: 1 !important;
    font-weight: 800 !important;
  }

  .caries-summary-content span {
    color: #1b5a50 !important;
    font-size: 0.78rem !important;
    line-height: 1.2 !important;
    font-weight: 700 !important;
  }

  .caries-gravity-footnote {
    width: min(100%, 540px) !important;
    margin: 3px auto 0 !important;
    color: #3f4b4f !important;
    font-size: 0.7rem !important;
    line-height: 1.25 !important;
    font-weight: 650 !important;
    text-align: left !important;
  }

  @media (max-width: 620px) {
    .caries-gravity-title {
      font-size: 1.2rem !important;
    }

    .caries-gravity-row {
      grid-template-columns: 1fr !important;
      justify-items: center !important;
      gap: 9px !important;
    }

    .caries-summary-card {
      grid-template-columns: 60px minmax(0, 1fr) !important;
      padding: 11px 13px !important;
    }

    .caries-summary-icon img {
      width: 50px !important;
      height: 50px !important;
    }
  }

  /* ==========================================================
     OTRAS PATOLOGÍAS — alineación y redacción solicitadas
     ========================================================== */

  .otras-patologias-title-final {
    width: 100% !important;
    max-width: none !important;
    margin: 0 0 10px !important;
    text-align: left !important;
    color: #b98212 !important;
    font-size: 1.22rem !important;
    line-height: 1.15 !important;
    font-weight: 800 !important;
  }

  .otras-layout-v2-kpis .otras-boceto-kpi-redaccion {
    min-height: 118px !important;
    padding: 14px 16px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    text-align: center !important;
  }

  .otras-layout-v2-kpis .otras-boceto-kpi-redaccion strong {
    margin: 0 !important;
    color: #a91f4b !important;
    font-size: 2rem !important;
    line-height: 1 !important;
    font-weight: 800 !important;
    text-align: center !important;
  }

  .otras-layout-v2-kpis .otras-boceto-kpi-redaccion .otras-kpi-texto-superior,
  .otras-layout-v2-kpis .otras-boceto-kpi-redaccion .otras-kpi-texto-inferior {
    width: 100% !important;
    margin: 0 !important;
    color: #1b5a50 !important;
    font-size: 0.76rem !important;
    line-height: 1.18 !important;
    font-weight: 700 !important;
    text-align: center !important;
  }

  @media (max-width: 900px) {
    .otras-patologias-title-final {
      text-align: center !important;
    }
  }

  /* ==========================================================
     HOMOLOGACIÓN TIPOGRÁFICA — BLOQUE SOCIAL
     Tarjetas + Antecedentes + Ocupación
     ========================================================== */

  /* Texto descriptivo de las tarjetas sociales:
     "Se consideran migrantes", "Se consideran indígenas",
     "Se encuentran embarazadas". */
  .proposal-social-panel .social-summary-copy > span {
    font-size: 13px !important;
    line-height: 1.2 !important;
    font-weight: 650 !important;
  }

  /* Títulos de las gráficas sociales. */
  .proposal-social-panel .proposal-bars-section > h3 {
    font-size: 16px !important;
    line-height: 1.2 !important;
    font-weight: 700 !important;
  }

  /* Etiquetas de Antecedentes patológicos y Ocupación:
     mismo tamaño que el texto descriptivo de las tarjetas. */
  .proposal-social-panel .proposal-bars-section .bar-label {
    font-size: 13px !important;
    line-height: 1.2 !important;
    font-weight: 650 !important;
  }

  /* Los porcentajes de las barras conservan jerarquía propia. */
  .proposal-social-panel .proposal-bars-section .bar-value {
    font-size: 12px !important;
    line-height: 1.15 !important;
    font-weight: 700 !important;
  }

  @media (max-width: 650px) {
    .proposal-social-panel .social-summary-copy > span,
    .proposal-social-panel .proposal-bars-section .bar-label {
      font-size: 13px !important;
    }

    .proposal-social-panel .proposal-bars-section > h3 {
      font-size: 16px !important;
    }

    .proposal-social-panel .proposal-bars-section .bar-value {
      font-size: 12px !important;
    }
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
          epoReferenciaDecoded: decodeColumnarDataset(data.epo_referencia),
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
          lesionesTiempoDecoded: decodeColumnarDataset(data.lesiones_tiempo),
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
          indicadoresOficialesDecoded: decodeColumnarDataset(
            data.indicadores_oficiales
          ),
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
      const claveSeleccionada =
        claveEntidadMapa(entidad);

      resultado = resultado.filter(
        (item) =>
          claveEntidadMapa(item.entidad) ===
          claveSeleccionada
      );
    }

    if (unidad) {
      resultado = resultado.filter(
        (item) =>
          String(item.unidad_id) ===
          String(unidad)
      );
    }

    return resultado
      .map((item) => {
        const coords =
          coordenadasMapaNormalizadas(item);

        if (!coords) return null;

        return {
          ...item,
          lat: coords.lat,
          lon: coords.lon,
        };
      })
      .filter(Boolean);
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

  const cariesLibreFiltrada = useMemo(
    () =>
      filtrarPorLlave(
        cariesData?.coreDecoded || [],
        '',
        '',
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [cariesData, entidad, unidad, idsUnidadesEntidad]
  );

  // Edentulismo disponible para todas las edades y sensible al filtro de edad.
  // Conserva también mes, entidad y unidad centinela.
  const cariesEdentulismoFiltrada = useMemo(
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

  const periodontalEpoFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        periodontalData?.epoReferenciaDecoded || [],
        '',
        '',
        entidad,
        unidad,
        idsUnidadesEntidad
      ),
    [periodontalData, entidad, unidad, idsUnidadesEntidad]
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

  const otrasLesionesTiempoFiltrado = useMemo(
    () =>
      filtrarPorLlave(
        otrasData?.lesionesTiempoDecoded || [],
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
        edentParcialPct: null,
        sinEdentParcialPct: null,
        edentTotalPct: null,
      };
    }

    const cpodN = sumar(cariesFiltrada, 'cpod_N');
    const cpodSum = sumar(cariesFiltrada, 'cpod_sum');

    // Los tres campos son mutuamente excluyentes por edad.
    // Sumarlos sobre cariesFiltrada permite que CPOD funcione tanto
    // con edades exactas (incluida 6 años) como con grupos adultos
    // del tipo 45-49, 50-54, 80+, etc.
    const CPODN =
      sumar(cariesFiltrada, 'CPOD6_N') +
      sumar(cariesFiltrada, 'CPOD713_N') +
      sumar(cariesFiltrada, 'CPOD14_N');

    const CPODSum =
      sumar(cariesFiltrada, 'CPOD6_sum') +
      sumar(cariesFiltrada, 'CPOD713_sum') +
      sumar(cariesFiltrada, 'CPOD14_sum');

    const libreN = sumar(cariesLibreFiltrada, 'libre_N');
    const libreNume = sumar(cariesLibreFiltrada, 'libre_n');

    const carN = sumar(cariesFiltrada, 'car_N');
    const carNume = sumar(cariesFiltrada, 'car_n');

    const edentParcialN = sumar(
      cariesEdentulismoFiltrada,
      'edentParcial_N'
    );
    const edentParcialNume = sumar(
      cariesEdentulismoFiltrada,
      'edentParcial_n'
    );

    const edentTotalN = sumar(
      cariesEdentulismoFiltrada,
      'edent_N'
    );
    const edentTotalNume = sumar(
      cariesEdentulismoFiltrada,
      'edent_n'
    );

    const cariesPct = porcentaje(carNume, carN);
    const edentParcialPct = porcentaje(
      edentParcialNume,
      edentParcialN
    );

    return {
      cpod: cpodN > 0 ? cpodSum / cpodN : null,
      CPOD: CPODN > 0 ? CPODSum / CPODN : null,
      librePct: porcentaje(libreNume, libreN),
      cariesPct,
      sanosPct:
        cariesPct === null ? null : Math.max(0, 100 - cariesPct),
      edentParcialPct,
      sinEdentParcialPct:
        edentParcialPct === null
          ? null
          : Math.max(0, 100 - edentParcialPct),
      edentTotalPct: porcentaje(
        edentTotalNume,
        edentTotalN
      ),
    };
  }, [
    cariesData,
    cariesFiltrada,
    cariesLibreFiltrada,
    cariesEdentulismoFiltrada,
    edad,
  ]);

  const edentulismoParcialSegmentos = useMemo(
    () =>
      calcularSegmentosPie(
        [
          {
            etiqueta: 'Con edentulismo parcial',
            valor: indicadoresCaries.edentParcialPct,
            color: '#701039',
          },
          {
            etiqueta: 'Dentadura completa',
            valor: indicadoresCaries.sinEdentParcialPct,
            color: '#173f3a',
          },
        ],
        {
          radioInterior: 29,
          radioExterior: 57,
          umbralExterior: 0,
          umbralOcultar: 5,
        }
      ),
    [indicadoresCaries.edentParcialPct, indicadoresCaries.sinEdentParcialPct]
  );

  const edentulismoParcialPieStyle = useMemo(() => {
    const parcial = Number(indicadoresCaries.edentParcialPct);
    const sinParcial = Number(indicadoresCaries.sinEdentParcialPct);

    if (
      !Number.isFinite(parcial) ||
      !Number.isFinite(sinParcial)
    ) {
      return { background: '#e7e7e7' };
    }

    const parcialSeguro = Math.max(0, Math.min(100, parcial));
    const finParcial = parcialSeguro;

    return {
      background: `conic-gradient(
        #701039 0% ${finParcial}%,
        #173f3a ${finParcial}% 100%
      )`,
    };
  }, [
    indicadoresCaries.edentParcialPct,
    indicadoresCaries.sinEdentParcialPct,
  ]);

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

  const higieneSegmentos = useMemo(
    () =>
      calcularSegmentosPie(
        [
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
        ],
        {
          radioInterior: 30,
          radioExterior: 57,
          umbralExterior: 0,
          umbralOcultar: 5,
        }
      ),
    [
      indicadoresHigiene.excelentePct,
      indicadoresHigiene.buenaPct,
      indicadoresHigiene.regularPct,
      indicadoresHigiene.malaPct,
    ]
  );

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

  const indicadoresPeriodontalSonda = useMemo(() => {
    const N = sumar(periodontalCoreFiltrado, 'sonda_N');

    return {
      N,
      normalPct: porcentaje(
        sumar(periodontalCoreFiltrado, 'sonda_normal'),
        N
      ),
      gingivitisPct: porcentaje(
        sumar(periodontalCoreFiltrado, 'sonda_ging'),
        N
      ),
      periodontitisPct: porcentaje(
        sumar(periodontalCoreFiltrado, 'sonda_perio'),
        N
      ),
    };
  }, [periodontalCoreFiltrado]);

  const periodontalEpoReferencia = useMemo(() => {
    const epo18N = sumar(periodontalEpoFiltrado, 'epo18_N');
    const epo18n = sumar(periodontalEpoFiltrado, 'epo18_n');

    const epo3544N = sumar(periodontalEpoFiltrado, 'epo35_44_N');
    const epo3544n = sumar(periodontalEpoFiltrado, 'epo35_44_n');

    const epo60N = sumar(periodontalEpoFiltrado, 'epo60_N');
    const epo60n = sumar(periodontalEpoFiltrado, 'epo60_n');

    return {
      epo18Pct: porcentaje(epo18n, epo18N),
      epo3544Pct: porcentaje(epo3544n, epo3544N),
      epo60Pct: porcentaje(epo60n, epo60N),
    };
  }, [periodontalEpoFiltrado]);

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

    return calcularSegmentosPie(
      categoriasBase.map(
        ([etiqueta, valor, color]) => ({
          etiqueta,
          valor,
          color,
        })
      ),
      {
        radioInterior: 30,
        radioExterior: 57,
        umbralExterior: 0,
        // Los segmentos muy pequeños se muestran con valor
        // en la leyenda para no encimar etiquetas sobre el pastel.
        umbralOcultar: 5,
      }
    );
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

  const periodontalSondaSegmentos = useMemo(
    () =>
      calcularSegmentosPie(
        [
          {
            etiqueta: 'Normal',
            valor: indicadoresPeriodontalSonda.normalPct,
            color: '#173f3a',
          },
          {
            etiqueta: 'Gingivitis',
            valor: indicadoresPeriodontalSonda.gingivitisPct,
            color: '#b38c2e',
          },
          {
            etiqueta: 'Periodontitis',
            valor: indicadoresPeriodontalSonda.periodontitisPct,
            color: '#701039',
          },
        ],
        {
          radioInterior: 30,
          radioExterior: 57,
          umbralExterior: 0,
          umbralOcultar: 5,
        }
      ),
    [
      indicadoresPeriodontalSonda.normalPct,
      indicadoresPeriodontalSonda.gingivitisPct,
      indicadoresPeriodontalSonda.periodontitisPct,
    ]
  );

  const periodontalSondaPieStyle = periodontalSondaSegmentos.length
    ? {
        background: `conic-gradient(${periodontalSondaSegmentos
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

  const lesionesTiempoData = useMemo(() => {
    const acumulado = {};

    otrasLesionesTiempoFiltrado.forEach((item) => {
      const lesion =
        String(item.lesion || '').trim() || 'No especificado';

      if (!acumulado[lesion]) {
        acumulado[lesion] = {
          lesion,
          total: 0,
          lt3: 0,
          gt3: 0,
          sinTiempo: 0,
        };
      }

      acumulado[lesion].total += Number(item.total) || 0;
      acumulado[lesion].lt3 += Number(item.lt3) || 0;
      acumulado[lesion].gt3 += Number(item.gt3) || 0;
      acumulado[lesion].sinTiempo += Number(item.sin_tiempo) || 0;
    });

    const orden = [
      'Úlcera',
      'Leucoplasia bucal',
      'Eritroplasia',
      'Lesión mixta',
      'Aumento de volumen',
    ];

    return Object.values(acumulado).sort((a, b) => {
      const ia = orden.indexOf(a.lesion);
      const ib = orden.indexOf(b.lesion);

      if (ia === -1 && ib === -1) {
        return a.lesion.localeCompare(b.lesion, 'es');
      }

      if (ia === -1) return 1;
      if (ib === -1) return -1;

      return ia - ib;
    });
  }, [otrasLesionesTiempoFiltrado]);

  const totalLesionesTiempoValido = lesionesTiempoData.reduce(
    (acum, item) =>
      acum +
      Number(item.lt3 || 0) +
      Number(item.gt3 || 0),
    0
  );

  const totalLesionesSinTiempoValido = lesionesTiempoData.reduce(
    (acum, item) =>
      acum + Number(item.sinTiempo || 0),
    0
  );

  const maxLesionesTiempo = Math.max(
    1,
    ...lesionesTiempoData.map((item) => item.total || 0)
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
            ? (100 * item.registrados) / esperado
            : null;

        const consistencia =
          esperado > 0
            ? (100 * item.oportunos) / esperado
            : null;

        const calidad =
          esperado > 0
            ? (100 * item.sinInconsistencias) / esperado
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

  const indicadorOficialEvaluacion = useMemo(() => {
    const rows =
      evaluacionData?.indicadoresOficialesDecoded || [];

    if (!rows.length) return null;

    const entidadDeUnidad =
      unidad
        ? unidadesCatalogo.find(
            (item) =>
              Number(item.unidad_id) === Number(unidad)
          )?.entidad || ''
        : '';

    const entidadObjetivo =
      entidad || entidadDeUnidad || 'IMSS-BIENESTAR';

    const claveObjetivo =
      claveEntidadComparacion(entidadObjetivo);

    const encontrado = rows.find(
      (item) =>
        claveEntidadComparacion(item.entidad) ===
        claveObjetivo
    );

    return encontrado || null;
  }, [
    evaluacionData,
    entidad,
    unidad,
    unidadesCatalogo,
  ]);

  const ponderadoOficialEvaluacion = useMemo(() => {
    if (!indicadorOficialEvaluacion) return null;

    const cobertura =
      Number(indicadorOficialEvaluacion.cobertura);
    const consistencia =
      Number(indicadorOficialEvaluacion.consistencia);
    const calidad =
      Number(indicadorOficialEvaluacion.calidad);

    if (
      !Number.isFinite(cobertura) ||
      !Number.isFinite(consistencia) ||
      !Number.isFinite(calidad)
    ) {
      return null;
    }

    return (
      cobertura * 0.2 +
      consistencia * 0.3 +
      calidad * 0.5
    );
  }, [indicadorOficialEvaluacion]);

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

  const sexoSegmentos = calcularSegmentosPie(
    sexoData.items.map((item, index) => ({
      etiqueta: item.etiqueta,
      valor: item.valor,
      color:
        sexoColores[
          index % sexoColores.length
        ],
    })),
    {
      radioInterior: 28,
      radioExterior: 57,
      umbralExterior: 0,
      umbralOcultar: 5,
    }
  );

  const cariesSegmentos = calcularSegmentosPie(
    [
      {
        etiqueta: 'Con caries',
        valor: indicadoresCaries.cariesPct,
        color: '#701039',
      },
      {
        etiqueta: 'Sanos',
        valor: indicadoresCaries.sanosPct,
        color: '#173f3a',
      },
    ],
    {
      radioInterior: 29,
      radioExterior: 57,
      umbralExterior: 0,
      umbralOcultar: 5,
    }
  );



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
                    Bucales (SIVEPAB) tiene por objetivo la captación de
                    información sobre enfermedades y padecimientos bucales
                    en la población mexicana, funciona como un sistema de
                    vigilancia centinela, con unidades en las 32 entidades
                    del país.
                  </p>

                  <p>
                    En este tablero interactivo encontrará información de
                    interés epidemiológico sobre la salud bucal de la
                    población usuaria de las unidades centinela en las 24
                    Coordinaciones Estatales de IMSS-BIENESTAR.
                  </p>

                  <p>
                    En los filtros de la parte superior puede seleccionar la
                    entidad, unidad centinela, mes y grupo de edad de interés;
                    en el menú del lado izquierdo puede seleccionar los
                    eventos bajo vigilancia por este sistema.
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

                      <MapAutoFit
                        puntos={puntosMapa}
                        vistaNacional={!entidad && !unidad}
                        entidadSeleccionada={entidad}
                      />
                    </MapContainer>
                  </div>

                  <div className="map-footer">
                    <span>
                      Unidades con coordenadas mostradas: {puntosMapa.length}
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
                            <PieLabels
                              segmentos={sexoSegmentos}
                              decimales={1}
                            />
                          </div>

                          <div className="sex-legend">
                            {sexoSegmentos.map((item) => (
                              <div
                                className="sex-legend-row"
                                key={item.etiqueta}
                              >
                                <span
                                  className="sex-legend-dot"
                                  style={{
                                    background: item.color,
                                  }}
                                ></span>
                                <span>
                                  <PieLegendText
                                    item={item}
                                    decimales={1}
                                  />
                                </span>
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
                          <PieLabels
                            segmentos={cariesSegmentos}
                            decimales={0}
                          />
                        </div>

                        <div className="proposal-pie-legend">
                          {cariesSegmentos.map((item) => (
                            <span key={item.etiqueta}>
                              <i
                                className="legend-square"
                                style={{ background: item.color }}
                              ></i>
                              <PieLegendText
                                item={item}
                                decimales={0}
                              />
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="proposal-pie-block edent-partial-block">
                        <h3>Frecuencia de edentulismo parcial</h3>

                        <div
                          className="proposal-solid-pie"
                          style={edentulismoParcialPieStyle}
                        >
                          <PieLabels
                            segmentos={edentulismoParcialSegmentos}
                            decimales={1}
                          />
                        </div>

                        <div className="proposal-pie-legend">
                          {edentulismoParcialSegmentos.map((item) => (
                            <span key={item.etiqueta}>
                              <i
                                className="legend-square"
                                style={{ background: item.color }}
                              ></i>
                              <PieLegendText
                                item={item}
                                decimales={1}
                              />
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="caries-gravity-section">
                      <h3 className="caries-gravity-title">
                        Gravedad de caries dental:
                      </h3>

                      <div className="caries-gravity-row">
                        <div className="caries-gravity-copy">
                          En pacientes con dentición
                          <br />
                          permanente*:
                        </div>

                        <div className="proposal-index-card proposal-index-CPOD caries-gravity-bullet">
                          <strong>
                            {formatoNumero(indicadoresCaries.CPOD)}
                          </strong>
                          <span>CPOD</span>
                        </div>
                      </div>

                      <div className="caries-gravity-row">
                        <div className="caries-gravity-copy">
                          En pacientes con dentición
                          <br />
                          temporal:
                        </div>

                        <div className="proposal-index-card proposal-index-cpod caries-gravity-bullet">
                          <strong>
                            {formatoNumero(indicadoresCaries.cpod)}
                          </strong>
                          <span>cpod</span>
                        </div>
                      </div>

                      <div className="caries-summary-stack">
                        <div className="caries-summary-card">
                          <div className="caries-summary-icon" aria-hidden="true">
                            <img src={iconCaries} alt="" />
                          </div>

                          <div className="caries-summary-content">
                            <strong>
                              {formatoPorcentaje(
                                indicadoresCaries.librePct,
                                1
                              )}
                            </strong>
                            <span>
                              de las niñas, niños y adolescentes están libres
                              de caries dental
                            </span>
                          </div>
                        </div>

                        <div className="caries-summary-card">
                          <div className="caries-summary-icon" aria-hidden="true">
                            <img src={iconCaries} alt="" />
                          </div>

                          <div className="caries-summary-content">
                            <strong>
                              {indicadoresCaries.edentTotalPct === null ||
                              indicadoresCaries.edentTotalPct === undefined ||
                              !Number.isFinite(
                                Number(indicadoresCaries.edentTotalPct)
                              )
                                ? '—'
                                : formatoPorcentaje(
                                    Number(indicadoresCaries.edentTotalPct),
                                    1
                                  )}
                            </strong>
                            <span>
                              de los usuarios presentan edentulismo total
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="caries-gravity-footnote">
                        *Se incluyen personas a partir de los 6 años por el
                        inicio del recambio dentario.
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


                      <div className="mini-section proposal-sex-section">
                        <h3>Sexo</h3>

                        <div className="sex-chart-wrap">
                          <div
                            className="sex-pie"
                            style={sexoPieStyle}
                          >
                            <PieLabels
                              segmentos={sexoSegmentos}
                              decimales={1}
                            />
                          </div>

                          <div className="sex-legend">
                            {sexoSegmentos.map((item) => (
                              <div
                                className="sex-legend-row"
                                key={item.etiqueta}
                              >
                                <span
                                  className="sex-legend-dot"
                                  style={{
                                    background: item.color,
                                  }}
                                ></span>
                                <span>
                                  <PieLegendText
                                    item={item}
                                    decimales={1}
                                  />
                                </span>
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
                            <PieLabels
                              segmentos={higieneSegmentos}
                              decimales={1}
                            />
                          </div>
                        </div>

                        <div className="hygiene-legend">
                          {higieneSegmentos.map((item) => (
                            <div key={item.etiqueta}>
                              <i
                                style={{
                                  background: item.color,
                                }}
                              ></i>
                              <span>
                                <PieLegendText
                                  item={item}
                                  decimales={1}
                                />
                              </span>
                            </div>
                          ))}
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

                      <div className="mini-section proposal-sex-section">
                        <h3>Sexo</h3>
                        <div className="sex-chart-wrap">
                          <div className="sex-pie" style={sexoPieStyle}>
                            <PieLabels
                              segmentos={sexoSegmentos}
                              decimales={1}
                            />
                          </div>

                          <div className="sex-legend">
                            {sexoSegmentos.map((item) => (
                              <div
                                className="sex-legend-row"
                                key={item.etiqueta}
                              >
                                <span
                                  className="sex-legend-dot"
                                  style={{
                                    background: item.color,
                                  }}
                                ></span>
                                <span>
                                  <PieLegendText
                                    item={item}
                                    decimales={1}
                                  />
                                </span>
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

                  <article className="periodontal-state-panel">
                    <h2>Evaluación del estado periodontal</h2>

                    <div className="periodontal-distributions-grid">
                      <div className="periodontal-chart-block periodontal-probe-block">
                        <h3>Índice Periodontal Comunitario (sonda OMS)</h3>

                        <div className="periodontal-chart-row periodontal-chart-row-centered">
                          <div className="periodontal-pie-wrap">
                            <div
                              className="periodontal-pie"
                              style={periodontalPieStyle}
                            >
                              <PieLabels
                                segmentos={periodontalSegmentos}
                                decimales={1}
                              />
                            </div>

                            <div className="periodontal-inline-legend">
                              {periodontalSegmentos.map((item) => (
                                <div
                                  className="periodontal-inline-legend-row"
                                  key={item.etiqueta}
                                >
                                  <span
                                    className="periodontal-inline-legend-dot"
                                    style={{ background: item.color }}
                                  ></span>
                                  <span className="periodontal-inline-legend-text">
                                    <PeriodontalLegendText
                                      item={item}
                                      decimales={1}
                                    />
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="periodontal-chart-block periodontal-probe-block">
                        <h3>Evaluación con otro tipo de sonda</h3>

                        <div className="periodontal-chart-row periodontal-chart-row-centered">
                          <div className="periodontal-pie-wrap">
                            <div
                              className="periodontal-probe-pie"
                              style={periodontalSondaPieStyle}
                            >
                              <PieLabels
                                segmentos={periodontalSondaSegmentos}
                                decimales={1}
                              />
                            </div>

                            <div className="periodontal-inline-legend">
                              {periodontalSondaSegmentos.map((item) => (
                                <div
                                  className="periodontal-inline-legend-row"
                                  key={item.etiqueta}
                                >
                                  <span
                                    className="periodontal-inline-legend-dot"
                                    style={{ background: item.color }}
                                  ></span>
                                  <span className="periodontal-inline-legend-text">
                                    <PeriodontalLegendText
                                      item={item}
                                      decimales={1}
                                    />
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="periodontal-epo-section">
                      <h3>
                        Porcentaje de usuarios con enfermedad periodontal a la edad de:
                      </h3>

                      <div className="periodontal-epo-grid">
                        <div className="periodontal-epo-card">
                          <span>18 años</span>
                          <strong>
                            {formatoPorcentaje(
                              periodontalEpoReferencia.epo18Pct,
                              1
                            )}
                          </strong>
                        </div>

                        <div className="periodontal-epo-card">
                          <span>35 a 44 años</span>
                          <strong>
                            {formatoPorcentaje(
                              periodontalEpoReferencia.epo3544Pct,
                              1
                            )}
                          </strong>
                        </div>

                        <div className="periodontal-epo-card">
                          <span>60 años</span>
                          <strong>
                            {formatoPorcentaje(
                              periodontalEpoReferencia.epo60Pct,
                              1
                            )}
                          </strong>
                        </div>
                      </div>
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

                      <div className="mini-section proposal-sex-section">
                        <h3>Sexo</h3>

                        <div className="sex-chart-wrap">
                          <div
                            className="sex-pie"
                            style={sexoPieStyle}
                          >
                            <PieLabels
                              segmentos={sexoSegmentos}
                              decimales={1}
                            />
                          </div>

                          <div className="sex-legend">
                            {sexoSegmentos.map((item) => (
                              <div
                                className="sex-legend-row"
                                key={item.etiqueta}
                              >
                                <span
                                  className="sex-legend-dot"
                                  style={{
                                    background: item.color,
                                  }}
                                ></span>
                                <span>
                                  <PieLegendText
                                    item={item}
                                    decimales={1}
                                  />
                                </span>
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

                  <article className="otras-state-panel boceto-otras">
                    <div className="otras-layout-v2">
                      <div className="otras-layout-v2-top">
                        <h3 className="otras-boceto-title">
                          Lesiones en mucosa bucal
                        </h3>

                        {lesionesTiempoData.length === 0 ? (
                          <div className="otras-no-data">
                            Sin lesiones registradas para la selección.
                          </div>
                        ) : totalLesionesTiempoValido === 0 ? (
                          <div className="lesion-temporal-empty">
                            <div className="lesion-temporal-empty-card">
                              <strong>
                                Sin registros con tiempo de evolución válido
                                para la selección.
                              </strong>

                              <span>
                                Se identificaron{' '}
                                <b>
                                  {Number(
                                    totalLesionesSinTiempoValido
                                  ).toLocaleString('es-MX')}
                                </b>{' '}
                                registros de lesión sin un tiempo de evolución
                                válido, por lo que no se representan en las
                                barras por temporalidad.
                              </span>
                            </div>

                            <div className="lesion-temporal-empty-note">
                              {Number(
                                indicadoresOtras.sinLesion || 0
                              ).toLocaleString('es-MX')}{' '}
                              pacientes no registraron lesión.
                            </div>
                          </div>
                        ) : (
                          <div className="lesion-grouped-chart">
                            <div className="lesion-grouped-plot">
                              {lesionesTiempoData.map((item) => {
                                const maxValor = Math.max(
                                  1,
                                  ...lesionesTiempoData.flatMap((x) => [
                                    Number(x.lt3 || 0),
                                    Number(x.gt3 || 0),
                                  ])
                                );

                                const lt3 = Number(item.lt3 || 0);
                                const gt3 = Number(item.gt3 || 0);

                                const altoLt3 =
                                  maxValor > 0
                                    ? (100 * lt3) / maxValor
                                    : 0;

                                const altoGt3 =
                                  maxValor > 0
                                    ? (100 * gt3) / maxValor
                                    : 0;

                                return (
                                  <div
                                    className="lesion-group"
                                    key={item.lesion}
                                  >
                                    <div className="lesion-bars">
                                      <div className="lesion-vbar-wrap">
                                        <div
                                          className="lesion-vbar lt3"
                                          style={{
                                            height: `${Math.max(
                                              lt3 > 0 ? 2 : 0,
                                              altoLt3
                                            )}%`,
                                          }}
                                          title={`Menos de 3 semanas: ${lt3.toLocaleString(
                                            'es-MX'
                                          )}`}
                                        >
                                          {lt3 > 0 && (
                                            <span className="lesion-vbar-value">
                                              {lt3.toLocaleString('es-MX')}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="lesion-vbar-wrap">
                                        <div
                                          className="lesion-vbar gt3"
                                          style={{
                                            height: `${Math.max(
                                              gt3 > 0 ? 2 : 0,
                                              altoGt3
                                            )}%`,
                                          }}
                                          title={`Más de 3 semanas: ${gt3.toLocaleString(
                                            'es-MX'
                                          )}`}
                                        >
                                          {gt3 > 0 && (
                                            <span className="lesion-vbar-value">
                                              {gt3.toLocaleString('es-MX')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="lesion-group-label">
                                      {item.lesion}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="lesion-grouped-legend lesion-grouped-legend-bottom">
                              <span>
                                <i style={{ background: '#a71f4d' }}></i>
                                Menos de 3 semanas
                              </span>

                              <span>
                                <i style={{ background: '#235d53' }}></i>
                                Más de 3 semanas
                              </span>
                            </div>

                            <div className="lesion-grouped-note">
                              <strong>
                                {Number(
                                  indicadoresOtras.sinLesion || 0
                                ).toLocaleString('es-MX')}
                              </strong>{' '}
                              pacientes no registraron lesión.

                              {totalLesionesSinTiempoValido > 0 && (
                                <>
                                  {' '}
                                  Además,{' '}
                                  <strong>
                                    {Number(
                                      totalLesionesSinTiempoValido
                                    ).toLocaleString('es-MX')}
                                  </strong>{' '}
                                  registros de lesión no contaron con tiempo
                                  de evolución válido y no se representan en
                                  las barras por temporalidad.
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <h3 className="otras-boceto-title otras-patologias-title-final">
                        Otras patologías presentes en la cavidad bucal
                      </h3>

                      <div className="otras-layout-v2-bottom">
                        <div className="otras-layout-v2-summary">
                          <div className="otras-layout-v2-kpis">
                            <div className="otras-boceto-kpi otras-boceto-kpi-redaccion">
                              <span className="otras-kpi-texto-superior">
                                Se realizó el diagnóstico de fluorosis en el
                              </span>

                              <strong>
                                {formatoPorcentaje(
                                  indicadoresOtras.fluorPct,
                                  1
                                )}
                              </strong>

                              <span className="otras-kpi-texto-inferior">
                                de los usuarios
                              </span>
                            </div>

                            <div className="otras-boceto-kpi otras-boceto-kpi-redaccion">
                              <span className="otras-kpi-texto-superior">
                                Se identificaron otras patologías en el
                              </span>

                              <strong>
                                {formatoPorcentaje(
                                  indicadoresOtras.otraPct,
                                  1
                                )}
                              </strong>

                              <span className="otras-kpi-texto-inferior">
                                de los usuarios
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="otras-layout-v2-diagnosticos">
                          <div className="otras-boceto-diagnosticos">
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
                                        {Number(
                                          item.n || 0
                                        ).toLocaleString('es-MX')}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
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
                    formatosEsperados={
                      indicadoresEvaluacion.formatosEsperados
                    }
                  />

                  <div className="evaluation-content-card final-evaluation-card">
                    <div className="evaluation-row">
                      <div className="evaluation-score-card eval-wine">
                        <strong>
                          {formatoPorcentaje(
                            Number(
                              indicadorOficialEvaluacion?.cobertura
                            ),
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
                            Number(
                              indicadorOficialEvaluacion?.consistencia
                            ),
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
                            Number(
                              indicadorOficialEvaluacion?.calidad
                            ),
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
                      <div className="evaluation-pending-card">
                        <strong>
                          {formatoPorcentaje(
                            ponderadoOficialEvaluacion,
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
