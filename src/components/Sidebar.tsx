import { colors } from '../styles/theme';
import { useState, useEffect } from 'react';
import { InfoPanel } from './InfoPanel';
import { EditPanel } from './EditPanel';
import { OverviewPanel } from './OverviewPanel';
import { SparqlPanel } from './SparqlPanel';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';

interface SidebarProps {
  width: number;
}

type PanelId = 'info' | 'edit' | 'overview' | 'sparql';

export function Sidebar({ width }: SidebarProps) {
  const [activePanel, setActivePanel] = useState<PanelId>('info');
  const { selection } = useGraphData();
  const { setSparqlMatchedIds } = useViewSettings();

  useEffect(() => {
    if (selection.type !== null) setActivePanel('info');
  }, [selection]);

  function switchPanel(panel: PanelId) {
    if (activePanel === 'sparql' && panel !== 'sparql') {
      setSparqlMatchedIds(null);
    }
    setActivePanel(panel);
  }

  return (
    <div style={{ ...styles.sidebar, width }}>
      <div style={styles.tabs}>
        <button
          onClick={() => switchPanel('info')}
          style={{ ...styles.tab, ...(activePanel === 'info' ? styles.activeTab : {}) }}
        >
          Info
        </button>
        <button
          onClick={() => switchPanel('edit')}
          style={{ ...styles.tab, ...(activePanel === 'edit' ? styles.activeTab : {}) }}
        >
          Edit
        </button>
        <button
          onClick={() => switchPanel('overview')}
          style={{ ...styles.tab, ...(activePanel === 'overview' ? styles.activeTab : {}) }}
        >
          Overview
        </button>
        <button
          onClick={() => switchPanel('sparql')}
          style={{ ...styles.tab, ...(activePanel === 'sparql' ? styles.activeTab : {}) }}
        >
          SPARQL
        </button>
      </div>
      <div style={styles.panelContainer}>
        {activePanel === 'info' && <InfoPanel />}
        {activePanel === 'edit' && <EditPanel />}
        {activePanel === 'overview' && <OverviewPanel />}
        {activePanel === 'sparql' && <SparqlPanel />}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: `1px solid ${colors.border}`,
  },
  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${colors.border}`,
  },
  tab: {
    flex: 1,
    padding: '12px',
    border: 'none',
    backgroundColor: colors.backgroundTab,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  activeTab: {
    backgroundColor: 'white',
    borderBottom: `2px solid ${colors.primary}`,
  },
  panelContainer: {
    flex: 1,
    overflow: 'auto',
  },
} satisfies Record<string, React.CSSProperties>;
