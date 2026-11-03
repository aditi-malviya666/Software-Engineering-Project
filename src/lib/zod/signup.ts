import { email, object, string } from "zod";

export const signupSchema = object({
  name: string().min(2, "Name must be at least 2 characters"),
  email: email("Please enter a valid email address"),
  password: string().min(6, "Password must be at least 6 characters"),
  confirmPassword: string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
