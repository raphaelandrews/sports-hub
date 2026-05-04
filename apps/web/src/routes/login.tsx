import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginForm } from "@/features/auth/components/login-form";
import { AuthSplitLayout } from "@/features/auth/components/auth-split-layout";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/leagues" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthSplitLayout>
      <LoginForm />
    </AuthSplitLayout>
  );
}
