import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useGraphData } from './GraphDataContext';
import { useViewSettings } from './ViewSettingsContext';
import { useOxigraph } from './OxigraphContext';
import { useDisplayedGraph } from '../hooks/useDisplayedGraph';
import { NetworkHandle, NodePositions } from '../hooks/useVisNetwork';
import { GraphSetup, GraphSetupSerializer } from '../services/graphSetup';

const MAX_LISTED_SKIPPED_IDS = 10;

interface SceneContextValue {
  registerNetworkHandle: (handle: NetworkHandle | null) => void;
  saveSetup: () => void;
  loadSetupFromFile: (file: File) => Promise<void>;
  notice: string | null;
  dismissNotice: () => void;
}

const SceneContext = createContext<SceneContextValue | null>(null);

function downloadText(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/yaml' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function SceneProvider({ children }: { children: ReactNode }) {
  const { nodes, edges, namespaces, sourceName } = useGraphData();
  const {
    nodeLabelMode, hideIsolatedNodes, highlightedNodeTypes, visibleEdgeTypes, pinnedNodeIds,
    applyScene, setPhysicsEnabled,
  } = useViewSettings();
  const { displayedNodes } = useDisplayedGraph();
  const oxigraphUrl = useOxigraph();

  const networkHandleRef = useRef<NetworkHandle | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const registerNetworkHandle = useCallback((handle: NetworkHandle | null) => {
    networkHandleRef.current = handle;
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const saveSetup = useCallback(() => {
    const pinnedDisplayedIds = displayedNodes.map(node => node.id).filter(id => pinnedNodeIds.has(id));
    const positions = networkHandleRef.current?.getPositions(pinnedDisplayedIds) ?? {};
    const allEdgeTypes = new Set(edges.map(edge => edge.label));

    const setup: GraphSetup = {
      source: oxigraphUrl
        ? { kind: 'triplestore' }
        : { kind: 'file', turtle_file: sourceName },
      nodeLabelMode,
      hideIsolatedNodes,
      highlightedNodeTypes: Object.fromEntries(highlightedNodeTypes),
      hiddenEdgeTypes: [...allEdgeTypes].filter(type => !visibleEdgeTypes.has(type)).sort(),
      nodes: displayedNodes.map(node => ({
        id: node.id,
        pinned: pinnedNodeIds.has(node.id),
        ...(positions[node.id] ?? {}),
      })),
    };

    const baseName = (sourceName ?? 'graph').replace(/\.[^.]+$/, '');
    downloadText(`${baseName}.graph-setup.yaml`, new GraphSetupSerializer(namespaces).serialize(setup));
  }, [
    displayedNodes, pinnedNodeIds, edges, oxigraphUrl, sourceName, nodeLabelMode, hideIsolatedNodes,
    highlightedNodeTypes, visibleEdgeTypes, namespaces,
  ]);

  const applySetup = useCallback((setup: GraphSetup) => {
    const warnings: string[] = [];
    const currentKind = oxigraphUrl ? 'triplestore' : 'file';
    if (setup.source.kind !== currentKind) {
      warnings.push(`The setup was written for a ${setup.source.kind} source, the loaded graph comes from a ${currentKind}.`);
    } else if (setup.source.kind === 'file' && setup.source.turtle_file && sourceName
        && setup.source.turtle_file.split('/').pop() !== sourceName) {
      warnings.push(`The setup was written for ${setup.source.turtle_file}, the loaded file is ${sourceName}.`);
    }

    const knownNodeIds = new Set(nodes.map(node => node.id));
    const foundNodes = setup.nodes.filter(node => knownNodeIds.has(node.id));
    const skippedIds = setup.nodes.filter(node => !knownNodeIds.has(node.id)).map(node => node.id);
    if (skippedIds.length > 0) {
      const listed = skippedIds.slice(0, MAX_LISTED_SKIPPED_IDS).join(', ');
      const more = skippedIds.length > MAX_LISTED_SKIPPED_IDS ? `, … (${skippedIds.length} in total)` : '';
      warnings.push(`${skippedIds.length} node(s) of the setup are not in the graph and were skipped: ${listed}${more}`);
    }

    const pinnedNodes = foundNodes.filter(node => node.pinned);
    const positions: NodePositions = {};
    pinnedNodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) positions[node.id] = { x: node.x, y: node.y };
    });
    networkHandleRef.current?.placeNodes(positions);

    const hiddenEdgeTypes = new Set(setup.hiddenEdgeTypes);
    applyScene({
      nodeLabelMode: setup.nodeLabelMode,
      hideIsolatedNodes: setup.hideIsolatedNodes,
      highlightedNodeTypes: new Map(
        Object.entries(setup.highlightedNodeTypes).filter(([, index]) => typeof index === 'number')
      ),
      displayedNodeIds: new Set(foundNodes.map(node => node.id)),
      // The setup file does not record individually hidden edges: all edges are displayed again.
      displayedEdgeIds: new Set(edges.map(edge => edge.id)),
      visibleEdgeTypes: new Set(edges.map(edge => edge.label).filter(type => !hiddenEdgeTypes.has(type))),
      pinnedNodeIds: new Set(pinnedNodes.map(node => node.id)),
    });

    // Pinned nodes stay at their saved coordinates; the others get a short physics run, then freeze.
    if (foundNodes.length > pinnedNodes.length) {
      setPhysicsEnabled(true);
      networkHandleRef.current?.onceStabilized(() => setPhysicsEnabled(false));
    } else {
      setPhysicsEnabled(false);
    }

    setNotice(warnings.length > 0 ? warnings.join('\n') : null);
  }, [nodes, edges, sourceName, oxigraphUrl, applyScene, setPhysicsEnabled]);

  const loadSetupFromText = useCallback((text: string) => {
    try {
      applySetup(new GraphSetupSerializer(namespaces).parse(text));
    } catch (error) {
      setNotice(`Cannot load setup: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [namespaces, applySetup]);

  const loadSetupFromFile = useCallback(
    async (file: File) => loadSetupFromText(await file.text()),
    [loadSetupFromText]
  );

  // Setup given by the `?setup=<url>` parameter: fetched once, then applied when the graph is loaded.
  const [pendingSetupText, setPendingSetupText] = useState<string | null>(null);
  // The reset effect of ViewSettingsProvider (a parent, so its effects run after ours in a commit)
  // wipes the scene when nodes change: apply the pending setup one render after that reset.
  const [settledNodes, setSettledNodes] = useState(nodes);

  useEffect(() => {
    const setupUrl = new URLSearchParams(window.location.search).get('setup');
    if (!setupUrl) return;
    fetch(setupUrl)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(setPendingSetupText)
      .catch(error => setNotice(`Cannot fetch setup ${setupUrl}: ${error instanceof Error ? error.message : String(error)}`));
  }, []);

  useEffect(() => setSettledNodes(nodes), [nodes]);

  useEffect(() => {
    if (pendingSetupText === null || nodes.length === 0 || settledNodes !== nodes) return;
    setPendingSetupText(null);
    loadSetupFromText(pendingSetupText);
  }, [pendingSetupText, nodes, settledNodes, loadSetupFromText]);

  return (
    <SceneContext.Provider value={{ registerNetworkHandle, saveSetup, loadSetupFromFile, notice, dismissNotice }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) throw new Error('useScene must be used within SceneProvider');
  return context;
}
