export function CardWrapper({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <div className="rounded-2xl lg:rounded-[20px] bg-card p-3.5 lg:p-6">
      <h2 className="text-sm lg:text-lg font-semibold lg:font-bold text-foreground">{title}</h2>
      <p className="mt-0.5 lg:mt-1 text-xs lg:text-sm text-placeholder">{description}</p>

      <div className="mt-3 lg:mt-5">
        {children}
      </div>
    </div>
  )
}