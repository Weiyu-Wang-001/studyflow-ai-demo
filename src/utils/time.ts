function isProbablyISODateString(value: string): boolean {
  // Covers typical server timestamps like 2026-05-07T08:44:28.901Z
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
}

export function formatRelativeTime(input: string, now: Date = new Date()): string {
  if (!input) return '';

  // If it's already human-friendly ("2 days ago"), keep it.
  if (!isProbablyISODateString(input)) return input;

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;

  const diffMs = now.getTime() - date.getTime();
  // Future dates or near-now: treat as "just now"
  if (diffMs < 30_000) return 'just now';

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return `${diffSeconds} sec ago`;
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;

  if (diffWeeks === 1) return '1 week ago';
  return `${diffWeeks} weeks ago`;
}

