export function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Animação dos círculos pulsantes */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="absolute inset-2 animate-pulse rounded-full bg-primary/40" />
          <div className="absolute inset-4 rounded-full bg-linear-to-tr from-primary to-primary/60 shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
        </div>

        {/* Texto elegante */}
        <div className="flex flex-col items-center gap-2">
          <span className="bg-linear-to-r from-foreground/80 to-foreground bg-clip-text text-lg font-semibold tracking-widest text-transparent uppercase">
            Processando
          </span>
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/80 [animation-delay:-0.3s]" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/80 [animation-delay:-0.15s]" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
