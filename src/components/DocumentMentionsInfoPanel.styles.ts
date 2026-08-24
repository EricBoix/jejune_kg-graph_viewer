import type { CSSProperties } from 'react';
import { colors } from '../styles/theme';

export const styles = {
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '16px 0 12px',
  },
  dividerLine: {
    flex: 1,
    border: 'none',
    borderTop: `1px solid ${colors.border}`,
  },
  dividerLabel: {
    flexShrink: 0,
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: colors.textPlaceholder,
    whiteSpace: 'nowrap',
  },
  list: {
    margin: '8px 0',
    paddingLeft: '20px',
  },
  documentItem: {
    cursor: 'pointer',
  },
  documentLabel: {
    fontWeight: 'bold',
    color: colors.textSubtle,
    textDecoration: 'underline dotted',
    textDecorationColor: colors.textPlaceholder,
  },
  popup: {
    position: 'fixed',
    zIndex: 1000,
    background: '#fff',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    padding: '10px 12px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
    width: '80ch',
    maxHeight: '260px',
    overflowY: 'auto',
    fontSize: '12px',
    lineHeight: '1.5',
    pointerEvents: 'none',
  },
  tooltipSection: {
    marginBottom: '8px',
  },
  tooltipText: {
    margin: '2px 0 0',
    color: colors.textMuted,
    wordBreak: 'normal',
    overflowWrap: 'break-word',
  },
  anchoredPopup: {
    position: 'fixed',
    zIndex: 1001,
    background: '#fff',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    boxShadow: '0 4px 18px rgba(0,0,0,0.22)',
    width: '80ch',
    maxHeight: '420px',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'auto',
  },
  anchoredHeader: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px 0',
  },
  openMdButton: {
    background: '#26a69a',
    border: '1px solid #004d40',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
    lineHeight: 1,
    padding: '3px 8px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    color: colors.textMuted,
    lineHeight: 1,
    padding: '2px 4px',
    borderRadius: '3px',
  },
  anchoredContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 14px 12px',
  },
} satisfies Record<string, CSSProperties>;

export const highlightStyle: CSSProperties = {
  backgroundColor: '#fff176',
  borderRadius: '2px',
  padding: '0 1px',
};
