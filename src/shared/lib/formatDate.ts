export function formatRelative(isoString: string | Date | null | undefined): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const now    = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin  = Math.floor(diffMs / 1000 / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay  = Math.floor(diffHour / 24);

  if (diffMin  < 1)   return 'à l\'instant';
  if (diffMin  < 60)  return `il y a ${diffMin} min`;
  if (diffHour < 24)  return `il y a ${diffHour}h`;
  if (diffDay  === 1) return 'hier';
  if (diffDay  < 7)   return `il y a ${diffDay} jours`;

  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
}

export function formatFull(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}
