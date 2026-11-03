import { colors } from '../styles/theme';

interface SetupNoticeProps {
  message: string;
  onDismiss: () => void;
}

// Non-blocking message shown over the canvas, e.g. nodes of a setup missing from the graph.
export function SetupNotice({ message, onDismiss }: SetupNoticeProps) {
  return (
    <div style={styles.notice} role="status">
      <span style={styles.message}>{message}</span>
      <button onClick={onDismiss} style={styles.dismiss} title="Dismiss">×</button>
    </div>
  );
}

const styles = {
  notice: {
    position: 'absolute',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 15,
    maxWidth: '70%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: 'white',
    color: colors.textDark,
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    padding: '8px 12px',
    fontSize: '13px',
  },
  message: {
    whiteSpace: 'pre-line',
    wordBreak: 'break-word',
  },
  dismiss: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    color: colors.primary,
  },
} satisfies Record<string, React.CSSProperties>;
