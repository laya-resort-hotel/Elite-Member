import { useEffect, useState } from 'react';
import { getNewsItems } from '../../lib/services/residentService';
import type { NewsItem } from '../../lib/types';

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getNewsItems().then(setItems).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load news.'));
  }, []);

  if (error) return <div className="status-card error-text">{error}</div>;
  if (!items.length) return <div className="status-card">Loading news and promotions…</div>;

  return (
    <div className="stack-lg">
      {items.map((item) => (
        <article key={item.id} className="panel">
          <span className="pill alt">{item.category}</span>
          <h3>{item.title}</h3>
          <p>{item.excerpt}</p>
          {item.body ? <p className="muted">{item.body}</p> : null}
        </article>
      ))}
    </div>
  );
}
