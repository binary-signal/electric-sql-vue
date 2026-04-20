import { describe, it, expect, vi, beforeEach } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { useShape } from "../src/useShape";
import { createElectric } from "../src/plugin";

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
    _setLoading(v: boolean) {
      _isLoading = v;
    },
    _setLastSyncedAt(v: number) {
      _lastSyncedAt = v;
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
    _setRows(rows: any[]) {
      _currentRows = rows;
    },
    _setOffset(o: string) {
      _lastOffset = o;
    },
    _notify() {
      subscribers.forEach((cb) => cb());
    },
  };
}

let fakeStream: ReturnType<typeof createFakeShapeStream>;
let fakeShape: ReturnType<typeof createFakeShape>;
let capturedOptions: any;

vi.mock("../src/cache", () => ({
  getShapeStream: vi.fn((opts: any) => {
    capturedOptions = opts;
    return fakeStream;
  }),
  getShape: vi.fn(() => fakeShape),
  sortedOptionsHash: vi.fn(() => "hash"),
}));

describe("createElectric plugin", () => {
  beforeEach(() => {
    fakeStream = createFakeShapeStream();
    fakeShape = createFakeShape(fakeStream);
    capturedOptions = undefined;
  });

  it("provides baseUrl to useShape", async () => {
    const plugin = createElectric({ baseUrl: "http://myserver:4000" });

    mount(
      defineComponent({
        setup() {
          const { data } = useShape({ params: { table: "items" } });
          return { data };
        },
        render() {
          return h("div");
        },
      }),
      {
        global: { plugins: [plugin] },
      },
    );

    expect(capturedOptions.url).toBe("http://myserver:4000/v1/shape");
  });

  it("provides default headers merged with per-call headers", () => {
    const plugin = createElectric({
      baseUrl: "http://myserver:4000",
      headers: { Authorization: "Bearer token123", "X-Default": "yes" },
    });

    mount(
      defineComponent({
        setup() {
          useShape({
            url: "http://custom:5000/v1/shape",
            params: { table: "items" },
            headers: { "X-Custom": "override" },
          });
          return {};
        },
        render() {
          return h("div");
        },
      }),
      {
        global: { plugins: [plugin] },
      },
    );

    expect(capturedOptions.headers).toEqual({
      Authorization: "Bearer token123",
      "X-Default": "yes",
      "X-Custom": "override",
    });
  });

  it("per-call headers override plugin headers", () => {
    const plugin = createElectric({
      baseUrl: "http://myserver:4000",
      headers: { Authorization: "Bearer default" },
    });

    mount(
      defineComponent({
        setup() {
          useShape({
            params: { table: "items" },
            headers: { Authorization: "Bearer override" },
          });
          return {};
        },
        render() {
          return h("div");
        },
      }),
      {
        global: { plugins: [plugin] },
      },
    );

    expect(capturedOptions.headers.Authorization).toBe("Bearer override");
  });

  it("per-call url takes precedence over plugin baseUrl", () => {
    const plugin = createElectric({ baseUrl: "http://myserver:4000" });

    mount(
      defineComponent({
        setup() {
          useShape({
            url: "http://custom:9000/v1/shape",
            params: { table: "items" },
          });
          return {};
        },
        render() {
          return h("div");
        },
      }),
      {
        global: { plugins: [plugin] },
      },
    );

    expect(capturedOptions.url).toBe("http://custom:9000/v1/shape");
  });

  it("works without plugin installed (backwards compat)", async () => {
    mount(
      defineComponent({
        setup() {
          const { data } = useShape({
            url: "http://localhost:3000/v1/shape",
            params: { table: "items" },
          });
          return { data };
        },
        render() {
          return h("div");
        },
      }),
    );

    expect(capturedOptions.url).toBe("http://localhost:3000/v1/shape");
  });
});
