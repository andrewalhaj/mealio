'use client'

export function AmbientBlobs() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
      aria-hidden="true"
    >
      {/* Tomato — top-left */}
      <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full
                      bg-brand-tomato-muted/20 blur-[120px] animate-blob-a blob-tomato" />
      {/* Saffron — right */}
      <div className="absolute top-[25%] -right-[15%] w-[50vw] h-[50vw] rounded-full
                      bg-brand-saffron-muted/16 blur-[100px] animate-blob-b blob-saffron" />
      {/* Basil — bottom */}
      <div className="absolute -bottom-[10%] left-[15%] w-[55vw] h-[55vw] rounded-full
                      bg-brand-basil-muted/14 blur-[130px] animate-blob-c blob-basil" />
    </div>
  )
}
