import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, ReactNode } from 'react';
import { NodeLabelMode, TypeCheckState } from '../types/graph.types';
import { useGraphData } from './GraphDataContext';
import { config } from '../config';
import { nodeHighlightPalette } from '../styles/theme';

const { viewSettings } = config;
const hiddenByDefaultSet = new Set<string>(viewSettings.hiddenByDefaultTypes);

// The part of the view that a graph-setup file rebuilds in one go.
export interface ViewScene {
  nodeLabelMode: NodeLabelMode;
  hideIsolatedNodes: boolean;
  highlightedNodeTypes: Map<string, number>;
  displayedNodeIds: Set<string>;
  displayedEdgeIds: Set<string>;
  visibleEdgeTypes: Set<string>;
  pinnedNodeIds: Set<string>;
}

interface ViewSettingsContextValue {
  nodeLabelMode: NodeLabelMode;
  physicsEnabled: boolean;
  hideIsolatedNodes: boolean;
  overviewListsCollapsed: boolean;
  highlightedNodeTypes: Map<string, number>;
  // Ids of the nodes put on display; node type checkboxes add or remove instances here.
  displayedNodeIds: Set<string>;
  // Types having at least one displayed instance (checked or dash).
  visibleNodeTypes: Set<string>;
  nodeTypeStates: Map<string, TypeCheckState>;
  visibleEdgeTypes: Set<string>;
  sparqlMatchedIds: Set<string> | null;
  pinnedNodeIds: Set<string>;
  togglePinnedNode: (nodeId: string) => void;
  hideNode: (nodeId: string) => void;
  // Ids of the individual edges put on display; the edge context menu removes them one by one.
  displayedEdgeIds: Set<string>;
  hideEdge: (edgeId: string) => void;
  applyScene: (scene: ViewScene) => void;
  setAllNodesDisplayed: (displayed: boolean) => void;
  setNodeLabelMode: (mode: NodeLabelMode) => void;
  setPhysicsEnabled: (enabled: boolean) => void;
  setHideIsolatedNodes: (value: boolean) => void;
  setOverviewListsCollapsed: (value: boolean) => void;
  toggleHighlightedNodeType: (type: string) => void;
  toggleNodeType: (type: string) => void;
  toggleEdgeType: (type: string) => void;
  setSparqlMatchedIds: (ids: Set<string> | null) => void;
}

const ViewSettingsContext = createContext<ViewSettingsContextValue | null>(null);

export function ViewSettingsProvider({ children }: { children: ReactNode }) {
  const { nodes, edges } = useGraphData();

  const [nodeLabelMode, setNodeLabelMode] = useState<NodeLabelMode>(viewSettings.nodeLabelMode);
  const [physicsEnabled, setPhysicsEnabled] = useState<boolean>(viewSettings.physicsEnabled);
  const [hideIsolatedNodes, setHideIsolatedNodes] = useState<boolean>(viewSettings.hideIsolatedNodes);
  const [overviewListsCollapsed, setOverviewListsCollapsed] = useState<boolean>(viewSettings.overviewListsCollapsed);
  const [highlightedNodeTypes, setHighlightedNodeTypes] = useState<Map<string, number>>(new Map());
  const colorCounterRef = useRef(0);
  const [displayedNodeIds, setDisplayedNodeIds] = useState<Set<string>>(new Set());
  const [visibleEdgeTypes, setVisibleEdgeTypes] = useState<Set<string>>(new Set());
  const [sparqlMatchedIds, setSparqlMatchedIds] = useState<Set<string> | null>(null);
  const [pinnedNodeIds, setPinnedNodeIds] = useState<Set<string>>(new Set());
  const [displayedEdgeIds, setDisplayedEdgeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // A node starts displayed when it has no type or at least one type not hidden by default.
    setDisplayedNodeIds(new Set(
      nodes
        .filter(node => node.types.length === 0 || node.types.some(type => !hiddenByDefaultSet.has(type)))
        .map(node => node.id)
    ));
    setVisibleEdgeTypes(new Set(edges.map(e => e.label)));
    setHighlightedNodeTypes(new Map());
    setSparqlMatchedIds(null);
    setPinnedNodeIds(new Set());
    setDisplayedEdgeIds(new Set(edges.map(edge => edge.id)));
  }, [nodes, edges]);

  const hideEdge = useCallback((edgeId: string) => {
    setDisplayedEdgeIds(prev => {
      const next = new Set(prev);
      next.delete(edgeId);
      return next;
    });
  }, []);

  const togglePinnedNode = useCallback((nodeId: string) => {
    setPinnedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Edges adjacent to the hidden node disappear with it (see useDisplayedGraph).
  const hideNode = useCallback((nodeId: string) => {
    setDisplayedNodeIds(prev => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  const toggleHighlightedNodeType = useCallback((type: string) => {
    setHighlightedNodeTypes(prev => {
      const next = new Map(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        const paletteSize = nodeHighlightPalette.length;
        const usedIndices = new Set(next.values());
        // Prefer an unused palette slot; fall back to round-robin when all are taken.
        const free = Array.from({ length: paletteSize }, (_, i) => i).find(i => !usedIndices.has(i));
        const index = free !== undefined ? free : colorCounterRef.current % paletteSize;
        colorCounterRef.current++;
        next.set(type, index);
      }
      return next;
    });
  }, []);

  const nodeTypeStates = useMemo(() => {
    const totals = new Map<string, number>();
    const displayedCounts = new Map<string, number>();
    for (const node of nodes) {
      const isDisplayed = displayedNodeIds.has(node.id);
      for (const type of node.types) {
        totals.set(type, (totals.get(type) ?? 0) + 1);
        if (isDisplayed) displayedCounts.set(type, (displayedCounts.get(type) ?? 0) + 1);
      }
    }
    const states = new Map<string, TypeCheckState>();
    totals.forEach((total, type) => {
      const displayedCount = displayedCounts.get(type) ?? 0;
      states.set(type, displayedCount === 0 ? 'unchecked' : displayedCount === total ? 'checked' : 'dash');
    });
    return states;
  }, [nodes, displayedNodeIds]);

  const visibleNodeTypes = useMemo(
    () => new Set([...nodeTypeStates].filter(([, state]) => state !== 'unchecked').map(([type]) => type)),
    [nodeTypeStates]
  );

  // Checked or dash: remove every displayed instance of the type; unchecked: display all its instances.
  const toggleNodeType = useCallback((type: string) => {
    const instanceIds = nodes.filter(node => node.types.includes(type)).map(node => node.id);
    setDisplayedNodeIds(prev => {
      const next = new Set(prev);
      if (instanceIds.some(id => prev.has(id))) {
        instanceIds.forEach(id => next.delete(id));
      } else {
        instanceIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [nodes]);

  const setAllNodesDisplayed = useCallback((displayed: boolean) => {
    setDisplayedNodeIds(displayed ? new Set(nodes.map(node => node.id)) : new Set());
    setDisplayedEdgeIds(displayed ? new Set(edges.map(edge => edge.id)) : new Set());
  }, [nodes, edges]);

  const applyScene = useCallback((scene: ViewScene) => {
    setNodeLabelMode(scene.nodeLabelMode);
    setHideIsolatedNodes(scene.hideIsolatedNodes);
    setHighlightedNodeTypes(scene.highlightedNodeTypes);
    setDisplayedNodeIds(scene.displayedNodeIds);
    setDisplayedEdgeIds(scene.displayedEdgeIds);
    setVisibleEdgeTypes(scene.visibleEdgeTypes);
    setPinnedNodeIds(scene.pinnedNodeIds);
  }, []);

  const toggleEdgeType = useCallback((type: string) => {
    setVisibleEdgeTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  return (
    <ViewSettingsContext.Provider value={{
      nodeLabelMode, physicsEnabled, hideIsolatedNodes, overviewListsCollapsed,
      highlightedNodeTypes, displayedNodeIds, visibleNodeTypes, nodeTypeStates, visibleEdgeTypes, sparqlMatchedIds,
      pinnedNodeIds, togglePinnedNode, hideNode, displayedEdgeIds, hideEdge, applyScene, setAllNodesDisplayed,
      setNodeLabelMode, setPhysicsEnabled, setHideIsolatedNodes, setOverviewListsCollapsed,
      toggleHighlightedNodeType, toggleNodeType, toggleEdgeType, setSparqlMatchedIds,
    }}>
      {children}
    </ViewSettingsContext.Provider>
  );
}

export function useViewSettings() {
  const context = useContext(ViewSettingsContext);
  if (!context) throw new Error('useViewSettings must be used within ViewSettingsProvider');
  return context;
}
