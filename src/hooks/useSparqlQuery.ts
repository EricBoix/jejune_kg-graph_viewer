import { useState, useCallback, useMemo } from 'react';
import type { Store as N3Store } from 'n3';
import { QueryEngine } from '@comunica/query-sparql-rdfjs-lite';
import type { GraphNode } from '../types/graph.types';

const queryEngine = new QueryEngine();

export function useSparqlQuery(
  n3Store: N3Store | null,
  nodes: GraphNode[],
  onMatchedIds: (ids: Set<string> | null) => void
) {
  const [error, setError] = useState<string | null>(null);

  const nodeIdSet = useMemo(() => new Set(nodes.map(n => n.id)), [nodes]);

  const run = useCallback(
    async (sparql: string) => {
      if (!n3Store) {
        setError('No RDF data loaded.');
        return;
      }
      setError(null);
      try {
        const bindingsStream = await queryEngine.queryBindings(sparql, {
          sources: [n3Store],
        });
        const bindingsArray = await bindingsStream.toArray();
        const matched = new Set<string>();
        for (const bindings of bindingsArray) {
          for (const term of bindings.values()) {
            if (term.termType === 'NamedNode' && nodeIdSet.has(term.value)) {
              matched.add(term.value);
            }
          }
        }
        onMatchedIds(matched);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        onMatchedIds(null);
      }
    },
    [n3Store, nodeIdSet, onMatchedIds]
  );

  const clear = useCallback(() => {
    onMatchedIds(null);
    setError(null);
  }, [onMatchedIds]);

  return { run, clear, error };
}
