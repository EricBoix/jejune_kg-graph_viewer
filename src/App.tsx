import { GraphProvider } from './context/GraphContext';
import { DocsServerProvider } from './context/DocsServerContext';
import { OxigraphProvider } from './context/OxigraphContext';
import { GraphCanvas } from './components/GraphCanvas';
import { LoadRdfButton } from './components/LoadRdfButton';
import { OxigraphSourceButton } from './components/OxigraphSourceButton';
import { FileSourceButton } from './components/FileSourceButton';
import { SettingsMenu } from './components/SettingsMenu';
import { SetupButtons } from './components/SetupButtons';
import { Sidebar } from './components/Sidebar';
import { ResizeHandle } from './components/ResizeHandle';
import { useInitialGraphLoad } from './hooks/useInitialGraphLoad';
import { useSidebarResize } from './hooks/useSidebarResize';
import { useOxigraph } from './context/OxigraphContext';
import { styles } from './styles/App.styles';
import { config } from './config';
import bracketCodeIcon from './assets/bracket-code-icon.png';
import jejuneIcon from './assets/jejune-icon.png';

function AppContent() {
  const oxigraphUrl = useOxigraph();
  const { sidebarWidth, onHandleMouseDown } = useSidebarResize();
  useInitialGraphLoad();

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
          <SetupButtons />
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
