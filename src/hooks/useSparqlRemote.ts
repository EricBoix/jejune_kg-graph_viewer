import { useState, useCallback, useMemo } from 'react';
import type { GraphNode } from '../types/graph.types';

export function useSparqlRemote(
  oxigraphUrl: string,
  nodes: GraphNode[],
  onMatchedIds: (ids: Set<string> | null) => void,
) {
  const [error, setError] = useState<string | null>(null);
  const base = oxigraphUrl.replace(/\/$/, '');

  const nodeIdSet = useMemo(() => new Set(nodes.map(n => n.id)), [nodes]);

  const runRemote = useCallback(
    async (sparql: string) => {
      setError(null);
      try {
        const resp = await fetch(`${base}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sparql-query',
            Accept: 'application/sparql-results+json',
          },
          body: sparql,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        const matched = new Set<string>();
        for (const binding of json.results?.bindings ?? []) {
          for (const term of Object.values(binding) as { type: string; value: string }[]) {
            if (term.type === 'uri' && nodeIdSet.has(term.value)) {
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
    [base, nodeIdSet, onMatchedIds],
  );

  const clearRemote = useCallback(() => {
    onMatchedIds(null);
    setError(null);
  }, [onMatchedIds]);

  return { runRemote, clearRemote, error };
}
