import type { DripperId } from "./types";

export type Dripper = {
  readonly id: DripperId;
  readonly name: string;
};

export const drippers: Record<DripperId, Dripper> = {
  v60: { id: "v60", name: "V60" },
  kalita_wave: { id: "kalita_wave", name: "Kalita Wave" },
};

export const dripperList: readonly Dripper[] = Object.values(drippers);
