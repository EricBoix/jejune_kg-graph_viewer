import { colors } from '../styles/theme';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';

interface NodeCountProps {
  displayed: number;
  total: number;
}

export function NodeCount({ displayed, total }: NodeCountProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { nodes } = useGraphData();
  const { visibleNodeTypes, toggleNodeType } = useViewSettings();

  const hiddenTypes = useMemo(() => {
    const all = new Set(nodes.flatMap(n => n.types));
    return [...all].filter(t => !visibleNodeTypes.has(t)).sort();
  }, [nodes, visibleNodeTypes]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={styles.wrapper}>
      {open && (
        <div style={styles.popup}>
          <div style={styles.heading}>Hidden node types</div>
          {hiddenTypes.length === 0
            ? <div style={styles.empty}>All node types visible</div>
            : hiddenTypes.map(t => (
              <label key={t} style={styles.row}>
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleNodeType(t)}
                  style={styles.checkbox}
                />
                {t}
              </label>
            ))
          }
        </div>
      )}
      <div
        style={{ ...styles.badge, cursor: 'pointer' }}
        onClick={() => setOpen(v => !v)}
        title="Click to see hidden node types"
      >
        {displayed} / {total} nodes
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
  },
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
  popup: {
    backgroundColor: 'white',
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    marginBottom: '6px',
    minWidth: '160px',
    padding: '8px 12px',
  },
  heading: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: colors.textSubtle,
    borderBottom: '1px solid #eee',
    paddingBottom: '4px',
    marginBottom: '4px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    fontSize: '14px',
    cursor: 'pointer',
  },
  checkbox: {
    cursor: 'pointer',
    flexShrink: 0,
  },
  empty: {
    color: colors.textFaint,
    fontStyle: 'italic',
    fontSize: '13px',
  },
} satisfies Record<string, React.CSSProperties>;
