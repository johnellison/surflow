import { z } from 'zod';

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  bookingId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  coachId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  text: z.string().min(1),
  coachResponse: z.string().nullable(),
  createdAt: z.date(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewSchema = ReviewSchema.omit({
  id: true,
  coachResponse: true,
  createdAt: true,
});
export type CreateReview = z.infer<typeof CreateReviewSchema>;
