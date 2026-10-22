import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { runtimeConfig } from '../runtimeConfig';

interface DocsServerConfig {
  docsServerUrl: string;
  triggerUrl: string;
  mdBrowserUrl: string;
}

const cfg = runtimeConfig();
const docsServerUrl = cfg.DOCS_SERVER_URL;
const triggerUrl    = cfg.MARKDOWN_TRIGGER_URL;
const mdBrowserUrl  = cfg.MARKDOWN_BROWSER_URL;

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
