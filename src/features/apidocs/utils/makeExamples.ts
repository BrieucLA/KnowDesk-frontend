import type { EndpointExamples } from './types';

export const BASE_URL = 'https://api.knowdesk.fr/public/v1';

interface MakeExamplesOpts {
  /** Path, peut contenir `:id` ou `:foo` qui sera substitué par `${UPPER_FOO}`. */
  path:           string;
  /** Exemple de query string (sera affiché tel quel dans curl/JS, en dict pour Python). */
  query?:         Record<string, string | number>;
  /** Nom de la variable client pour l'ID dans les exemples (par défaut dérivé du path). */
  pathParamLabel?: string;
}

function applyPathParams(path: string, pathParamLabel?: string): string {
  // Remplace :foo par ARTICLE_ID, TREE_ID, etc. — pour les exemples curl
  return path.replace(/:(\w+)/g, (_, name) => {
    if (pathParamLabel) return pathParamLabel.toUpperCase();
    return `${name.toUpperCase()}`;
  });
}

function jsTemplatePath(path: string): string {
  // Pour les exemples JS : utilise des template literals avec ${articleId}
  return path.replace(/:(\w+)/g, (_, name) => '${' + name + '}');
}

function pythonFstringPath(path: string): string {
  // Pour Python : f-string avec {article_id}
  return path.replace(/:(\w+)/g, (_, name) => {
    const snake = name.replace(/([A-Z])/g, '_$1').toLowerCase();
    return `{${snake}}`;
  });
}

function buildQueryString(query?: Record<string, string | number>): string {
  if (!query) return '';
  const parts = Object.entries(query).map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

function pythonDict(query: Record<string, string | number>): string {
  const parts = Object.entries(query).map(([k, v]) => {
    const val = typeof v === 'number' ? v : `'${v}'`;
    return `'${k}': ${val}`;
  });
  return `{${parts.join(', ')}}`;
}

const HEADERS_HINT = `'X-API-Key': 'kd_live_votre_cle_api'`;

/** Génère les 3 exemples (curl/JS/Python) à partir d'une seule définition. */
export function makeExamples(opts: MakeExamplesOpts): EndpointExamples {
  const { path, query, pathParamLabel } = opts;

  const curlPath   = applyPathParams(path, pathParamLabel);
  const jsPath     = jsTemplatePath(path);
  const pyPath     = pythonFstringPath(path);
  const queryStr   = buildQueryString(query);
  const hasPathParam = path.includes(':');

  // ── cURL
  const curl =
    `curl "${BASE_URL}${curlPath}${queryStr}" \\\n  -H "X-API-Key: kd_live_votre_cle_api"`;

  // ── JavaScript
  const jsUrl = hasPathParam
    ? `\`${BASE_URL}${jsPath}${queryStr}\``
    : `'${BASE_URL}${jsPath}${queryStr}'`;
  const js = `const response = await fetch(
  ${jsUrl},
  { headers: { ${HEADERS_HINT} } }
);
const { data } = await response.json();`;

  // ── Python
  const pyUrl    = `'${BASE_URL}${pyPath}'`;
  const pyParams = query ? `,\n    params=${pythonDict(query)}` : '';
  const python = `import requests

r = requests.get(
    ${hasPathParam ? `f${pyUrl.replace(/^'/, "'")}` : pyUrl},
    headers={${HEADERS_HINT.replace(/'/g, "'")}}${pyParams}
)
data = r.json()['data']`;

  return { curl, js, python };
}
