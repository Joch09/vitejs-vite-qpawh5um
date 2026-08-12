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

import logoImssBienestar from './assets/logos/Logo_imssb.png';
import logoVigilancia from './assets/logos/LOGO_BLANCO_V.png';

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
  { campo: 'embarazo', etiqueta: 'Embarazo' },
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

function filtrarPorLlave(
  rows,
  edad,
  mes,
  entidad,
  unidad,
  idsUnidadesEntidad
) {
  return rows.filter((item) => {
    if (edad && Number(item.edad) !== Number(edad)) return false;
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
  edades,
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
          <label htmlFor="edad">Edad</label>

          <select
            id="edad"
            value={edad}
            onChange={(event) => setEdad(event.target.value)}
          >
            <option value="">Todas</option>

            {edades.map((item) => (
              <option key={item} value={item}>
                {item} años
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

function App() {
  const [catalogos, setCatalogos] = useState(null);
  const [mapa, setMapa] = useState([]);
  const [resumenNacional, setResumenNacional] = useState(null);
  const [cariesData, setCariesData] = useState(null);
  const [higieneData, setHigieneData] = useState(null);
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
    ])
      .then(([catalogosData, mapaData, resumenData]) => {
        setCatalogos(catalogosData);
        setMapa(Array.isArray(mapaData) ? mapaData : []);
        setResumenNacional(resumenData);
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

  const edades = catalogos?.filtros?.edades || [];
  const meses = catalogos?.filtros?.meses || [];
  const unidadesCatalogo = catalogos?.filtros?.unidades || [];

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

  const ocupacionData = useMemo(() => {
    const acumulado = {};

    ocupacionFiltrada.forEach((item) => {
      const etiqueta =
        String(item.ocupacion || '').trim() || 'No especificado';

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

  const higieneOcupacionData = useMemo(() => {
    const acumulado = {};

    higieneOcupacionFiltrada.forEach((item) => {
      const etiqueta =
        String(item.ocupacion || '').trim() || 'No especificado';

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

  const kpiSinInconsistencias =
    resumenNacional?.kpi_global
      ?.cuestionarios_registrados_sin_inconsistencias ?? null;

  const filtroProps = {
    edades,
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
                    Estatales. Puede seleccionar del menú del lado izquierdo
                    el apartado de interés, incluyendo el cálculo de
                    indicadores por entidad y unidad centinela. Seleccione de
                    los filtros de la parte de arriba.
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
                        <div
                          className="generic-social-icon"
                          aria-hidden="true"
                        >
                          🧳
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
                        <div
                          className="generic-social-icon"
                          aria-hidden="true"
                        >
                          👥
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
                        <h3>Antecedentes</h3>

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
                        <div
                          className="generic-social-icon"
                          aria-hidden="true"
                        >
                          🧳
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
                        <div
                          className="generic-social-icon"
                          aria-hidden="true"
                        >
                          👥
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

                      <div className="mini-section proposal-sex-section">
                        <h3>Sexo</h3>

                        <div className="higiene-sex-bars">
                          {higieneSexoData.items.map((item, index) => (
                            <div
                              className="higiene-sex-row"
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
                                      : '#8b8b8b',
                                }}
                              ></span>

                              <span className="higiene-sex-name">
                                {item.etiqueta}
                              </span>

                              <div className="higiene-sex-track">
                                <div
                                  className="higiene-sex-fill"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      item.valor || 0
                                    )}%`,
                                    background:
                                      index === 0
                                        ? '#701039'
                                        : index === 1
                                        ? '#173f3a'
                                        : '#8b8b8b',
                                  }}
                                ></div>
                              </div>

                              <strong>
                                {formatoPorcentaje(item.valor, 1)}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="social-right-column">
                      <div className="mini-section proposal-bars-section">
                        <h3>Antecedentes</h3>

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
                        <div
                          className="hygiene-pie"
                          style={higienePieStyle}
                        ></div>

                        <div className="hygiene-legend">
                          <div>
                            <i
                              style={{
                                background: higieneColores[0],
                              }}
                            ></i>
                            <span>Excelente</span>
                            <strong>
                              {formatoPorcentaje(
                                indicadoresHigiene.excelentePct,
                                1
                              )}
                            </strong>
                          </div>

                          <div>
                            <i
                              style={{
                                background: higieneColores[1],
                              }}
                            ></i>
                            <span>Buena</span>
                            <strong>
                              {formatoPorcentaje(
                                indicadoresHigiene.buenaPct,
                                1
                              )}
                            </strong>
                          </div>

                          <div>
                            <i
                              style={{
                                background: higieneColores[2],
                              }}
                            ></i>
                            <span>Regular</span>
                            <strong>
                              {formatoPorcentaje(
                                indicadoresHigiene.regularPct,
                                1
                              )}
                            </strong>
                          </div>

                          <div>
                            <i
                              style={{
                                background: higieneColores[3],
                              }}
                            ></i>
                            <span>Mala</span>
                            <strong>
                              {formatoPorcentaje(
                                indicadoresHigiene.malaPct,
                                1
                              )}
                            </strong>
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

          {!['inicio', 'caries', 'higiene'].includes(vista) && (
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
