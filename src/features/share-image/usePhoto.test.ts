import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePhoto } from "./usePhoto";

let createdUrls: string[] = [];

beforeEach(() => {
  createdUrls = [];
  let n = 0;
  vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
    const url = `blob:mock-${++n}`;
    createdUrls.push(url);
    return url;
  });
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const mkFile = (name: string): File =>
  new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });

describe("usePhoto", () => {
  it("starts in 'empty' state", () => {
    const { result } = renderHook(() => usePhoto());
    expect(result.current.state).toEqual({ kind: "empty" });
  });

  it("setFile transitions to 'loaded' with object URL", () => {
    const { result } = renderHook(() => usePhoto());
    const file = mkFile("a.jpg");
    act(() => result.current.setFile(file));
    expect(result.current.state).toEqual({
      kind: "loaded",
      url: "blob:mock-1",
      file,
    });
  });

  it("setFile twice revokes the previous URL", () => {
    const { result } = renderHook(() => usePhoto());
    act(() => result.current.setFile(mkFile("a.jpg")));
    act(() => result.current.setFile(mkFile("b.jpg")));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    expect(result.current.state).toMatchObject({
      kind: "loaded",
      url: "blob:mock-2",
    });
  });

  it("clear revokes URL and returns to 'empty'", () => {
    const { result } = renderHook(() => usePhoto());
    act(() => result.current.setFile(mkFile("a.jpg")));
    act(() => result.current.clear());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    expect(result.current.state).toEqual({ kind: "empty" });
  });

  it("unmount revokes the URL", () => {
    const { result, unmount } = renderHook(() => usePhoto());
    act(() => result.current.setFile(mkFile("a.jpg")));
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
  });
});
