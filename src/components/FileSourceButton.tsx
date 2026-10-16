import { colors } from '../styles/theme';
import { useFileSource } from '../hooks/useFileSource';

export function FileSourceButton() {
  const { fileName, sourceUrl } = useFileSource();

  if (!fileName) return null;

  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.link}
        title={sourceUrl}
      >
        {fileName}
      </a>
    );
  }

  return (
    <div style={styles.badge} title={fileName}>
      {fileName}
    </div>
  );
}

const styles = {
  badge: {
    backgroundColor: 'white',
    color: colors.primary,
    border: `1px solid ${colors.border}`,
    padding: '6px 12px',
    borderRadius: '4px',
    fontWeight: 500,
    fontSize: '13px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    userSelect: 'none',
  },
  link: {
    backgroundColor: 'white',
    color: colors.primary,
    border: `1px solid ${colors.border}`,
    padding: '6px 12px',
    borderRadius: '4px',
    fontWeight: 500,
    fontSize: '13px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    userSelect: 'none',
    textDecoration: 'none',
    display: 'inline-block',
  },
} satisfies Record<string, React.CSSProperties>;
