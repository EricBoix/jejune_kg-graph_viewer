import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface DocsServerConfig {
  docsServerUrl: string;
  triggerUrl: string;
  mdBrowserUrl: string;
}

const docsServerUrl = import.meta.env.VITE_DOCS_SERVER_URL ?? '';
const triggerUrl    = import.meta.env.VITE_MARKDOWN_TRIGGER_URL ?? '';
const mdBrowserUrl  = import.meta.env.VITE_MARKDOWN_BROWSER_URL ?? '';

const value: DocsServerConfig | null = docsServerUrl
  ? { docsServerUrl, triggerUrl, mdBrowserUrl }
  : null;

const DocsServerContext = createContext<DocsServerConfig | null>(null);

export function DocsServerProvider({ children }: { children: ReactNode }) {
  return (
    <DocsServerContext.Provider value={value}>
      {children}
    </DocsServerContext.Provider>
  );
}

export function useDocsServer(): DocsServerConfig | null {
  return useContext(DocsServerContext);
}
