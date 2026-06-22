import { AlertCircle } from 'lucide-react';

export function EmptyState({ title, text }) {
  return (
    <article className="empty-state">
      <AlertCircle />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
