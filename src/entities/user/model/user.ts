import { z } from 'zod';

/** A DummyJSON user (the shape `/auth/me` returns). */
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  gender: z.string().optional(),
  image: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

/** The `/auth/login` and `/auth/refresh` body: a user plus the token pair. */
export const authResponseSchema = userSchema.extend({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
