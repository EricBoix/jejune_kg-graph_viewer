interface JejuneConfig {
  DOCS_SERVER_URL: string;
  MARKDOWN_TRIGGER_URL: string;
  MARKDOWN_BROWSER_URL: string;
  OXIGRAPH_URL: string;
}

declare global {
  interface Window {
    __JEJUNE_CONFIG__?: JejuneConfig;
  }
}

const devFallback: JejuneConfig = {
  DOCS_SERVER_URL:      import.meta.env.JEJUNE_DOCS_SERVER_URL      ?? '',
  MARKDOWN_TRIGGER_URL: import.meta.env.JEJUNE_MARKDOWN_TRIGGER_URL ?? '',
  MARKDOWN_BROWSER_URL: import.meta.env.JEJUNE_MARKDOWN_BROWSER_URL ?? '',
  OXIGRAPH_URL:         import.meta.env.JEJUNE_OXIGRAPH_URL         ?? '',
};

export function runtimeConfig(): JejuneConfig {
  return window.__JEJUNE_CONFIG__ ?? devFallback;
}
