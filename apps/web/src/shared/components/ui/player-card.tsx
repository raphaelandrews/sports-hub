export function PlayerCard({ name, email, imageUrl }: { name: string, email: string, imageUrl: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] bg-card p-5 transition-colors hover:bg-input">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-visible">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      </div>

      <div className="flex min-w-0 flex-col items-center">
        <span className="max-w-full truncate text-sm font-semibold text-foreground">{name}</span>
        <span className="max-w-full truncate text-xs text-placeholder">{email}</span>
      </div>
    </div>
  )
}