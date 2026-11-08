// Shared by the visible cards and the server-side structured data.
// First public release completed at 2026-11-08T12:56:17Z, not the filming/import date.
// Evidence: github.com/zoyroyx/carportchina/actions/runs/42482215174 (Deploy via FTP).
export const clientReviews = [
  {
    id: "video-1",
    title: "Выдача клиенту — Игорь",
    description: "Выдача автомобиля клиенту Игорю. В видео он делится впечатлениями о покупке и сопровождении сделки.",
    durationLabel: "0:30",
    duration: "PT30.433S",
    uploadDate: "2026-11-08T15:56:17+03:00",
    src: "/media/reviews/review-1.mp4",
    poster: "/media/reviews/review-1-poster.webp",
  },
  {
    id: "video-2",
    title: "Выдача клиенту — Сергей",
    description: "Выдача автомобиля клиенту Сергею. В видео он рассказывает о поддержке и консультациях на каждом этапе покупки.",
    durationLabel: "0:29",
    duration: "PT29.167S",
    uploadDate: "2026-11-08T15:56:17+03:00",
    src: "/media/reviews/review-2.mp4",
    poster: "/media/reviews/review-2-poster.webp",
  },
] as const;

export const deliveryPhotos = [
  { id: "delivery-nissan", title: "Николай · Nissan", width: 640, height: 721 },
  { id: "delivery-volkswagen", title: "Дарья · Volkswagen", width: 640, height: 389 },
] as const;
