import { createFileRoute, redirect } from "@tanstack/react-router";

import * as m from "@/paraglide/messages";
import { RegisterForm } from "@/features/auth/components/register-form";
import { AuthSplitLayout } from "@/features/auth/components/auth-split-layout";
import { seoMeta } from "@/shared/lib/seo";

export const Route = createFileRoute("/register")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/leagues" });
    }
  },
  head: () => seoMeta({ title: m["register_title"](), description: m["auth.register.subtitle"]() }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <AuthSplitLayout>
      <RegisterForm />
    </AuthSplitLayout>
  );
}
