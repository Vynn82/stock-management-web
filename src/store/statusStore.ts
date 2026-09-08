import { create } from "zustand";

export type StatusValue = string | number | null;

export interface StatusState {
  status: StatusValue;
  setStatus: (status: StatusValue) => void;
  resetStatus: () => void;
}

export const useStatusStore = create<StatusState>((set) => ({
  status: null,
  setStatus: (status) => set({ status }),
  resetStatus: () => set({ status: null }),
}));

// Non-React helper functions for use in request.ts or outside component tree
export const getStatus = (): StatusValue => useStatusStore.getState().status;

export const setStatus = (status: StatusValue): void => {
  useStatusStore.getState().setStatus(status);
};
