export function ProductThumb({ name }: { name: string }) {
  const letters = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  // Deterministic hue from name
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 60%), hsl(${(hue + 40) % 360} 70% 45%))`,
      }}
    >
      {letters}
    </div>
  );
}
