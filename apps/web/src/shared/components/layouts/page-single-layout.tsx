import type { LocalizedString } from "@inlang/paraglide-js";

import { Title } from "@/shared/components/ui/title";

export function PageSingleLayout({
  title,
  description,
  helperButton,
  children,
}: {
  title: LocalizedString;
  description?: LocalizedString;
  helperButton?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-4xl px-4 pt-8 pb-24 lg:pb-12">
        <div className="flex justify-between">
          <Title title={title} description={description} />

          {helperButton}
        </div>

        <div className="mt-4 lg:mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
