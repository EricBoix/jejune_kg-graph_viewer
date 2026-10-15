import { useEffect, useState } from 'react';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';
import { useSparqlQuery } from '../hooks/useSparqlQuery';
import { colors } from '../styles/theme';

const TOP_20_DEGREE_QUERY = `SELECT ?x (COUNT(*) AS ?degree) WHERE {
  { ?x ?p ?o }
  UNION
  { ?s ?p ?x }
}
GROUP BY ?x
ORDER BY DESC(?degree)
LIMIT 20`;

export function SparqlPanel() {
  const { nodes, n3Store } = useGraphData();
  const { setSparqlMatchedIds } = useViewSettings();
  const { run, clear, matchedIds, error } = useSparqlQuery(n3Store, nodes);
  const [sparqlText, setSparqlText] = useState('');

  useEffect(() => {
    setSparqlMatchedIds(matchedIds);
  }, [matchedIds, setSparqlMatchedIds]);

  function handleRun() {
    run(sparqlText);
  }

  function handleClear() {
    clear();
    setSparqlText('');
  }

  function handleTop20() {
    setSparqlText(TOP_20_DEGREE_QUERY);
    run(TOP_20_DEGREE_QUERY);
  }

  return (
    <div style={styles.panel}>
      <div style={styles.presetRow}>
        <button style={styles.presetButton} onClick={handleTop20}>
          Top 20 by degree
        </button>
      </div>
      <textarea
        style={styles.textarea}
        value={sparqlText}
        onChange={e => setSparqlText(e.target.value)}
        placeholder={'SELECT ?s WHERE {\n  ?s a <http://...> .\n}'}
        spellCheck={false}
      />
      {error && <p style={styles.error}>{error}</p>}
      {matchedIds !== null && !error && (
        <p style={styles.count}>{matchedIds.size} node{matchedIds.size !== 1 ? 's' : ''} matched</p>
      )}
      <div style={styles.actionRow}>
        <button style={styles.runButton} onClick={handleRun} disabled={!sparqlText.trim()}>
          Run
        </button>
        <button style={styles.clearButton} onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  presetRow: {
    display: 'flex',
    gap: '6px',
  },
  presetButton: {
    padding: '6px 10px',
    fontSize: '12px',
    backgroundColor: colors.backgroundTab,
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
  },
  textarea: {
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '8px',
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    resize: 'vertical',
    minHeight: '140px',
    lineHeight: '1.5',
  },
  error: {
    margin: 0,
    fontSize: '12px',
    color: '#c62828',
    wordBreak: 'break-word',
  },
  count: {
    margin: 0,
    fontSize: '12px',
    color: colors.textSubtle,
  },
  actionRow: {
    display: 'flex',
    gap: '6px',
  },
  runButton: {
    flex: 1,
    padding: '7px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  clearButton: {
    padding: '7px 14px',
    fontSize: '13px',
    backgroundColor: colors.backgroundTab,
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
  },
} satisfies Record<string, React.CSSProperties>;
