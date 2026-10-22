import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { runtimeConfig } from '../runtimeConfig';

const oxigraphUrl: string | null = runtimeConfig().OXIGRAPH_URL || null;

const OxigraphContext = createContext<string | null>(oxigraphUrl);

export function OxigraphProvider({ children }: { children: ReactNode }) {
  return (
    <OxigraphContext.Provider value={oxigraphUrl}>
      {children}
    </OxigraphContext.Provider>
  );
}

export function useOxigraph(): string | null {
  return useContext(OxigraphContext);
}
