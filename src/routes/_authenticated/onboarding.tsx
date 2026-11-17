import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/ui-kit";
import { ProfileForm } from "@/components/ProfileForm";
import { useUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — Futuroute" },
      {
        name: "description",
        content: "Tell Futuroute about your interests, capabilities, budget and goals.",
      },
      { property: "og:title", content: "Set up your profile — Futuroute" },
      { property: "og:description", content: "Personalise your career exploration." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user, refreshUser } = useUser();
  const nav = useNavigate();
  return (
    <AppShell>
      <PageHeader
        eyebrow="Personalised onboarding"
        title="Let's get to know you"
        text="This takes about two minutes. You can skip optional fields and update anything later from your profile."
      />
      <div className="max-w-3xl">
        {user && (
          <ProfileForm
            wizard
            userId={user.uid}
            email={user.email ?? undefined}
            defaultName={user.displayName ?? undefined}
            emailVerified={user.emailVerified}
            onRefreshAuth={refreshUser}
            submitLabel="Finish & open Dashboard"
            onSaved={() => nav({ to: "/dashboard" })}
          />
        )}
      </div>
    </AppShell>
  );
}
