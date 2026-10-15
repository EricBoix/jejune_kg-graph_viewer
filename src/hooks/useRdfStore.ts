import { useCallback } from 'react';
import { Parser, Store } from 'n3';
import { parseRdfTurtle } from '../services/rdfParser';
import { convertRdfToGraph } from '../services/graphConverter';
import { useGraphData } from '../context/GraphDataContext';

function buildN3Store(turtleContent: string, baseUri: string): Store | null {
  try {
    const n3Store = new Store();
    const parser = new Parser({ baseIRI: baseUri });
    const quads = parser.parse(turtleContent);
    n3Store.addQuads(quads);
    return n3Store;
  } catch {
    return null;
  }
}

export function useRdfStore() {
  const { setGraphData } = useGraphData();

  const loadRdfFromString = useCallback(
    (turtleContent: string, baseUri: string = 'http://example.org/') => {
      const parsed = parseRdfTurtle(turtleContent, baseUri);
      const graphData = convertRdfToGraph(parsed);
      const n3Store = buildN3Store(turtleContent, baseUri);
      setGraphData({ ...graphData, n3Store });
    },
    [setGraphData]
  );

  const loadRdfFromFile = useCallback(
    async (file: File) => {
      const content = await file.text();
      loadRdfFromString(content);
    },
    [loadRdfFromString]
  );

  return {
    loadRdfFromString,
    loadRdfFromFile,
  };
}
