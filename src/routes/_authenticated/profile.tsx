import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui-kit";
import { ProfileForm } from "@/components/ProfileForm";
import { useUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile — Futuroute" },
      { name: "description", content: "Update your interests, capabilities, budget and goals." },
      { property: "og:title", content: "My profile — Futuroute" },
      { property: "og:description", content: "Manage your Futuroute profile." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, refreshUser } = useUser();
  return (
    <AppShell>
      <PageHeader
        title="My profile"
        text={user?.email ? `Signed in as ${user.email}` : undefined}
      />
      <div className="max-w-3xl">
        {user && (
          <ProfileForm
            userId={user.uid}
            email={user.email ?? undefined}
            defaultName={user.displayName ?? undefined}
            emailVerified={user.emailVerified}
            onRefreshAuth={refreshUser}
            submitLabel="Save profile changes"
          />
        )}
      </div>
    </AppShell>
  );
}
