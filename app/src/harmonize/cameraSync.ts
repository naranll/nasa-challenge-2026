/** Keeps the two Harmonizing globes on one camera (PLAN D12): the globe the user touches leads. */
export type Side = "raw" | "harm";
export interface Pov {
  lat: number;
  lng: number;
  altitude: number;
}
interface Follower {
  pointOfView(pov: Pov, ms?: number): unknown;
}

export interface CameraSync {
  register(side: Side, globe: Follower | null): void;
  lead(side: Side): void;
  moved(side: Side, pov: Pov): void;
}

export function createCameraSync(): CameraSync {
  const globes: Partial<Record<Side, Follower | null>> = {};
  let leader: Side | null = null;
  return {
    register(side, globe) {
      globes[side] = globe;
    },
    lead(side) {
      leader = side;
    },
    moved(side, pov) {
      if (side !== leader) return; // the follower's own change event, not the user's
      globes[side === "raw" ? "harm" : "raw"]?.pointOfView(pov, 0);
    },
  };
}
