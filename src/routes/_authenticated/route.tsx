import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { waitForAuthUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const user = await waitForAuthUser();
    if (!user) {
      throw redirect({ to: "/auth", search: { next: location.href } });
    }
  },
  component: () => <Outlet />,
});
