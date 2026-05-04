import { createFileRoute, redirect } from "@tanstack/react-router";

import { RegisterForm } from "@/features/auth/components/register-form";
import { AuthSplitLayout } from "@/features/auth/components/auth-split-layout";

export const Route = createFileRoute("/register")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/leagues" });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <AuthSplitLayout>
      <RegisterForm />
    </AuthSplitLayout>
  );
}
