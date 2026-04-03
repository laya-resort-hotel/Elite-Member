import { mockNews } from '../../lib/mockData';

export default function NewsPage() {
  return (
    <div className="stack-lg">
      {mockNews.map((item) => (
        <article key={item.id} className="panel">
          <span className="pill alt">{item.category}</span>
          <h3>{item.title}</h3>
          <p>{item.excerpt}</p>
          <button className="secondary-button" type="button">
            Read More
          </button>
        </article>
      ))}
    </div>
  );
}
