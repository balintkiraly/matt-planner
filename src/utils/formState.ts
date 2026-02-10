/** Form state for adding/editing a point. */
export type PointFormState = {
  id: string;
  name: string;
  lat: string;
  lng: string;
  baseScore: string;
  task: string;
};

/** Form state for adding/editing a bonus combination. */
export type BonusFormState = {
  id: string;
  name: string;
  bonusScore: string;
  pointIds: string[];
};

export function createEmptyPointForm(): PointFormState {
  return {
    id: "",
    name: "",
    lat: "",
    lng: "",
    baseScore: "",
    task: "",
  };
}

export function createEmptyBonusForm(): BonusFormState {
  return {
    id: "",
    name: "",
    bonusScore: "",
    pointIds: [],
  };
}
