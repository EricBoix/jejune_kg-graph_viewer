import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { NodeLabelMode } from '../types/graph.types';
import { useGraphData } from './GraphDataContext';
import { config } from '../config';
import { nodeHighlightPalette } from '../styles/theme';

const { viewSettings } = config;
const hiddenByDefaultSet = new Set(viewSettings.hiddenByDefaultTypes);

interface ViewSettingsContextValue {
  nodeLabelMode: NodeLabelMode;
  physicsEnabled: boolean;
  hideIsolatedNodes: boolean;
  overviewListsCollapsed: boolean;
  highlightedNodeTypes: Map<string, number>;
  visibleNodeTypes: Set<string>;
  visibleEdgeTypes: Set<string>;
  sparqlMatchedIds: Set<string> | null;
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
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<Set<string>>(new Set());
  const [visibleEdgeTypes, setVisibleEdgeTypes] = useState<Set<string>>(new Set());
  const [sparqlMatchedIds, setSparqlMatchedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    const allTypes = new Set(nodes.flatMap(n => n.types));
    hiddenByDefaultSet.forEach(t => allTypes.delete(t));
    setVisibleNodeTypes(allTypes);
    setVisibleEdgeTypes(new Set(edges.map(e => e.label)));
    setHighlightedNodeTypes(new Map());
    setSparqlMatchedIds(null);
  }, [nodes, edges]);

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

  const toggleNodeType = useCallback((type: string) => {
    setVisibleNodeTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }, []);

  const toggleEdgeType = useCallback((type: string) => {
    setVisibleEdgeTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }, []);

  return (
    <ViewSettingsContext.Provider value={{
      nodeLabelMode, physicsEnabled, hideIsolatedNodes, overviewListsCollapsed,
      highlightedNodeTypes, visibleNodeTypes, visibleEdgeTypes, sparqlMatchedIds,
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
