import { z } from 'zod';

export const SessionType = z.enum(['one-on-one', 'group', 'video-analysis']);
export type SessionType = z.infer<typeof SessionType>;

export const BookingStatus = z.enum(['confirmed', 'completed', 'cancelled']);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const BookingSchema = z.object({
  id: z.string().uuid(),
  surferId: z.string().uuid(),
  coachId: z.string().uuid(),
  sessionType: SessionType,
  startTime: z.date(),
  endTime: z.date(),
  status: BookingStatus,
  stripePaymentId: z.string().nullable(),
  amount: z.number().positive().describe('Total in cents'),
  platformFee: z.number().nonnegative().describe('15% platform fee in cents'),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Booking = z.infer<typeof BookingSchema>;

export const CreateBookingSchema = BookingSchema.omit({
  id: true,
  status: true,
  stripePaymentId: true,
  platformFee: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateBooking = z.infer<typeof CreateBookingSchema>;
