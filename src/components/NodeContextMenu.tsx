import { useEffect } from 'react';
import { colors } from '../styles/theme';

export interface NodeContextMenuEntry {
  label: string;
  checked?: boolean;
  onSelect: () => void;
}

interface NodeContextMenuProps {
  x: number;
  y: number;
  entries: NodeContextMenuEntry[];
  onClose: () => void;
}

export function NodeContextMenu({ x, y, entries, onClose }: NodeContextMenuProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div
        style={styles.backdrop}
        onMouseDown={onClose}
        onContextMenu={(event) => { event.preventDefault(); onClose(); }}
      />
      <ul style={{ ...styles.menu, left: x, top: y }}>
        {entries.map(entry => (
          <li
            key={entry.label}
            style={styles.entry}
            onClick={() => { entry.onSelect(); onClose(); }}
          >
            <span style={styles.check}>{entry.checked ? '✓' : ''}</span>
            {entry.label}
          </li>
        ))}
      </ul>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    zIndex: 19,
  },
  menu: {
    position: 'absolute',
    zIndex: 20,
    margin: 0,
    padding: '4px 0',
    listStyle: 'none',
    backgroundColor: 'white',
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    minWidth: '120px',
  },
  entry: {
    padding: '6px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  check: {
    display: 'inline-block',
    width: '14px',
  },
} satisfies Record<string, React.CSSProperties>;
