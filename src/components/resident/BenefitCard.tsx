type BenefitCardProps = {
  title: string;
  category: string;
  shortDescription: string;
};

export function BenefitCard({
  title,
  category,
  shortDescription,
}: BenefitCardProps) {
  return (
    <article className="benefit-card">
      <span className="benefit-card__category">{category}</span>
      <h3>{title}</h3>
      <p>{shortDescription}</p>
    </article>
  );
}
