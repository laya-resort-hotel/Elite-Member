type NewsCardProps = {
  title: string;
  summary: string;
  image: string;
};

export function NewsCard({ title, summary, image }: NewsCardProps) {
  return (
    <article className="content-card">
      <img src={image} alt={title} className="content-card__image" />
      <div className="content-card__body">
        <h3>{title}</h3>
        <p>{summary}</p>
      </div>
    </article>
  );
}
