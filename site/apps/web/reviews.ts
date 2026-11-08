// Shared by the visible cards and the server-side structured data.
// uploadDate is the confirmed addition to this site, not the filming date.
export const clientReviews = [
  {
    id: "video-1",
    title: "Выдача клиенту — Игорь",
    description: "Выдача автомобиля клиенту Игорю. В видео он делится впечатлениями о покупке и сопровождении сделки.",
    durationLabel: "0:30",
    duration: "PT30.433S",
    uploadDate: "2026-11-07",
    src: "/media/reviews/review-1.mp4",
    poster: "/media/reviews/review-1-poster.webp",
  },
  {
    id: "video-2",
    title: "Выдача клиенту — Сергей",
    description: "Выдача автомобиля клиенту Сергею. В видео он рассказывает о поддержке и консультациях на каждом этапе покупки.",
    durationLabel: "0:29",
    duration: "PT29.167S",
    uploadDate: "2026-11-07",
    src: "/media/reviews/review-2.mp4",
    poster: "/media/reviews/review-2-poster.webp",
  },
] as const;

export const deliveryPhotos = [
  { id: "delivery-nissan", title: "Nissan · выдача клиенту", width: 640, height: 721 },
  { id: "delivery-volkswagen", title: "Volkswagen · выдача клиенту", width: 640, height: 389 },
] as const;
