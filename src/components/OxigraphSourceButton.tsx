import { colors } from '../styles/theme';
import { useOxigraph } from '../context/OxigraphContext';
import { useRdfStore } from '../hooks/useRdfStore';
import { loadAllGraphs } from '../hooks/useOxigraphLoad';

function hostPort(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function OxigraphSourceButton() {
  const oxigraphUrl = useOxigraph();
  const { loadRdfFromString } = useRdfStore();

  if (!oxigraphUrl) return null;

  function handleClick() {
    loadAllGraphs(oxigraphUrl!).then(turtle => loadRdfFromString(turtle));
  }

  return (
    <button onClick={handleClick} style={styles.button} title={oxigraphUrl}>
      Oxigraph: {hostPort(oxigraphUrl)}
    </button>
  );
}

const styles = {
  button: {
    backgroundColor: 'white',
    color: colors.primary,
    border: `1px solid ${colors.border}`,
    padding: '6px 12px',
    borderRadius: '4px',
    fontWeight: 500,
    fontSize: '13px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    cursor: 'pointer',
  },
} satisfies Record<string, React.CSSProperties>;
