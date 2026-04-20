import type { InjectionKey, Plugin } from "vue";
import { inject } from "vue";

export interface ElectricConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

export const ELECTRIC_KEY: InjectionKey<ElectricConfig> = Symbol("electric");

export function createElectric(config: ElectricConfig): Plugin {
  return {
    install(app) {
      app.provide(ELECTRIC_KEY, config);
    },
  };
}

export function useElectricConfig(): ElectricConfig | undefined {
  return inject(ELECTRIC_KEY, undefined);
}
