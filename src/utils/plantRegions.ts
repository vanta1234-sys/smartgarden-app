/**
 * When a given plant can go outside, region by region.
 *
 * Each plant knows the lowest temperature it survives; frost_dates.json holds twenty years
 * of ERA5 reanalysis for 52 Greek locations — the coldest reading ever recorded and the
 * date after which hard frost has never been seen. Put together they answer the question
 * people actually type, "πότε φυτεύω ντομάτα", with a date rather than a season.
 *
 * Eight locations rather than all fifty-two: the answer only changes when the climate does,
 * and forty of them would be the same row repeated.
 */

export interface FrostLocation {
  id: string;
  name: string;
  absolute_min_c: number;
  hard_frost: { safe_planting_date: { label: string } | null };
}

/** South island to north mountain, covering the range the country actually spans. */
export const REGION_IDS = [
  'rhodes', 'heraklion', 'athens', 'patras', 'volos', 'thessaloniki', 'ioannina', 'kozani',
];

export interface RegionAdvice {
  name: string;
  /** What to do there: a date, or that the plant needs no protection at all. */
  advice: string;
  /** True when the plant survives the coldest reading that location has ever seen. */
  hardy: boolean;
}

/**
 * A houseplant has no outdoor planting date, and printing one for a Monstera would be
 * telling someone to put it on the balcony in March.
 */
export function regionTableApplies(category: string): boolean {
  return category !== 'esoterikou';
}

export function plantingByRegion(
  minTempC: number,
  locations: FrostLocation[]
): RegionAdvice[] {
  const out: RegionAdvice[] = [];
  for (const id of REGION_IDS) {
    const loc = locations.find((l) => l.id === id);
    if (!loc) continue;

    // The plant survives the worst cold that location has on record.
    if (minTempC <= loc.absolute_min_c) {
      out.push({ name: loc.name, advice: 'Αντέχει τον χειμώνα έξω', hardy: true });
      continue;
    }
    const safe = loc.hard_frost?.safe_planting_date?.label;
    out.push({
      name: loc.name,
      // No safe date recorded means no hard frost was ever observed there; the plant is
      // still too tender for the coldest night, so it wants shelter on the worst of them.
      advice: safe ? `Μετά τις ${safe}` : 'Όλο τον χρόνο, με κάλυψη στις ψυχρές νύχτες',
      hardy: false,
    });
  }
  return out;
}
