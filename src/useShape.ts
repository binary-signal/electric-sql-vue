import { ref, shallowRef, watchEffect, toValue } from "vue";
import type { MaybeRefOrGetter } from "vue";
import type { Row, ShapeStreamOptions } from "@electric-sql/client";
import { getShapeStream, getShape } from "./cache";
import type { UseShapeOptions, UseShapeReturn } from "./types";

export function useShape<T extends Row = Row>(
  options: MaybeRefOrGetter<ShapeStreamOptions<T>>,
  composableOptions: UseShapeOptions = {},
): UseShapeReturn<T> {
  const { shallow = true } = composableOptions;

  const data = shallow ? shallowRef<T[]>([]) : (ref<T[]>([]) as any);
  const shape = shallowRef<any>(undefined);
  const stream = shallowRef<any>(undefined);
  const isLoading = ref(true);
  const lastSyncedAt = ref<number | undefined>(undefined);
  const error = shallowRef<any>(false);
  const isError = ref(false);

  watchEffect((onCleanup) => {
    const resolved = toValue(options);
    const controller = new AbortController();

    const shapeStream = getShapeStream<T>(resolved);
    const shapeInstance = getShape<T>(shapeStream);

    stream.value = shapeStream;
    shape.value = shapeInstance;

    let lastOffset: string | undefined;
    let lastHandle: string | undefined;

    function syncState() {
      const newOffset = shapeInstance.lastOffset;
      const newHandle = shapeInstance.handle;
      const newIsLoading = shapeInstance.isLoading();
      const newLastSyncedAt = shapeInstance.lastSyncedAt();
      const newError = shapeInstance.error;

      const changed =
        newOffset !== lastOffset ||
        newHandle !== lastHandle ||
        newIsLoading !== isLoading.value ||
        newLastSyncedAt !== lastSyncedAt.value ||
        newError !== error.value;

      if (changed) {
        lastOffset = newOffset;
        lastHandle = newHandle;
        data.value = shapeInstance.currentRows;
        isLoading.value = newIsLoading;
        lastSyncedAt.value = newLastSyncedAt;
        error.value = newError;
        isError.value = newError !== false;
      }
    }

    syncState();

    const unsubscribe = shapeInstance.subscribe(syncState);

    onCleanup(() => {
      unsubscribe();
      controller.abort();
    });
  });

  return {
    data,
    shape,
    stream,
    isLoading,
    lastSyncedAt,
    error,
    isError,
  };
}
