import { useEffect } from 'react';
import { useRdfStore } from './useRdfStore';
import { useOxigraph } from '../context/OxigraphContext';
import { loadAllGraphs } from './useOxigraphLoad';
import { UrlParser } from '../services/urlParser';
import { config } from '../config';
import sampleTtl from '../data/sample.ttl?raw';

export function useInitialGraphLoad() {
  const { loadRdfFromString } = useRdfStore();
  const oxigraphUrl = useOxigraph();

  useEffect(() => {
    function loadSample() {
      loadRdfFromString(sampleTtl, undefined, config.sample.sourceName);
    }

    function fetchThenLoad(fetchUrl: string, sourceName: string | null) {
      fetch(fetchUrl)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.text();
        })
        .then(content => loadRdfFromString(content, undefined, sourceName))
        .catch(loadSample);
    }

    if (oxigraphUrl) {
      loadAllGraphs(oxigraphUrl)
        .then(turtle => loadRdfFromString(turtle))
        .catch(() => loadRdfFromString(sampleTtl));
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    const file = params.get('file');
    if (url) {
      fetchThenLoad(url, UrlParser.lastPathSegment(url));
    } else if (file) {
      fetchThenLoad(`/data/${file}`, file);
    } else {
      loadSample();
    }
  }, [oxigraphUrl, loadRdfFromString]);
}
