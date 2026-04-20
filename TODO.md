# TODO

## Future Enhancements

### Provide/Inject Plugin (Approach 2)

A `createElectric()` plugin that provides a shared cache via Vue's provide/inject system.
This would give explicit lifecycle control and allow app-level configuration (base URL, default headers).

```typescript
// Future API sketch
const electric = createElectric({ baseUrl: "http://localhost:3000" });
app.use(electric);

// In components
const { data } = useShape({ params: { table: "items" } }); // inherits baseUrl from plugin
```

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
