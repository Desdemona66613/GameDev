import { type Discipline, disciplineLabels } from "@/lib/mock-data";

interface SkillChipProps {
  discipline: Discipline;
  /**
   * `have` = offered by this person, drawn with a solid swatch.
   * `missing` = absent, drawn with the engine's missing-texture checker.
   */
  state: "have" | "missing";
}

export function SkillChip({ discipline, state }: SkillChipProps) {
  const label = disciplineLabels[discipline];
  const missing = state === "missing";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-1 text-sm ${
        missing
          ? "border-missing/35 bg-missing-soft/50 text-missing"
          : "border-have/25 bg-have-soft text-have"
      }`}
    >
      <span
        aria-hidden
        className={`size-3 shrink-0 rounded-[1px] ring-1 ${
          missing
            ? "swatch-missing ring-missing/30"
            : "bg-have ring-transparent"
        }`}
      />
      {label}
    </span>
  );
}
