# @binary-signal/electric-sql-vue

Vue 3 composables for [Electric SQL](https://electric-sql.com). Provides reactive bindings to Electric shapes with
automatic sync, caching, and cleanup.

## Install

```bash
pnpm add @binary-signal/electric-sql-vue @electric-sql/client
```

## Usage

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useShape } from "@binary-signal/electric-sql-vue";

const { data, isLoading, error } = useShape({
  url: "http://localhost:3000/v1/shape",
  params: { table: "items" },
});
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <ul v-else>
    <li v-for="item in data" :key="item.id">{{ item.name }}</li>
  </ul>
</template>
```

### Reactive options

Pass a getter to automatically reconnect when parameters change:

```typescript
const filter = ref("");

const { data } = useShape(() => ({
  url: "http://localhost:3000/v1/shape",
  params: {
    table: "items",
    where: `name LIKE '%${filter.value}%'`,
  },
}));
```

### Shallow reactivity

By default, `data` uses `shallowRef` for performance (Electric replaces the full array on sync). Opt into deep
reactivity if needed:

```typescript
const { data } = useShape(options, { shallow: false });
```

## API

### `useShape<T>(options, composableOptions?)`

| Return         | Type                         | Description                     |
| -------------- | ---------------------------- | ------------------------------- |
| `data`         | `ShallowRef<T[]>`            | Current rows                    |
| `isLoading`    | `Ref<boolean>`               | True during initial fetch       |
| `error`        | `ShallowRef<Error \| false>` | Error or false                  |
| `isError`      | `Ref<boolean>`               | True if error state             |
| `lastSyncedAt` | `Ref<number \| undefined>`   | Unix timestamp of last sync     |
| `shape`        | `ShallowRef<Shape<T>>`       | Underlying Shape instance       |
| `stream`       | `ShallowRef<ShapeStream<T>>` | Underlying ShapeStream instance |

**Options:** `MaybeRefOrGetter<ShapeStreamOptions<T>>` — accepts a plain object, ref, or getter function.

**Composable options:** `{ shallow?: boolean }` — default `true`.

### Utilities

```typescript
import { getShapeStream, getShape, preloadShape } from "@binary-signal/electric-sql-vue";
```

- `getShapeStream(options)` — get or create a cached ShapeStream
- `getShape(stream)` — get or create a cached Shape from a stream
- `preloadShape(options)` — preload shape data (useful for SSR)

## Requirements

- Vue 3.3+
- `@electric-sql/client` ^1.0.0

## License

MIT
