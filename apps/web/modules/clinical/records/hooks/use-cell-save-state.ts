"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

/**
 * State machine for a single clinical record cell:
 *
 *   idle      — the value on screen matches the last value the server accepted
 *   dirty     — the user has typed something but the debounce hasn't fired yet
 *   saving    — a save is in flight for this cell
 *   saved     — the most recent save committed; flashes briefly then -> idle
 *   error     — the most recent save failed; the input keeps the user's value
 *               so they can edit again or hit Retry
 */
export type CellSaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export interface CellSaveResult<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface UseCellSaveStateOptions<T> {
  /** Pre-save server value rendered into the input on mount. */
  initialValue: string;
  /** Hard gate: when true, edits and saves are blocked entirely. */
  disabled?: boolean;
  /** How the hook hands a string to the server action. */
  save: (value: string) => Promise<CellSaveResult<T>>;
  /** Delay between the user's last keystroke and the save attempt. */
  debounceMs?: number;
  /** How long the "Saved ✓" indicator stays visible before returning to idle. */
  savedDisplayMs?: number;
}

export interface UseCellSaveStateApi {
  value: string;
  setValue: (next: string) => void;
  state: CellSaveState;
  /** Last save error message, present only while `state === "error"`. */
  error: string | null;
  /** Re-attempts the most recent value (the one currently in the input). */
  retry: () => void;
}

interface ReducerState {
  value: string;
  serverValue: string;
  state: CellSaveState;
  error: string | null;
}

type Action =
  | { type: "set"; next: string }
  | { type: "save_start" }
  | { type: "save_success" }
  | { type: "save_failure"; error: string }
  | { type: "saved_flash_end" }
  | { type: "external_reset"; next: string };

const reducer = (state: ReducerState, action: Action): ReducerState => {
  switch (action.type) {
    case "set":
      if (action.next === state.value) return state;
      // Skip the "dirty" hop when the user reverts to the last server value:
      // there is nothing to save, return to idle directly.
      if (action.next === state.serverValue) {
        return { ...state, value: action.next, state: "idle", error: null };
      }
      return { ...state, value: action.next, state: "dirty", error: null };
    case "save_start":
      return { ...state, state: "saving" };
    case "save_success":
      return {
        ...state,
        serverValue: state.value,
        state: "saved",
        error: null,
      };
    case "save_failure":
      return { ...state, state: "error", error: action.error };
    case "saved_flash_end":
      // Guard against late timer when the user has resumed editing.
      if (state.state !== "saved") return state;
      return { ...state, state: "idle" };
    case "external_reset":
      return {
        value: action.next,
        serverValue: action.next,
        state: "idle",
        error: null,
      };
    default:
      return state;
  }
};

/**
 * Owns the debounced save lifecycle for a clinical record cell. The hook is
 * intentionally generic over the server action's return shape so that record
 * value upserts and any future cell-level mutations share the same UX.
 */
export function useCellSaveState<T>({
  initialValue,
  disabled = false,
  save,
  debounceMs = 500,
  savedDisplayMs = 1200,
}: UseCellSaveStateOptions<T>): UseCellSaveStateApi {
  const [internal, dispatch] = useReducer(reducer, undefined, () => ({
    value: initialValue,
    serverValue: initialValue,
    state: "idle" as CellSaveState,
    error: null,
  }));

  // Sync the latest save callback into a ref so the debounced effect doesn't
  // tear down on every parent re-render.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // If a save is in flight, the integer is the attempt id. New keystrokes bump
  // it, so the resolved promise from a stale save is ignored.
  const attemptRef = useRef(0);

  // Re-sync to the latest server-provided initialValue if the parent prop
  // genuinely changes (record reload, field re-render with new data).
  const lastInitialRef = useRef(initialValue);
  useEffect(() => {
    if (initialValue !== lastInitialRef.current) {
      lastInitialRef.current = initialValue;
      dispatch({ type: "external_reset", next: initialValue });
    }
  }, [initialValue]);

  const runSave = useCallback(
    async (valueToSave: string) => {
      const attemptId = ++attemptRef.current;
      dispatch({ type: "save_start" });
      try {
        const result = await saveRef.current(valueToSave);
        if (attemptId !== attemptRef.current) return; // a newer attempt is in flight
        if (result.ok) {
          dispatch({ type: "save_success" });
        } else {
          dispatch({ type: "save_failure", error: result.error ?? "Save failed." });
        }
      } catch (err) {
        if (attemptId !== attemptRef.current) return;
        dispatch({
          type: "save_failure",
          error: err instanceof Error ? err.message : "Save failed.",
        });
      }
    },
    []
  );

  // Debounced save trigger. Cleans up its own timer on every dependency change.
  useEffect(() => {
    if (disabled) return;
    if (internal.state !== "dirty") return;
    const handle = window.setTimeout(() => {
      void runSave(internal.value);
    }, debounceMs);
    return () => window.clearTimeout(handle);
  }, [disabled, internal.state, internal.value, debounceMs, runSave]);

  // Auto-clear the "Saved ✓" indicator.
  useEffect(() => {
    if (internal.state !== "saved") return;
    const handle = window.setTimeout(() => {
      dispatch({ type: "saved_flash_end" });
    }, savedDisplayMs);
    return () => window.clearTimeout(handle);
  }, [internal.state, savedDisplayMs]);

  const setValue = useCallback((next: string) => {
    dispatch({ type: "set", next });
  }, []);

  const retry = useCallback(() => {
    if (disabled) return;
    if (internal.state !== "error") return;
    void runSave(internal.value);
  }, [disabled, internal.state, internal.value, runSave]);

  return {
    value: internal.value,
    setValue,
    state: internal.state,
    error: internal.error,
    retry,
  };
}
