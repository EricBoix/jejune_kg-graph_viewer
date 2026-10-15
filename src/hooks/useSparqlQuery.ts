import { useState, useCallback, useMemo } from 'react';
import type { Store as N3Store } from 'n3';
import { QueryEngine } from '@comunica/query-sparql-rdfjs-lite';
import type { GraphNode } from '../types/graph.types';

const queryEngine = new QueryEngine();

export function useSparqlQuery(n3Store: N3Store | null, nodes: GraphNode[]) {
  const [matchedIds, setMatchedIds] = useState<Set<string> | null>(null);
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
        setMatchedIds(matched);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setMatchedIds(null);
      }
    },
    [n3Store, nodeIdSet]
  );

  const clear = useCallback(() => {
    setMatchedIds(null);
    setError(null);
  }, []);

  return { run, clear, matchedIds, error };
}
