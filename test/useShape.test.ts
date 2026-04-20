import { describe, it, expect, vi, beforeEach } from "vitest";
import { nextTick, ref as vueRef, isRef, isShallow } from "vue";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { useShape } from "../src/useShape";

// Minimal fake ShapeStream
function createFakeShapeStream() {
  const subscribers: Array<(messages: any[]) => void> = [];
  let _isLoading = true;
  let _lastSyncedAt: number | undefined;
  let _error: any = false;

  return {
    options: { signal: new AbortController().signal },
    subscribe: vi.fn((cb: (messages: any[]) => void) => {
      subscribers.push(cb);
      return () => {
        const idx = subscribers.indexOf(cb);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    }),
    unsubscribeAll: vi.fn(),
    isLoading: () => _isLoading,
    isConnected: () => true,
    lastSyncedAt: () => _lastSyncedAt,
    get error() {
      return _error;
    },
    // Test helpers
    _emit(messages: any[]) {
      subscribers.forEach((cb) => cb(messages));
    },
    _setLoading(v: boolean) {
      _isLoading = v;
    },
    _setLastSyncedAt(v: number) {
      _lastSyncedAt = v;
    },
    _setError(e: any) {
      _error = e;
    },
  };
}

// Minimal fake Shape
function createFakeShape(stream: ReturnType<typeof createFakeShapeStream>) {
  const subscribers: Array<() => void> = [];
  let _currentRows: any[] = [];
  let _lastOffset = "-1";
  let _handle = "";

  return {
    stream,
    get currentRows() {
      return _currentRows;
    },
    get currentValue() {
      return new Map(_currentRows.map((r, i) => [String(i), r]));
    },
    get lastOffset() {
      return _lastOffset;
    },
    get handle() {
      return _handle;
    },
    get error() {
      return stream.error;
    },
    isLoading: () => stream.isLoading(),
    lastSyncedAt: () => stream.lastSyncedAt(),
    subscribe: vi.fn((cb: () => void) => {
      subscribers.push(cb);
      return () => {
        const idx = subscribers.indexOf(cb);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    }),
    unsubscribeAll: vi.fn(),
    // Test helpers
    _setRows(rows: any[]) {
      _currentRows = rows;
    },
    _setOffset(o: string) {
      _lastOffset = o;
    },
    _setHandle(h: string) {
      _handle = h;
    },
    _notify() {
      subscribers.forEach((cb) => cb());
    },
  };
}

// Mock the cache module to use fakes
let fakeStream: ReturnType<typeof createFakeShapeStream>;
let fakeShape: ReturnType<typeof createFakeShape>;

vi.mock("../src/cache", () => ({
  getShapeStream: vi.fn(() => fakeStream),
  getShape: vi.fn(() => fakeShape),
  sortedOptionsHash: vi.fn(() => "hash"),
}));

describe("useShape", () => {
  beforeEach(() => {
    fakeStream = createFakeShapeStream();
    fakeShape = createFakeShape(fakeStream);
  });

  it("returns loading state initially", () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const { isLoading, data } = useShape({
            url: "http://localhost:3000/v1/shape",
            params: { table: "items" },
          });
          return { isLoading, data };
        },
        render() {
          return h("div", `${this.isLoading}`);
        },
      }),
    );

    expect(wrapper.vm.isLoading).toBe(true);
    expect(wrapper.vm.data).toEqual([]);
  });

  it("updates data when shape notifies", async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const { data, isLoading } = useShape({
            url: "http://localhost:3000/v1/shape",
            params: { table: "items" },
          });
          return { data, isLoading };
        },
        render() {
          return h("div", JSON.stringify(this.data));
        },
      }),
    );

    fakeStream._setLoading(false);
    fakeStream._setLastSyncedAt(Date.now());
    fakeShape._setRows([{ id: 1, name: "test" }]);
    fakeShape._setOffset("1");
    fakeShape._notify();

    await nextTick();

    expect(wrapper.vm.data).toEqual([{ id: 1, name: "test" }]);
    expect(wrapper.vm.isLoading).toBe(false);
  });

  it("cleans up subscription on unmount", () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const result = useShape({
            url: "http://localhost:3000/v1/shape",
            params: { table: "items" },
          });
          return result;
        },
        render() {
          return h("div");
        },
      }),
    );

    expect(fakeShape.subscribe).toHaveBeenCalledOnce();

    wrapper.unmount();
  });

  it("handles error state", async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          const { error, isError } = useShape({
            url: "http://localhost:3000/v1/shape",
            params: { table: "items" },
          });
          return { error, isError };
        },
        render() {
          return h("div");
        },
      }),
    );

    fakeStream._setError(new Error("connection failed"));
    fakeShape._notify();

    await nextTick();

    expect(wrapper.vm.isError).toBe(true);
    expect(wrapper.vm.error).toBeInstanceOf(Error);
  });
});

describe("useShape reactive options", () => {
  beforeEach(() => {
    fakeStream = createFakeShapeStream();
    fakeShape = createFakeShape(fakeStream);
  });

  it("reconnects when reactive options change", async () => {
    const { getShapeStream } = await import("../src/cache");

    const table = vueRef("items");

    const wrapper = mount(
      defineComponent({
        setup() {
          const { data } = useShape(() => ({
            url: "http://localhost:3000/v1/shape",
            params: { table: table.value },
          }));
          return { data };
        },
        render() {
          return h("div");
        },
      }),
    );

    const callCountBefore = vi.mocked(getShapeStream).mock.calls.length;

    // Change the reactive option
    table.value = "users";
    await nextTick();

    const callCountAfter = vi.mocked(getShapeStream).mock.calls.length;
    expect(callCountAfter).toBeGreaterThan(callCountBefore);
  });
});

describe("useShape shallow option", () => {
  beforeEach(() => {
    fakeStream = createFakeShapeStream();
    fakeShape = createFakeShape(fakeStream);
  });

  it("uses shallowRef for data by default", () => {
    let dataRef: any;
    mount(
      defineComponent({
        setup() {
          const { data } = useShape({
            url: "http://localhost:3000/v1/shape",
            params: { table: "items" },
          });
          dataRef = data;
          return { data };
        },
        render() {
          return h("div");
        },
      }),
    );

    expect(isShallow(dataRef)).toBe(true);
  });

  it("uses deep ref when shallow: false", () => {
    let dataRef: any;
    mount(
      defineComponent({
        setup() {
          const { data } = useShape(
            { url: "http://localhost:3000/v1/shape", params: { table: "items" } },
            { shallow: false },
          );
          dataRef = data;
          return { data };
        },
        render() {
          return h("div");
        },
      }),
    );

    expect(isRef(dataRef)).toBe(true);
    expect(isShallow(dataRef)).toBe(false);
  });
});
