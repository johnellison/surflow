import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  senderId: z.string().uuid(),
  body: z.string().min(1),
  mediaUrl: z.string().url().nullable(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

export const CreateMessageSchema = MessageSchema.omit({
  id: true,
  readAt: true,
  createdAt: true,
});
export type CreateMessage = z.infer<typeof CreateMessageSchema>;
