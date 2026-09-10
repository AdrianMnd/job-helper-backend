import { env } from '../config/env';
import { generateContent } from './geminiService';

export interface JobSearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
}

export interface JobSearchFilters {
  salaryMin?: number;
  salaryMax?: number;
  contractHours?: 'full_time' | 'part_time';
  contractType?: 'permanent' | 'contract';
  sortBy?: 'relevance' | 'date' | 'salary';
  maxDaysOld?: number;
  remoteOnly?: boolean;
}

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created: string;
}

// Cache en memoria simple (no persistida): el tier gratuito de Adzuna tiene
// un limite diario de peticiones, y es habitual que el usuario repita o
// afine ligeramente la misma busqueda varias veces seguidas. TTL corto
// (10 min) evita gastar cuota en busquedas identicas sin llegar a servir
// resultados desactualizados de verdad.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { data: JobSearchResult[]; expiresAt: number }>();

const REMOTE_KEYWORDS = /remoto|teletrabajo|remote|home\s?office/i;

function normalizeJob(job: AdzunaJob): JobSearchResult {
  return {
    id: job.id,
    title: job.title,
    company: job.company?.display_name ?? 'Empresa no especificada',
    location: job.location?.display_name ?? '',
    description: job.description,
    url: job.redirect_url,
    salaryMin: job.salary_min ?? null,
    salaryMax: job.salary_max ?? null,
    createdAt: job.created,
  };
}

// Adzuna Espana indexa mayoritariamente en espanol - "developer" devuelve
// varias veces mas resultados que "frontend developer" en ingles literal.
// Traducimos el termino de busqueda antes de consultar la API, sin tocar
// terminos que el usuario ya escribio en espanol.
async function translateQueryToSpanish(query: string): Promise<string> {
  const systemPrompt = `Traduce terminos de busqueda de empleo al espanol de España, de forma
literal y corta. Si el termino ya esta en espanol, devuelvelo tal cual. Responde
UNICAMENTE con el termino traducido, sin comillas ni explicaciones.`;

  try {
    const translated = await generateContent(systemPrompt, query, { temperature: 0.1, topP: 0.9 });
    return translated.trim() || query;
  } catch {
    // Si Gemini falla (503, etc.), degradamos a la busqueda original en vez
    // de romper el buscador entero por un problema de traduccion.
    return query;
  }
}

export async function searchJobs(
  query: string,
  location: string,
  filters: JobSearchFilters = {}
): Promise<JobSearchResult[]> {
  const translatedQuery = await translateQueryToSpanish(query);
  const cacheKey = JSON.stringify({ translatedQuery, location, filters });
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const params = new URLSearchParams({
    app_id: env.adzunaAppId,
    app_key: env.adzunaAppKey,
    results_per_page: '20',
    what: translatedQuery,
    where: location,
    'content-type': 'application/json',
  });

  if (filters.salaryMin) params.set('salary_min', String(filters.salaryMin));
  if (filters.salaryMax) params.set('salary_max', String(filters.salaryMax));
  if (filters.contractHours) params.set(filters.contractHours, '1');
  if (filters.contractType) params.set(filters.contractType, '1');
  if (filters.sortBy && filters.sortBy !== 'relevance') params.set('sort_by', filters.sortBy);
  if (filters.maxDaysOld) params.set('max_days_old', String(filters.maxDaysOld));

  // "es" fija el mercado a Espana. Si algun dia se quisiera buscar en otros
  // paises, este valor tendria que ser parametrizable en vez de constante.
  console.log('Adzuna URL:', `https://api.adzuna.com/v1/api/jobs/es/search/1?${params}`);
  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/es/search/1?${params}`);

  if (!res.ok) {
    throw new Error(`Adzuna respondio con estado ${res.status}`);
  }

  const data = (await res.json()) as { results: AdzunaJob[] };
  let results = data.results.map(normalizeJob);

  // Adzuna no tiene un filtro nativo de "solo remoto" - aproximamos
  // buscando palabras clave en titulo y descripcion. No es exacto (una
  // oferta remota que no use estas palabras se escaparia), pero es la
  // mejor senal disponible sin depender de scraping.
  if (filters.remoteOnly) {
    results = results.filter((job) => REMOTE_KEYWORDS.test(job.title) || REMOTE_KEYWORDS.test(job.description));
  }

  cache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL_MS });
  return results;
}
