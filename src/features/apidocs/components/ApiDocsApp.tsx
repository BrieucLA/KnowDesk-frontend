import React, { useState } from 'react';

type Lang = 'curl' | 'js' | 'python';

const BASE_URL = 'https://knowdesk-production.up.railway.app/public/v1';

interface Endpoint {
  method:      'GET' | 'POST' | 'DELETE';
  path:        string;
  title:       string;
  description: string;
  params?:     { name: string; type: string; required: boolean; description: string }[];
  response:    string;
  examples:    Record<Lang, string>;
}

const ENDPOINTS: Endpoint[] = [
  {
    method:      'GET',
    path:        '/categories',
    title:       'Lister les catégories',
    description: 'Retourne toutes les catégories de votre base de connaissance.',
    response: JSON.stringify({
      data: [
        { id: "uuid", name: "Livraisons", parent_id: null, position: 0 },
        { id: "uuid", name: "Retours",    parent_id: null, position: 1 },
      ],
      error: null,
    }, null, 2),
    examples: {
      curl: `curl https://knowdesk-production.up.railway.app/public/v1/categories \\
  -H "X-API-Key: kd_live_votre_cle_api"`,
      js: `const response = await fetch(
  'https://knowdesk-production.up.railway.app/public/v1/categories',
  { headers: { 'X-API-Key': 'kd_live_votre_cle_api' } }
);
const { data } = await response.json();`,
      python: `import requests

r = requests.get(
    'https://knowdesk-production.up.railway.app/public/v1/categories',
    headers={'X-API-Key': 'kd_live_votre_cle_api'}
)
categories = r.json()['data']`,
    },
  },
  {
    method:      'GET',
    path:        '/articles',
    title:       'Lister les articles',
    description: 'Retourne les articles publiés. La liste ne contient pas le contenu HTML — utilisez l\'endpoint de détail pour récupérer le contenu complet.',
    params: [
      { name: 'categoryId', type: 'uuid',   required: false, description: 'Filtrer par catégorie' },
      { name: 'page',       type: 'number', required: false, description: 'Numéro de page (défaut : 1)' },
      { name: 'perPage',    type: 'number', required: false, description: 'Résultats par page (défaut : 20, max : 100)' },
    ],
    response: JSON.stringify({
      data: [
        { id: "uuid", title: "Guide de retour produit", status: "published", version: 2, updated_at: "2026-04-19T17:12:17.171Z", category_id: "uuid", category_name: "Livraisons" },
      ],
      error: null,
    }, null, 2),
    examples: {
      curl: `curl "https://knowdesk-production.up.railway.app/public/v1/articles?page=1&perPage=20" \\
  -H "X-API-Key: kd_live_votre_cle_api"`,
      js: `const response = await fetch(
  'https://knowdesk-production.up.railway.app/public/v1/articles?page=1&perPage=20',
  { headers: { 'X-API-Key': 'kd_live_votre_cle_api' } }
);
const { data } = await response.json();`,
      python: `import requests

r = requests.get(
    'https://knowdesk-production.up.railway.app/public/v1/articles',
    headers={'X-API-Key': 'kd_live_votre_cle_api'},
    params={'page': 1, 'perPage': 20}
)
articles = r.json()['data']`,
    },
  },
  {
    method:      'GET',
    path:        '/articles/:id',
    title:       'Détail d\'un article',
    description: 'Retourne le contenu complet d\'un article publié, incluant le HTML.',
    response: JSON.stringify({
      data: {
        id: "uuid",
        title: "Guide de retour produit",
        content: { html: "<p>Contenu de l'article...</p>" },
        status: "published",
        version: 2,
        updated_at: "2026-04-19T17:12:17.171Z",
        category_id: "uuid",
        category_name: "Livraisons",
        author_email: "admin@exemple.fr",
      },
      error: null,
    }, null, 2),
    examples: {
      curl: `curl https://knowdesk-production.up.railway.app/public/v1/articles/ARTICLE_ID \\
  -H "X-API-Key: kd_live_votre_cle_api"`,
      js: `const response = await fetch(
  \`https://knowdesk-production.up.railway.app/public/v1/articles/\${articleId}\`,
  { headers: { 'X-API-Key': 'kd_live_votre_cle_api' } }
);
const { data } = await response.json();
console.log(data.content.html);`,
      python: `import requests

r = requests.get(
    f'https://knowdesk-production.up.railway.app/public/v1/articles/{article_id}',
    headers={'X-API-Key': 'kd_live_votre_cle_api'}
)
article = r.json()['data']
print(article['content']['html'])`,
    },
  },
  {
    method:      'GET',
    path:        '/trees',
    title:       'Lister les processus guidés',
    description: 'Retourne les processus guidés publiés. Utilisez l\'endpoint de détail pour récupérer les nœuds et réponses.',
    response: JSON.stringify({
      data: [
        { id: "uuid", title: "Processus de remboursement", description: "Arbre guidé pour les demandes de remboursement", updated_at: "2026-04-21T18:39:21.206Z", category_id: null, category_name: null },
      ],
      error: null,
    }, null, 2),
    examples: {
      curl: `curl https://knowdesk-production.up.railway.app/public/v1/trees \\
  -H "X-API-Key: kd_live_votre_cle_api"`,
      js: `const response = await fetch(
  'https://knowdesk-production.up.railway.app/public/v1/trees',
  { headers: { 'X-API-Key': 'kd_live_votre_cle_api' } }
);
const { data } = await response.json();`,
      python: `import requests

r = requests.get(
    'https://knowdesk-production.up.railway.app/public/v1/trees',
    headers={'X-API-Key': 'kd_live_votre_cle_api'}
)
trees = r.json()['data']`,
    },
  },
  {
    method:      'GET',
    path:        '/trees/:id',
    title:       'Détail d\'un processus guidé',
    description: 'Retourne la structure complète d\'un processus guidé avec tous ses nœuds et réponses.',
    response: JSON.stringify({
      data: {
        id: "uuid",
        title: "Processus de remboursement",
        nodes: [
          {
            id: "uuid",
            type: "question",
            content: "Le produit est-il défectueux ?",
            parent_id: null,
            parent_answer_id: null,
            answers: [
              { id: "uuid", label: "Oui", position: 0 },
              { id: "uuid", label: "Non", position: 1 },
            ],
          },
          {
            id: "uuid",
            type: "conclusion",
            content: "Remboursement intégral accordé.",
            parent_id: "uuid",
            parent_answer_id: "uuid",
            answers: [],
          },
        ],
      },
      error: null,
    }, null, 2),
    examples: {
      curl: `curl https://knowdesk-production.up.railway.app/public/v1/trees/TREE_ID \\
  -H "X-API-Key: kd_live_votre_cle_api"`,
      js: `const response = await fetch(
  \`https://knowdesk-production.up.railway.app/public/v1/trees/\${treeId}\`,
  { headers: { 'X-API-Key': 'kd_live_votre_cle_api' } }
);
const { data } = await response.json();
// data.nodes contient tous les nœuds avec leurs réponses`,
      python: `import requests

r = requests.get(
    f'https://knowdesk-production.up.railway.app/public/v1/trees/{tree_id}',
    headers={'X-API-Key': 'kd_live_votre_cle_api'}
)
tree = r.json()['data']
nodes = tree['nodes']`,
    },
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    '#10B981',
  POST:   '#3B82F6',
  DELETE: '#EF4444',
};

const LANG_LABELS: Record<Lang, string> = {
  curl:   'cURL',
  js:     'JavaScript',
  python: 'Python',
};

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [lang, setLang] = useState<Lang>('curl');
  const [open, setOpen] = useState(false);

  return (
    <div className={`apidoc-endpoint ${open ? 'apidoc-endpoint--open' : ''}`}>
      <button
        type="button"
        className="apidoc-endpoint__header"
        onClick={() => setOpen(o => !o)}
      >
        <span
          className="apidoc-endpoint__method"
          style={{ background: METHOD_COLORS[endpoint.method] }}
        >
          {endpoint.method}
        </span>
        <code className="apidoc-endpoint__path">{endpoint.path}</code>
        <span className="apidoc-endpoint__title">{endpoint.title}</span>
        <span className="apidoc-endpoint__chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="apidoc-endpoint__body">
          <p className="apidoc-endpoint__desc">{endpoint.description}</p>

          {endpoint.params && endpoint.params.length > 0 && (
            <div className="apidoc-params">
              <h4 className="apidoc-params__title">Paramètres</h4>
              <table className="apidoc-params__table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Type</th>
                    <th>Requis</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {endpoint.params.map(p => (
                    <tr key={p.name}>
                      <td><code>{p.name}</code></td>
                      <td><span className="apidoc-type">{p.type}</span></td>
                      <td>{p.required ? '✓' : '—'}</td>
                      <td>{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="apidoc-examples">
            <div className="apidoc-examples__tabs">
              {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
                <button
                  key={l}
                  type="button"
                  className={`apidoc-examples__tab ${lang === l ? 'apidoc-examples__tab--active' : ''}`}
                  onClick={() => setLang(l)}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
            <pre className="apidoc-code"><code>{endpoint.examples[lang]}</code></pre>
          </div>

          <div className="apidoc-response">
            <h4 className="apidoc-response__title">Exemple de réponse</h4>
            <pre className="apidoc-code apidoc-code--response"><code>{endpoint.response}</code></pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApiDocsApp() {
  return (
    <div className="apidoc">
      {/* Header */}
      <header className="apidoc-header">
        <div className="apidoc-header__inner">
          <div className="apidoc-header__brand">
            <span className="login-page__logo-mark apidoc-header__logo">K</span>
            <div>
              <h1 className="apidoc-header__title">KnowDesk API</h1>
              <p className="apidoc-header__subtitle">Documentation de l'API publique v1</p>
            </div>
          </div>
          <a href="/" className="apidoc-header__login">← Retour à l'application</a>
        </div>
      </header>

      <div className="apidoc-layout">
        {/* Sidebar */}
        <nav className="apidoc-sidebar">
          <div className="apidoc-sidebar__section">
            <p className="apidoc-sidebar__label">Démarrage</p>
            <a href="#auth"        className="apidoc-sidebar__link">Authentification</a>
            <a href="#errors"      className="apidoc-sidebar__link">Erreurs</a>
            <a href="#pagination"  className="apidoc-sidebar__link">Pagination</a>
          </div>
          <div className="apidoc-sidebar__section">
            <p className="apidoc-sidebar__label">Endpoints</p>
            <a href="#categories"  className="apidoc-sidebar__link">Catégories</a>
            <a href="#articles"    className="apidoc-sidebar__link">Articles</a>
            <a href="#trees"       className="apidoc-sidebar__link">Processus guidés</a>
          </div>
        </nav>

        {/* Contenu */}
        <main className="apidoc-main">

          {/* Authentification */}
          <section id="auth" className="apidoc-section">
            <h2 className="apidoc-section__title">Authentification</h2>
            <p className="apidoc-section__text">
              Toutes les requêtes doivent inclure votre clé API dans le header <code>X-API-Key</code>.
              Vous pouvez générer une clé depuis <strong>Paramètres → API</strong> dans votre espace KnowDesk.
            </p>
            <pre className="apidoc-code"><code>{`curl https://knowdesk-production.up.railway.app/public/v1/articles \\
  -H "X-API-Key: kd_live_votre_cle_api"`}</code></pre>
            <div className="apidoc-callout apidoc-callout--warn">
              Ne partagez jamais votre clé API. Si elle est compromise, révoquez-la immédiatement depuis Paramètres → API.
            </div>
          </section>

          {/* Erreurs */}
          <section id="errors" className="apidoc-section">
            <h2 className="apidoc-section__title">Erreurs</h2>
            <p className="apidoc-section__text">
              L'API retourne toujours un objet JSON avec les champs <code>data</code> et <code>error</code>.
              En cas d'erreur, <code>data</code> est <code>null</code> et <code>error</code> contient le message.
            </p>
            <table className="apidoc-params__table">
              <thead><tr><th>Code HTTP</th><th>Signification</th></tr></thead>
              <tbody>
                <tr><td><code>200</code></td><td>Succès</td></tr>
                <tr><td><code>401</code></td><td>Clé API manquante ou invalide</td></tr>
                <tr><td><code>403</code></td><td>Espace désactivé</td></tr>
                <tr><td><code>404</code></td><td>Ressource introuvable</td></tr>
                <tr><td><code>500</code></td><td>Erreur serveur</td></tr>
              </tbody>
            </table>
          </section>

          {/* Pagination */}
          <section id="pagination" className="apidoc-section">
            <h2 className="apidoc-section__title">Pagination</h2>
            <p className="apidoc-section__text">
              Les endpoints de liste supportent les paramètres <code>page</code> et <code>perPage</code>.
              La valeur maximale de <code>perPage</code> est <code>100</code>.
            </p>
            <pre className="apidoc-code"><code>{`GET /articles?page=2&perPage=50`}</code></pre>
          </section>

          {/* Catégories */}
          <section id="categories" className="apidoc-section">
            <h2 className="apidoc-section__title">Catégories</h2>
            {ENDPOINTS.filter(e => e.path.startsWith('/categories')).map(e => (
              <EndpointCard key={e.path} endpoint={e} />
            ))}
          </section>

          {/* Articles */}
          <section id="articles" className="apidoc-section">
            <h2 className="apidoc-section__title">Articles</h2>
            {ENDPOINTS.filter(e => e.path.startsWith('/articles')).map(e => (
              <EndpointCard key={e.path} endpoint={e} />
            ))}
          </section>

          {/* Processus guidés */}
          <section id="trees" className="apidoc-section">
            <h2 className="apidoc-section__title">Processus guidés</h2>
            {ENDPOINTS.filter(e => e.path.startsWith('/trees')).map(e => (
              <EndpointCard key={e.path} endpoint={e} />
            ))}
          </section>

        </main>
      </div>
    </div>
  );
}
