export interface SeoMeta {
  title: string;
  description?: string;
}

export function seoMeta(options: SeoMeta) {
  const meta: Array<
    | { title: string }
    | { name: string; content: string }
    | { property: string; content: string }
  > = [{ title: options.title }];

  if (options.description) {
    meta.push(
      { name: "description", content: options.description },
      { property: "og:description", content: options.description },
    );
  }

  meta.push({ property: "og:title", content: options.title });

  return { meta };
}
