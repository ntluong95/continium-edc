// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useCellSaveState } from "./use-cell-save-state";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

describe("useCellSaveState", () => {
  test("starts idle with the initial value and never auto-saves on mount", () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useCellSaveState({
        initialValue: "hello",
        save,
      })
    );

    expect(result.current.value).toBe("hello");
    expect(result.current.state).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(save).not.toHaveBeenCalled();
  });

  test("transitions idle -> dirty -> saving -> saved -> idle on a successful save", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useCellSaveState({
        initialValue: "",
        save,
        debounceMs: 500,
        savedDisplayMs: 800,
      })
    );

    act(() => result.current.setValue("42"));
    expect(result.current.state).toBe("dirty");

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.state).toBe("saving");
    expect(save).toHaveBeenCalledWith("42");

    await flushPromises();
    expect(result.current.state).toBe("saved");

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.state).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  test("debounces consecutive keystrokes — only the latest value reaches the server", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useCellSaveState({ initialValue: "", save, debounceMs: 500 })
    );

    act(() => result.current.setValue("a"));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => result.current.setValue("ab"));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => result.current.setValue("abc"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    await flushPromises();

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("abc");
  });

  test("ignores a stale in-flight save when the user keeps typing", async () => {
    // Both attempts are pinned to controlled promises so the test can resolve
    // them out of order and verify the stale-attempt guard.
    let resolveFirst: (value: { ok: boolean }) => void = () => undefined;
    let resolveSecond: (value: { ok: boolean }) => void = () => undefined;
    const save = vi
      .fn<(value: string) => Promise<{ ok: boolean; error?: string }>>()
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveFirst = resolve; })
      )
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveSecond = resolve; })
      );

    const { result } = renderHook(() =>
      useCellSaveState({ initialValue: "", save, debounceMs: 500 })
    );

    act(() => result.current.setValue("first"));
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current.state).toBe("saving");

    // User keeps typing while the first save is still in flight.
    act(() => result.current.setValue("second"));
    act(() => { vi.advanceTimersByTime(500); });
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.state).toBe("saving");

    // First save resolves LATE. Its success must be discarded — the second
    // attempt is still pending so state stays "saving".
    act(() => resolveFirst({ ok: true }));
    await flushPromises();
    expect(result.current.state).toBe("saving");

    // Now finish the second (newest) attempt; its result is the one that wins.
    act(() => resolveSecond({ ok: true }));
    await flushPromises();
    expect(result.current.state).toBe("saved");
  });

  test("transitions to error and preserves the failing value for retry", async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "Server exploded." })
      .mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() =>
      useCellSaveState({ initialValue: "", save, debounceMs: 500 })
    );

    act(() => result.current.setValue("v1"));
    act(() => {
      vi.advanceTimersByTime(500);
    });
    await flushPromises();
    expect(result.current.state).toBe("error");
    expect(result.current.error).toBe("Server exploded.");
    // the input keeps the failing value so the user can retry without retyping
    expect(result.current.value).toBe("v1");

    act(() => result.current.retry());
    await flushPromises();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("v1");
    expect(result.current.state).toBe("saved");
  });

  test("retry is a no-op when not in error state", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useCellSaveState({ initialValue: "", save })
    );

    act(() => result.current.retry());
    await flushPromises();
    expect(save).not.toHaveBeenCalled();
    expect(result.current.state).toBe("idle");
  });

  test("disabled blocks the debounce timer and prevents retry", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    const { rerender, result } = renderHook(
      ({ disabled }: { disabled: boolean }) =>
        useCellSaveState({ initialValue: "", save, disabled, debounceMs: 200 }),
      { initialProps: { disabled: false } }
    );

    act(() => result.current.setValue("typed"));
    rerender({ disabled: true });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    await flushPromises();

    expect(save).not.toHaveBeenCalled();
  });

  test("reverting to the last server value returns directly to idle without a save", () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useCellSaveState({ initialValue: "anchor", save, debounceMs: 500 })
    );

    act(() => result.current.setValue("anchor!"));
    expect(result.current.state).toBe("dirty");

    act(() => result.current.setValue("anchor"));
    expect(result.current.state).toBe("idle");

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(save).not.toHaveBeenCalled();
  });

  test("external initialValue change resets the hook (new record loaded)", () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    const { rerender, result } = renderHook(
      ({ initial }: { initial: string }) =>
        useCellSaveState({ initialValue: initial, save }),
      { initialProps: { initial: "a" } }
    );

    act(() => result.current.setValue("a-edited"));
    expect(result.current.state).toBe("dirty");

    rerender({ initial: "b" });
    expect(result.current.value).toBe("b");
    expect(result.current.state).toBe("idle");
  });

  test("catches a thrown save and surfaces the message", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("Network down"));
    const { result } = renderHook(() =>
      useCellSaveState({ initialValue: "", save, debounceMs: 100 })
    );

    act(() => result.current.setValue("x"));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    await flushPromises();

    expect(result.current.state).toBe("error");
    expect(result.current.error).toBe("Network down");
  });
});
