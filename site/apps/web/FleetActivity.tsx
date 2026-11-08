import activity from "../../data/home-activity.json";

// Company totals supplied by the owner; independent of published catalog entries.
export function FleetActivity() {
  return (
    <section className="fleet-overview" aria-label="Наличие и поставка автомобилей">
      <div className="fleet-catalog-top"><a className="text-link" href="/cars/">Перейти в каталог <span aria-hidden="true">↗</span></a></div>
      <div className="fleet-activity" aria-label="Автомобили CarPort China сейчас">
      <dl className="fleet-totals">
        {[
          { key: "ordered", count: activity.ordered, label: "Заказаны" },
          { key: "transit", count: activity.inTransit, label: "В пути" },
          { key: "stock", count: activity.inStock, label: "В наличии" },
        ].map(({ key, count, label }) => (
          <div className={`fleet-total fleet-total-${key}`} key={key}>
            <dt><span className="fleet-lights" aria-hidden="true"><i /><i /><i /></span>{label}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
      </div>
    </section>
  );
}
