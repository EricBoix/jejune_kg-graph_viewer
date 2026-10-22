import { useEffect, useState } from 'react';
import { GraphProvider } from './context/GraphContext';
import { DocsServerProvider } from './context/DocsServerContext';
import { OxigraphProvider } from './context/OxigraphContext';
import { GraphCanvas } from './components/GraphCanvas';
import { LoadRdfButton } from './components/LoadRdfButton';
import { OxigraphSourceButton } from './components/OxigraphSourceButton';
import { FileSourceButton } from './components/FileSourceButton';
import { SettingsMenu } from './components/SettingsMenu';
import { Sidebar } from './components/Sidebar';
import { ResizeHandle } from './components/ResizeHandle';
import { useRdfStore } from './hooks/useRdfStore';
import { useOxigraph } from './context/OxigraphContext';
import { loadAllGraphs } from './hooks/useOxigraphLoad';
import { styles } from './styles/App.styles';
import { config } from './config';
import sampleTtl from './data/sample.ttl?raw';
import bracketCodeIcon from './assets/bracket-code-icon.png';
import jejuneIcon from './assets/jejune-icon.png';

function AppContent() {
  const { loadRdfFromString } = useRdfStore();
  const oxigraphUrl = useOxigraph();
  const [sidebarWidth, setSidebarWidth] = useState<number>(config.sidebar.defaultWidth);

  useEffect(() => {
    if (oxigraphUrl) {
      loadAllGraphs(oxigraphUrl)
        .then(turtle => loadRdfFromString(turtle))
        .catch(() => loadRdfFromString(sampleTtl));
      return;
    }

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
  }, [oxigraphUrl, loadRdfFromString]);

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
        <h1 style={styles.title}>
          <a
            href="https://github.com/EricBoix/jejune_project"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.repoLink}
            title="jejune project"
          >
            <img src={jejuneIcon} alt="jejune project" style={styles.repoIcon} />
          </a>
          Knowledge Graph Visualization
          <a
            href={config.project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.repoLink}
            title="GitHub repository"
          >
            <img src={bracketCodeIcon} alt="GitHub repository" style={styles.repoIcon} />
          </a>
        </h1>
        <div style={styles.toolbar}>
          {oxigraphUrl ? (
            <OxigraphSourceButton />
          ) : (
            <>
              <LoadRdfButton />
              <FileSourceButton />
            </>
          )}
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
      <OxigraphProvider>
        <GraphProvider>
          <AppContent />
        </GraphProvider>
      </OxigraphProvider>
    </DocsServerProvider>
  );
}

export default App;
