import type { ReactNode } from "react";
import { Trophy, Users, Globe } from "lucide-react";
import * as m from "@/paraglide/messages";
import { useThemeAssets } from "@/shared/hooks/use-theme-assets";

interface AuthSplitLayoutProps {
  children: ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  const { logo } = useThemeAssets();

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="flex h-full w-full flex-col lg:flex-row">
        {/* Left Panel */}
        <div className="hidden h-full w-[58%] flex-col justify-between bg-background p-16 lg:flex">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo" className="size-12" />
              <span className="text-lg font-semibold text-foreground"> {m["header.siteTitle"]()}</span>
            </div>
            <h1 className="mt-8 max-w-lg text-[42px] font-bold leading-[1.15] text-foreground">{m["home.title"]()}</h1>
            <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">{m["home.subtitle"]()}</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20">
                <Trophy size={14} className="text-primary" />
              </div>
              <span className="text-[15px] font-medium text-foreground">Organize competitions with ease</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20">
                <Users size={14} className="text-primary" />
              </div>
              <span className="text-[15px] font-medium text-foreground">Manage teams and delegations</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20">
                <Globe size={14} className="text-primary" />
              </div>
              <span className="text-[15px] font-medium text-foreground">Track results in real-time</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-card px-6 py-12 lg:w-[42%] lg:px-20 lg:py-0">
            {children}
        </div>
      </div>
    </div>
  );
}
