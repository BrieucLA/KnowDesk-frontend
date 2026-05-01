import DOMPurify, { type Config } from 'dompurify';

/**
 * Profil "rich content" pour le contenu d'un article (généré par l'éditeur Tiptap
 * côté contributeur). On autorise les balises de mise en forme courantes plus le
 * tag <mark> utilisé par les highlights de recherche. Tout le reste — y compris
 * scripts, iframes, attributs `on...` — est strippé.
 */
const RICH_CONFIG: Config = {
  ALLOWED_TAGS: [
    'a', 'b', 'i', 'u', 'em', 'strong', 'mark',
    'p', 'br', 'span', 'div',
    'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'img',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|knowdesk:\/\/article\/)/i,
};

const HIGHLIGHT_CONFIG: Config = {
  ALLOWED_TAGS: ['mark'],
  ALLOWED_ATTR: [],
};

/** Sanitize un contenu d'article HTML (inputs contributeur). */
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, RICH_CONFIG) as unknown as string;
}

/**
 * Sanitize un fragment qui ne devrait contenir que des balises <mark> de
 * highlight (titles + excerpts du backend search). Garde la défense en
 * profondeur même si le backend est fiable.
 */
export function sanitizeHighlight(html: string): string {
  return DOMPurify.sanitize(html, HIGHLIGHT_CONFIG) as unknown as string;
}
