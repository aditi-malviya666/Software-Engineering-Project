import { email, min, object, string } from "zod";

export const loginSchema = object({
  email: email(),
  password: string().min(8, "Password must be at least 8 characters"),
});
