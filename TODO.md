# TODO

## Future Enhancements

### ~~Provide/Inject Plugin (Approach 2)~~ — DONE

Implemented in `src/plugin.ts`. See `createElectric()`, `useElectricConfig()`, `ELECTRIC_KEY`.

### Pinia Store Integration (Approach 3)

Shape state managed via Pinia stores for DevTools integration and time-travel debugging.

```typescript
// Future API sketch
const useItemsStore = defineShapeStore("items", {
  url: "http://localhost:3000/v1/shape",
  params: { table: "items" },
});
```

### Other Future Work

- Nuxt module with auto-imports and SSR hydration
- Vue DevTools plugin for inspecting shape state
- `useShapeWithSelector` composable for computed subsets
- Connection status composable (`useElectricStatus`)
