import {
  INDUSTRIES,
  VERIFIED_RESOURCES,
  type Career,
  type CareerHue,
  type Industry,
  type Resource,
} from "./career-types";
import { CAREERS_PART_1 } from "./careers-data-part1";
import { CAREERS_PART_2 } from "./careers-data-part2";

export type { Career, CareerHue, Industry, Resource };
export { INDUSTRIES, VERIFIED_RESOURCES };

export const RESOURCES = VERIFIED_RESOURCES;

export const CAREERS: Career[] = [...CAREERS_PART_1, ...CAREERS_PART_2];

const BY_ID = new Map<string, Career>(CAREERS.map((c) => [c.id, c]));

export const getCareer = (id: string, extraCatalog?: Career[]): Career | undefined => {
  if (extraCatalog?.length) {
    const found = extraCatalog.find((c) => c.id === id);
    if (found) return found;
  }
  return BY_ID.get(id);
};

export const HUE_CLASS: Record<Career["hue"], { text: string; bg: string; border: string }> = {
  lavender: { text: "text-lavender-bright", bg: "bg-lavender/15", border: "border-lavender/40" },
  cyan: { text: "text-cyan", bg: "bg-cyan/15", border: "border-cyan/40" },
  turquoise: { text: "text-turquoise", bg: "bg-turquoise/15", border: "border-turquoise/40" },
  pink: { text: "text-pink", bg: "bg-pink/15", border: "border-pink/40" },
  violet: { text: "text-lavender", bg: "bg-violet/25", border: "border-violet/50" },
  warning: { text: "text-warning", bg: "bg-warning/15", border: "border-warning/40" },
};
