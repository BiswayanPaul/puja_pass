import type { Review } from "@/types";
import { pandals } from "./pandals";

const templates = [
  { author: "Ananya Sen", rating: 5, comment: "Absolutely breathtaking at night. The timed pass meant we were inside in under fifteen minutes." },
  { author: "Rohit Chatterjee", rating: 4, comment: "Beautiful theme and well-managed queues. Go early on Ashtami if you want to avoid the rush." },
  { author: "Priya Ghosh", rating: 5, comment: "Took my parents here — volunteers were helpful and the seating area was a blessing." },
  { author: "Arjun Mukherjee", rating: 4, comment: "The craftsmanship is stunning. Food stalls outside were a bit crowded but worth it." },
];

export const reviews: Review[] = pandals.flatMap((pandal, pandalIndex) =>
  [0, 1, 2].map((index) => {
    const pick = templates[(pandalIndex + index) % templates.length];
    return {
      id: `${pandal.id}-review-${index}`,
      pandalId: pandal.id,
      author: pick.author,
      rating: pick.rating,
      date: `2025-10-0${index + 1}`,
      comment: pick.comment,
    };
  }),
);
