// Shared by the visible cards and the server-side structured data.
// uploadDate is the confirmed addition to this site, not the filming date.
export const clientReviews = [
  {
    id: "video-1",
    title: "Выдача тёмного кроссовера",
    description: "Встреча с новой машиной: клиенты и автомобиль в день выдачи. Короткое видео от CarPort China.",
    durationLabel: "0:30",
    duration: "PT30.433S",
    uploadDate: "2026-11-07",
    src: "/media/reviews/review-1.mp4",
    poster: "/media/reviews/review-1-poster.webp",
  },
  {
    id: "video-2",
    title: "Выдача белого кроссовера",
    description: "Белый кроссовер с красным бантом в день выдачи. Видео с передачи автомобиля клиентам CarPort China.",
    durationLabel: "0:29",
    duration: "PT29.167S",
    uploadDate: "2026-11-07",
    src: "/media/reviews/review-2.mp4",
    poster: "/media/reviews/review-2-poster.webp",
  },
] as const;

export const deliveryPhotos = [
  { id: "delivery-nissan", title: "Nissan · день выдачи", width: 640, height: 721 },
  { id: "delivery-volkswagen", title: "Volkswagen · день выдачи", width: 640, height: 389 },
] as const;
