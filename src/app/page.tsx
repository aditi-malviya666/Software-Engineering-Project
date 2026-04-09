import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  DEFAULT_GUEST_REDIRECT,
  DEFAULT_LOGGEDUSER_REDIRECT,
} from "../../routes";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user?.id) {
    redirect(DEFAULT_LOGGEDUSER_REDIRECT);
  }

  redirect(DEFAULT_GUEST_REDIRECT);
}
