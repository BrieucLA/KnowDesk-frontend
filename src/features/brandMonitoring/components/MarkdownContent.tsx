import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  text: string;
}

/** Rend du markdown (titres, listes, **gras**, *italique*, code, tableaux,
 *  liens, citations `[1]`) en HTML safe. Utilisé pour afficher les réponses
 *  brutes Mistral / Perplexity dans Brand Monitoring sans avoir à passer
 *  par TipTap (overkill pour de la lecture seule).
 *
 *  Sécurité : react-markdown ne rend pas le raw HTML par défaut, donc
 *  même un contenu malveillant inséré par un LLM ne peut pas injecter
 *  de script. Les liens sont rendus avec target="_blank" + rel safe. */
export function MarkdownContent({ text }: MarkdownContentProps) {
  return (
    <div className="bm-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
