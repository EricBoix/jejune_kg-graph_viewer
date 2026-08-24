import { useEffect, useState } from 'react';
import { GraphProvider } from './context/GraphContext';
import { DocsServerProvider } from './context/DocsServerContext';
import { GraphCanvas } from './components/GraphCanvas';
import { LoadRdfButton } from './components/LoadRdfButton';
import { SettingsMenu } from './components/SettingsMenu';
import { Sidebar } from './components/Sidebar';
import { ResizeHandle } from './components/ResizeHandle';
import { useRdfStore } from './hooks/useRdfStore';
import { styles } from './styles/App.styles';
import { config } from './config';
import sampleTtl from './data/sample.ttl?raw';

function AppContent() {
  const { loadRdfFromString } = useRdfStore();
  const [sidebarWidth, setSidebarWidth] = useState<number>(config.sidebar.defaultWidth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    const file = params.get('file');
    if (url) {
      fetch(url)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        })
        .then(content => loadRdfFromString(content))
        .catch(() => loadRdfFromString(sampleTtl));
    } else if (file) {
      fetch(`/data/${file}`)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        })
        .then(content => loadRdfFromString(content))
        .catch(() => loadRdfFromString(sampleTtl));
    } else {
      loadRdfFromString(sampleTtl);
    }
  }, [loadRdfFromString]);

  function onHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    function onMouseMove(ev: MouseEvent) {
      setSidebarWidth(Math.max(config.sidebar.minWidth, Math.min(config.sidebar.maxWidth, startWidth + startX - ev.clientX)));
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Knowledge Graph Visualization</h1>
        <div style={styles.toolbar}>
          <LoadRdfButton />
          <SettingsMenu />
        </div>
      </header>
      <div style={styles.main}>
        <div style={styles.canvasContainer}>
          <GraphCanvas />
        </div>
        <ResizeHandle onMouseDown={onHandleMouseDown} />
        <Sidebar width={sidebarWidth} />
      </div>
    </div>
  );
}

function App() {
  return (
    <DocsServerProvider>
      <GraphProvider>
        <AppContent />
      </GraphProvider>
    </DocsServerProvider>
  );
}

export default App;
