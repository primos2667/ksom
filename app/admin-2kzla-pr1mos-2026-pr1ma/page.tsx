import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // FINAL CHECK - Only emails in admin_users table can pass
  const { data: isAdmin } = await supabase
    .from("admin_users")
    .select("email")
    .eq("email", user.email)
    .single();

  if (!isAdmin) redirect("/");

  // Secure! Show admin panel
  return <AdminClient adminEmail={user.email!} />;
}