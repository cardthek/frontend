import { cn, initials } from "@/lib/utils";

const tones = {
  sand: "bg-[var(--art-sand)] text-[#514537]",
  sage: "bg-[var(--art-sage)] text-[#394236]",
  clay: "bg-[var(--art-clay)] text-white",
  forest: "bg-[var(--art-forest)] text-white",
};

export function Avatar({
  name,
  tone = "sage",
  className,
}: {
  name: string;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      aria-label={name}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 font-serif text-sm font-bold",
        tones[tone],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
