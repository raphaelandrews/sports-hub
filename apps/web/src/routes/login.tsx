import { createFileRoute, redirect } from "@tanstack/react-router";

import * as m from "@/paraglide/messages";
import { LoginForm } from "@/features/auth/components/login-form";
import { AuthSplitLayout } from "@/features/auth/components/auth-split-layout";
import { seoMeta } from "@/shared/lib/seo";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/leagues" });
    }
  },
  head: () => seoMeta({ title: m["login_title"](), description: m["auth.login.subtitle"]() }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthSplitLayout>
      <LoginForm />
    </AuthSplitLayout>
  );
}
