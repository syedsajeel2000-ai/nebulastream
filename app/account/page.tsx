import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import AccountForms from "@/components/AccountForms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account Settings" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <div className="anim-fade-in mx-auto max-w-[860px] px-4 py-10 sm:px-6 lg:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">Account Settings</h1>
        <p className="mt-1 text-sm text-dim">Changes are saved to the database immediately.</p>
      </header>
      <AccountForms
        user={{ fullName: user.fullName, username: user.username, email: user.email }}
        memberSince={user.createdAt}
      />
    </div>
  );
}
