import { useRef } from "react";
import { clientReviews, deliveryPhotos } from "./reviews";

export function ClientReviews({ full = false }: { full?: boolean }) {
  const root = useRef<HTMLElement>(null);
  if (!full) return (
    <section className="section client-reviews reviews-preview" aria-label="Отзывы клиентов">
      <div className="section-head">
        <div><span className="eyebrow">После передачи ключей</span><h2>Отзывы довольных клиентов</h2></div>
        <a className="text-link" href="/reviews/">Все отзывы и фотографии ↗</a>
      </div>
      <div className="reviews-preview-grid">
        {clientReviews.map(review => (
          <a className="review-preview" key={review.id} href={`/reviews/#${review.id}`}>
            <img src={review.poster} alt="" width="720" height="1280" loading="lazy" />
            <div className="review-preview-copy">
              <span className="review-preview-meta">Видеоотзыв · {review.durationLabel}</span>
              <h3>{review.title}</h3>
              <span className="review-preview-action">Смотреть отзыв <span aria-hidden="true">↗</span></span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
  return (
    <section className={`section client-reviews ${full ? "is-full" : ""}`} ref={root} aria-label="Видеоотзывы клиентов">
      <div className="reviews-videos">
        {clientReviews.map((review, index) => (
          <article className="review-video" key={review.id} id={review.id} aria-labelledby={`${review.id}-title`}>
            <video controls playsInline preload="none" poster={review.poster} width="720" height="1280"
              aria-labelledby={`${review.id}-title`}
              onPlay={event => {
                root.current?.querySelectorAll("video").forEach(video => {
                  if (video !== event.currentTarget) video.pause();
                });
              }}>
              <source src={review.src} type="video/mp4" />
              Ваш браузер не поддерживает видео. <a href={review.src}>Скачать отзыв</a>
            </video>
            <div className="review-video-caption">
              <div className="review-video-meta"><span>Видео {String(index + 1).padStart(2, "0")}</span><time dateTime={review.duration}>{review.durationLabel}</time></div>
              <h3 id={`${review.id}-title`}>{review.title}</h3>
              <p>{review.description}</p>
            </div>
          </article>
        ))}
      </div>
      {full && (
        <div className="review-deliveries">
          <h2>Выдача автомобилей клиентам</h2>
          <div className="review-photos">
            {deliveryPhotos.map(({ id, title, width, height }) => (
              <figure key={id}>
                <a href={`/media/reviews/${id}-1200.webp`} target="_blank" rel="noreferrer" aria-label={`${title}, открыть фотографию`}>
                  <img src={`/media/reviews/${id}-640.webp`} alt={title} loading="lazy" width={width} height={height} />
                </a>
                <figcaption>{title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
