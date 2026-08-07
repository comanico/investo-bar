export type PlaceValue = number | ".";

export function getPricePlaces(value: number): PlaceValue[] {
  const abs = Math.abs(value);
  if (abs >= 100) return [100, 10, 1, ".", 0.1, 0.01];
  if (abs >= 10) return [10, 1, ".", 0.1, 0.01];
  return [1, ".", 0.1, 0.01]; // 9.00 not 09.00
}

export function getDiffPlaces(value: number): PlaceValue[] {
  const abs = Math.abs(value);
  if (abs >= 100) return [100, 10, 1, ".", 0.1, 0.01];
  if (abs >= 10) return [10, 1, ".", 0.1, 0.01];
  return [1, ".", 0.1, 0.01]; // 0.00 / 1.50 not 00.00
}
