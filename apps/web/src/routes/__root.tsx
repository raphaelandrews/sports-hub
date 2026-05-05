import { Toaster } from "@sports-system/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";

import { getLocale } from "@/paraglide/runtime";
import { m } from "@/paraglide/messages";
import { DashboardViewportLoading } from "@/shared/components/layouts/dashboard-content-loading";
import { SocialLayout } from "@/shared/components/layouts/social";
import { ErrorScreen } from "@/shared/components/layouts/error-screen";
import { NotFoundScreen } from "@/shared/components/layouts/not-found-screen";
import { getSessionFn } from "@/features/auth/server/auth";
import { useThemeAssets } from "@/shared/hooks/use-theme-assets";

import appCss from "@/index.css?url";

const AUTH_PATHS = ["/login", "/register", "/auth/oauth/callback"];

export interface RouterAppContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async () => {
    const session = await getSessionFn();
    return { session };
  },
  errorComponent: ErrorScreen,
  notFoundComponent: NotFoundScreen,
  pendingComponent: DashboardViewportLoading,

  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: m.app_title() },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),

  component: RootDocument,
});

function RootDocument() {
  const { session } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const { favicon } = useThemeAssets();

  return (
    <html lang={getLocale()} suppressHydrationWarning className="dark">
      <head>
        <HeadContent />
        <link rel="icon" href={favicon} />
      </head>
      <body>
        <ThemeProvider
          attribute="data-palette"
          defaultTheme="blue"
          enableSystem={false}
          themes={["blue", "green", "orange", "dark"]}
        >
          {isAuthPage ? (
            <Outlet />
          ) : (
            <SocialLayout session={session ?? null}>
              <Outlet />
            </SocialLayout>
          )}
          <Toaster richColors />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}
