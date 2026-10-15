import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { Store as N3Store } from 'n3';
import { GraphNode, GraphEdge, GraphData, Selection } from '../types/graph.types';

interface GraphDataContextValue {
  nodes: GraphNode[];
  edges: GraphEdge[];
  namespaces: Record<string, string>;
  n3Store: N3Store | null;
  selection: Selection;
  selectedNode: GraphNode | undefined;
  selectedEdge: GraphEdge | undefined;
  setGraphData: (data: GraphData) => void;
  setSelection: (selection: Selection) => void;
  updateNode: (id: string, updates: Partial<Pick<GraphNode, 'label' | 'metadata'>>) => void;
  updateEdge: (id: string, updates: Partial<Pick<GraphEdge, 'label'>>) => void;
}

const GraphDataContext = createContext<GraphDataContextValue | null>(null);

export function GraphDataProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [namespaces, setNamespaces] = useState<Record<string, string>>({});
  const [n3Store, setN3Store] = useState<N3Store | null>(null);
  const [selection, setSelection] = useState<Selection>({ type: null, id: null });

  const setGraphData = useCallback((data: GraphData) => {
    setNodes(data.nodes);
    setEdges(data.edges);
    setNamespaces(data.namespaces);
    setN3Store(data.n3Store);
    setSelection({ type: null, id: null });
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<Pick<GraphNode, 'label' | 'metadata'>>) => {
    setNodes(prev => prev.map(node => node.id === id ? { ...node, ...updates } : node));
  }, []);

  const updateEdge = useCallback((id: string, updates: Partial<Pick<GraphEdge, 'label'>>) => {
    setEdges(prev => prev.map(edge => edge.id === id ? { ...edge, ...updates } : edge));
  }, []);

  const selectedNode = useMemo(
    () => selection.type === 'node' && selection.id ? nodes.find(n => n.id === selection.id) : undefined,
    [selection, nodes]
  );

  const selectedEdge = useMemo(
    () => selection.type === 'edge' && selection.id ? edges.find(e => e.id === selection.id) : undefined,
    [selection, edges]
  );

  return (
    <GraphDataContext.Provider value={{
      nodes, edges, namespaces, n3Store, selection, selectedNode, selectedEdge,
      setGraphData, setSelection, updateNode, updateEdge,
    }}>
      {children}
    </GraphDataContext.Provider>
  );
}

export function useGraphData() {
  const context = useContext(GraphDataContext);
  if (!context) throw new Error('useGraphData must be used within GraphDataProvider');
  return context;
}
