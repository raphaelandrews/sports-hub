import { Button } from "@sports-system/ui/components/button";
import { Field, FieldLabel } from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import * as m from "@/paraglide/messages";
import { AuthCard } from "@/features/auth/components/auth-card";
import { loginFn } from "@/features/auth/server/auth";

function syncAccessTokenCookie(accessToken: string) {
  document.cookie = `access_token=${accessToken}; path=/; max-age=1800; SameSite=Lax`;
}

export function LoginForm() {
  const router = useRouter();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const tokens = await loginFn({ data: value });
        syncAccessTokenCookie(tokens.access_token);
        await router.invalidate();
        await navigate({ to: "/leagues" });
      } catch (err) {
        if (err instanceof Error) {
          setServerError(err.message);
          toast.error(err.message);
        }
      }
    },
  });

  return (
    <AuthCard
      title={m['login_title']()}
      subtitle={m['auth.login.subtitle']()}
      switchText={
        <>
          {m['login_no_account']()}{" "}
          <Link to="/register" className="text-sm font-semibold text-primary no-underline! hover:underline!">
            {m['login_register']()}
          </Link>
        </>
      }
      onFormSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => (!value.trim() ? m['auth.login.emailRequired']() : undefined),
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel className="text-xs font-medium text-muted-foreground" htmlFor="email">{m['login_email']()}</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={m['auth.register.emailPlaceholder']()}
              autoComplete="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="h-12 w-full rounded-lg border border-input bg-input px-6 pr-4 border-none! text-sm text-foreground placeholder:text-placeholder outline-none transition-colors focus:border-primary"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-destructive-foreground text-xs">{field.state.meta.errors[0]}</p>
            )}
          </Field>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => (!value ? m['auth.login.passwordRequired']() : undefined),
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel className="text-xs font-medium text-muted-foreground" htmlFor="password">{m['login_password']()}</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="h-12 w-full rounded-lg border border-input bg-input px-6 pr-4 border-none! text-sm text-foreground placeholder:text-placeholder outline-none transition-colors focus:border-primary"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-destructive-foreground text-xs">{field.state.meta.errors[0]}</p>
            )}
          </Field>
        )}
      </form.Field>

      {serverError && <p className="text-destructive-foreground text-sm">{serverError}</p>}

      <Field>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50" disabled={isSubmitting}>
              {isSubmitting ? m['auth.login.submitting']() : m['login_submit']()}
            </Button>
          )}
        </form.Subscribe>
      </Field>
    </AuthCard>
  );
}
