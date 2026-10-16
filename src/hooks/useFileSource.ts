import { useState, useEffect, useMemo } from 'react';
import { useDocsServer } from '../context/DocsServerContext';

interface FileSource {
  fileName: string | null;
  sourceUrl: string | null;
}

interface CatalogEntry {
  name: string;
  url?: string;
}

export function useFileSource(): FileSource {
  const docsConfig = useDocsServer();
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);

  const { fileName, catalogName } = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlParam  = searchParams.get('url');
    const fileParam = searchParams.get('file');

    if (fileParam) {
      return { fileName: fileParam, catalogName: null };
    }

    if (urlParam && docsConfig) {
      const docsServerBase = docsConfig.docsServerUrl.replace(/\/$/, '');
      const docsPrefix = `${docsServerBase}/docs/`;
      if (urlParam.startsWith(docsPrefix)) {
        const pathAfterDocs = urlParam.slice(docsPrefix.length);
        const extractedName = decodeURIComponent(pathAfterDocs.split('/')[0]);
        const displayName = extractedName
          .replace(/^jejune_doc_/, '')
          .replace(/_/g, ' ');
        return { fileName: displayName, catalogName: extractedName };
      }
      try {
        const parsedUrl = new URL(urlParam);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
        return { fileName: pathSegments[pathSegments.length - 1] ?? null, catalogName: null };
      } catch {
        return { fileName: null, catalogName: null };
      }
    }

    return { fileName: null, catalogName: null };
  }, [docsConfig]);

  useEffect(() => {
    if (!catalogName || !docsConfig) {
      setSourceUrl(null);
      return;
    }
    let cancelled = false;
    fetch(`${docsConfig.docsServerUrl}/catalog`, { mode: 'cors' })
      .then(r => (r.ok ? r.json() : null))
      .then((docs: CatalogEntry[] | null) => {
        if (cancelled || !docs) return;
        const doc = docs.find(d => d.name === catalogName);
        setSourceUrl(doc?.url ?? null);
      })
      .catch(() => { if (!cancelled) setSourceUrl(null); });
    return () => { cancelled = true; };
  }, [catalogName, docsConfig]);

  return { fileName, sourceUrl };
}
