import type { Ref, ShallowRef } from "vue";
import type { Row, Shape, ShapeStream } from "@electric-sql/client";

export interface UseShapeOptions {
  /** Use shallowRef for data array. Default: true */
  shallow?: boolean;
}

export interface UseShapeReturn<T extends Row = Row> {
  /** Current rows from the shape */
  data: ShallowRef<T[]> | Ref<T[]>;
  /** Underlying Shape instance */
  shape: ShallowRef<Shape<T> | undefined>;
  /** Underlying ShapeStream instance */
  stream: ShallowRef<ShapeStream<T> | undefined>;
  /** True during initial fetch */
  isLoading: Ref<boolean>;
  /** Unix timestamp of last sync */
  lastSyncedAt: Ref<number | undefined>;
  /** Error object or false */
  error: ShallowRef<Shape<T>["error"]>;
  /** True if in error state */
  isError: Ref<boolean>;
}
