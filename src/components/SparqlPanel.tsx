import { useState } from 'react';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';
import { useSparqlQuery } from '../hooks/useSparqlQuery';
import { useSparqlRemote } from '../hooks/useSparqlRemote';
import { useOxigraph } from '../context/OxigraphContext';
import { colors } from '../styles/theme';

const NEO_MENTIONS = 'http://example.org/neo4j/MENTIONS';

function buildTopByMentionsQuery(limit: number): string {
  return `SELECT ?x (COUNT(*) AS ?degree) WHERE {
  { ?x <${NEO_MENTIONS}> ?o }
  UNION
  { ?s <${NEO_MENTIONS}> ?x }
}
GROUP BY ?x
ORDER BY DESC(?degree)
LIMIT ${limit}`;
}

export function SparqlPanel() {
  const { nodes, n3Store } = useGraphData();
  const { setSparqlMatchedIds, sparqlMatchedIds } = useViewSettings();
  const oxigraphUrl = useOxigraph();

  const { run: runLocal, clear: clearLocal, error: errorLocal } = useSparqlQuery(
    n3Store,
    nodes,
    setSparqlMatchedIds,
  );
  const { runRemote, clearRemote, error: errorRemote } = useSparqlRemote(
    oxigraphUrl ?? '',
    nodes,
    setSparqlMatchedIds,
  );

  const run = oxigraphUrl ? runRemote : runLocal;
  const clear = oxigraphUrl ? clearRemote : clearLocal;
  const error = oxigraphUrl ? errorRemote : errorLocal;

  const [sparqlText, setSparqlText] = useState('');
  const [topLimit, setTopLimit] = useState(20);

  function handleRun() {
    run(sparqlText);
  }

  function handleClear() {
    clear();
    setSparqlText('');
  }

  function handleTopByMentions() {
    const query = buildTopByMentionsQuery(topLimit);
    setSparqlText(query);
    run(query);
  }

  function handleLimitChange(event: React.ChangeEvent<HTMLInputElement>) {
    const parsed = parseInt(event.target.value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setTopLimit(parsed);
    }
  }

  return (
    <div style={styles.panel}>
      <div style={styles.presetRow}>
        <button style={styles.presetButton} onClick={handleTopByMentions}>
          Top N by degree
        </button>
        <input
          type="number"
          min={1}
          value={topLimit}
          onChange={handleLimitChange}
          style={styles.limitInput}
        />
      </div>
      <textarea
        style={styles.textarea}
        value={sparqlText}
        onChange={e => setSparqlText(e.target.value)}
        placeholder={'SELECT ?s WHERE {\n  ?s a <http://...> .\n}'}
        spellCheck={false}
      />
      {error && <p style={styles.error}>{error}</p>}
      {sparqlMatchedIds !== null && !error && (
        <p style={styles.count}>{sparqlMatchedIds.size} node{sparqlMatchedIds.size !== 1 ? 's' : ''} matched</p>
      )}
      {oxigraphUrl && (
        <p style={styles.modeLabel}>Oxigraph mode — queries sent to server</p>
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
  limitInput: {
    width: '56px',
    padding: '6px 6px',
    fontSize: '12px',
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    textAlign: 'right' as const,
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
  modeLabel: {
    margin: 0,
    fontSize: '11px',
    color: colors.textMuted,
    fontStyle: 'italic',
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
