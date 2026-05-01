import React from 'react';
import { CodeBlock } from './CodeBlock';
import { BASE_URL } from '../utils/makeExamples';

const AUTH_EXAMPLE = `curl ${BASE_URL}/articles \\
  -H "X-API-Key: kd_live_votre_cle_api"`;

const PAGINATION_EXAMPLE = `GET /articles?page=2&perPage=50`;

interface ErrorRow {
  code:        number;
  meaning:     string;
}

const ERROR_TABLE: ErrorRow[] = [
  { code: 200, meaning: 'Succès' },
  { code: 401, meaning: 'Clé API manquante ou invalide' },
  { code: 403, meaning: 'Espace désactivé' },
  { code: 404, meaning: 'Ressource introuvable' },
  { code: 409, meaning: 'Conflit (ex: ressource déjà existante)' },
  { code: 422, meaning: 'Données invalides (validation)' },
  { code: 429, meaning: 'Trop de requêtes (rate limit)' },
  { code: 500, meaning: 'Erreur serveur' },
];

export function GettingStarted() {
  return (
    <>
      {/* Authentification */}
      <section id="auth" className="apidoc-section">
        <h2 className="apidoc-section__title">Authentification</h2>
        <p className="apidoc-section__text">
          Toutes les requêtes doivent inclure votre clé API dans le header <code>X-API-Key</code>.
          Vous pouvez générer une clé depuis <strong>Paramètres → API</strong> dans votre espace KnowDesk.
        </p>
        <CodeBlock code={AUTH_EXAMPLE} />
        <div className="apidoc-callout apidoc-callout--warn">
          Ne partagez jamais votre clé API. Si elle est compromise, révoquez-la immédiatement
          depuis Paramètres → API.
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
            {ERROR_TABLE.map(row => (
              <tr key={row.code}>
                <td><code>{row.code}</code></td>
                <td>{row.meaning}</td>
              </tr>
            ))}
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
        <CodeBlock code={PAGINATION_EXAMPLE} hideCopy />
      </section>
    </>
  );
}
