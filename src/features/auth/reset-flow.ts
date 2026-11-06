/** Remembers where the person is in "forgot password" across the 3 screens. */
const KEY = "sf_reset_flow";

export interface ResetFlowState {
  staffId: string;
  sentAt: number; // when the last code was requested (ms)
  resetToken?: string;
}

export function readResetFlow(): ResetFlowState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ResetFlowState) : null;
  } catch {
    return null;
  }
}

export function writeResetFlow(state: ResetFlowState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: the flow just restarts on refresh */
  }
}

export function clearResetFlow(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Backend only emails again after this long. */
export const RESEND_SECONDS = 60;
