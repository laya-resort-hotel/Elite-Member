type PromotionCardProps = {
  title: string;
  summary: string;
  image: string;
};

export function PromotionCard({
  title,
  summary,
  image,
}: PromotionCardProps) {
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
