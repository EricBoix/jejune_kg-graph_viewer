import { colors, nodeHighlightPalette } from '../styles/theme';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { GraphNode, GraphEdge, Selection, NodeLabelMode } from '../types/graph.types';

import { config } from '../config';
const NEO_ID_PREDICATE = config.rdf.neo4jIdPredicateUri;
const JEJUNE_SIMILAR_TO = 'urn:jejune:similarTo';

interface UseVisNetworkProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeLabelMode: NodeLabelMode;
  physicsEnabled: boolean;
  highlightedNodeTypes: Map<string, number>;
  pinnedNodeIds: Set<string>;
  onSelect: (selection: Selection) => void;
  onNodeContextMenu: (request: NodeContextMenuRequest) => void;
  onEdgeContextMenu: (request: EdgeContextMenuRequest) => void;
}

export type NodePositions = Record<string, { x: number; y: number }>;

// Canvas access for saving and restoring a scene (see SceneContext).
export interface NetworkHandle {
  getPositions: (nodeIds: string[]) => NodePositions;
  // Positions are applied together with the next node sync, once the nodes exist on the canvas.
  placeNodes: (positions: NodePositions) => void;
  onceStabilized: (callback: () => void) => void;
}

export interface NodeContextMenuRequest {
  nodeId: string;
  x: number;
  y: number;
}

export interface EdgeContextMenuRequest {
  edgeId: string;
  x: number;
  y: number;
}

interface NodeColor {
  background: string;
  border: string;
  highlight: { background: string; border: string };
}

type VisNode = { id: string; label: string; color?: NodeColor; physics?: boolean; borderWidth?: number; x?: number; y?: number };

const { graph } = config;

const networkOptions: Options = {
  nodes: {
    shape: 'dot',
    size: graph.nodeSizePx,
    font: {
      size: graph.nodeFontSizePx,
      color: colors.textDark,
    },
    borderWidth: graph.nodeBorderWidthPx,
    color: {
      border: colors.primary,
      background: colors.nodeBackground,
      highlight: {
        border: colors.primary,
        background: colors.primaryHighlight,
      },
    },
  },
  edges: {
    width: graph.edgeWidthPx,
    color: {
      color: colors.edgeDefault,
      highlight: colors.primary,
    },
    font: {
      size: graph.edgeFontSizePx,
      align: 'middle',
    },
    arrows: {
      to: { enabled: true, scaleFactor: 0.5 },
    },
    smooth: {
      enabled: true,
      type: 'continuous',
      roundness: 0.5,
    },
  },
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based',
    forceAtlas2Based: {
      gravitationalConstant: graph.physics.gravitationalConstant,
      centralGravity:        graph.physics.centralGravity,
      springLength:          graph.physics.springLength,
      springConstant:        graph.physics.springConstant,
    },
    stabilization: {
      iterations: graph.physics.stabilizationIter,
    },
  },
  interaction: {
    hover: true,
    selectConnectedEdges: false,
  },
};

export function useVisNetwork({ nodes, edges, nodeLabelMode, physicsEnabled, highlightedNodeTypes, pinnedNodeIds, onSelect, onNodeContextMenu, onEdgeContextMenu }: UseVisNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDataSetRef = useRef<DataSet<VisNode>>(new DataSet());
  const edgesDataSetRef = useRef<DataSet<{ id: string; from: string; to: string; label: string }>>(new DataSet());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const pendingPositionsRef = useRef<NodePositions>({});
  const onNodeContextMenuRef = useRef(onNodeContextMenu);
  onNodeContextMenuRef.current = onNodeContextMenu;
  const onEdgeContextMenuRef = useRef(onEdgeContextMenu);
  onEdgeContextMenuRef.current = onEdgeContextMenu;

  // Initialize network once; event handlers read onSelectRef so they always
  // call the latest callback without recreating the network on every render.
  useEffect(() => {
    if (!containerRef.current) return;

    const network = new Network(
      containerRef.current,
      {
        nodes: nodesDataSetRef.current,
        edges: edgesDataSetRef.current,
      },
      networkOptions
    );

    network.on('selectNode', (params) => {
      if (params.nodes.length > 0) {
        onSelectRef.current({ type: 'node', id: params.nodes[0] });
      }
    });

    network.on('selectEdge', (params) => {
      if (params.edges.length > 0 && params.nodes.length === 0) {
        onSelectRef.current({ type: 'edge', id: params.edges[0] });
      }
    });

    network.on('deselectNode', () => {
      onSelectRef.current({ type: null, id: null });
    });

    network.on('deselectEdge', () => {
      onSelectRef.current({ type: null, id: null });
    });

    // Right-click, and ctrl-click on macOS, both emit a contextmenu event.
    network.on('oncontext', (params) => {
      const nodeId = network.getNodeAt(params.pointer.DOM);
      if (nodeId !== undefined) {
        params.event.preventDefault();
        onNodeContextMenuRef.current({
          nodeId: String(nodeId),
          x: params.pointer.DOM.x,
          y: params.pointer.DOM.y,
        });
        return;
      }
      const edgeId = network.getEdgeAt(params.pointer.DOM);
      if (edgeId === undefined) return;
      params.event.preventDefault();
      onEdgeContextMenuRef.current({
        edgeId: String(edgeId),
        x: params.pointer.DOM.x,
        y: params.pointer.DOM.y,
      });
    });

    networkRef.current = network;

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, []);

  // Sync nodes
  useEffect(() => {
    const dataSet = nodesDataSetRef.current;
    const currentIds = new Set(dataSet.getIds());
    const newIds = new Set(nodes.map(n => n.id));

    // Remove old nodes
    const toRemove = [...currentIds].filter(id => !newIds.has(id as string));
    if (toRemove.length > 0) {
      dataSet.remove(toRemove);
    }

    // Update/add nodes
    const updates = nodes.map(n => ({
      id: n.id,
      label: nodeLabelMode === 'neoId'
        ? (n.metadata[NEO_ID_PREDICATE]?.[0] ?? n.label)
        : n.label,
    }));
    dataSet.update(updates);
  }, [nodes, nodeLabelMode]);

  // Sync edges
  useEffect(() => {
    const dataSet = edgesDataSetRef.current;
    const currentIds = new Set(dataSet.getIds());
    const newIds = new Set(edges.map(e => e.id));

    // Remove old edges
    const toRemove = [...currentIds].filter(id => !newIds.has(id as string));
    if (toRemove.length > 0) {
      dataSet.remove(toRemove);
    }

    // Update/add edges — similarity edges rendered as dashed, low-weight lines
    const updates = edges.map(e =>
      e.predicateUri === JEJUNE_SIMILAR_TO
        ? {
            id: e.id,
            from: e.from,
            to: e.to,
            label: '',
            dashes: true,
            width: 1,
            color: { color: '#ccc', highlight: '#aaa' },
          }
        : { id: e.id, from: e.from, to: e.to, label: e.label },
    );
    dataSet.update(updates);
  }, [edges]);

  // Sync physics
  useEffect(() => {
    networkRef.current?.setOptions({ physics: { enabled: physicsEnabled } });
  }, [physicsEnabled]);

  // Highlight nodes belonging to the selected type; dim all others.
  useEffect(() => {
    const defaultColor: NodeColor = {
      background: colors.nodeBackground,
      border:     colors.primary,
      highlight:  { background: colors.primaryHighlight, border: colors.primary },
    };
    const dimColor: NodeColor = {
      background: colors.nodeTypeDimmed,
      border:     colors.nodeTypeDimmedBorder,
      highlight:  { background: colors.nodeTypeDimmed, border: colors.nodeTypeDimmedBorder },
    };
    const updates = nodes.map(n => {
      if (highlightedNodeTypes.size === 0) return { id: n.id, color: defaultColor };
      const matchIndex = n.types.reduce<number | null>((found, t) => {
        const idx = highlightedNodeTypes.get(t);
        return found === null && idx !== undefined ? idx : found;
      }, null);
      if (matchIndex === null) return { id: n.id, color: dimColor };
      const { background, border } = nodeHighlightPalette[matchIndex % nodeHighlightPalette.length];
      return { id: n.id, color: { background, border, highlight: { background, border } } };
    });
    nodesDataSetRef.current.update(updates);
  }, [highlightedNodeTypes, nodes]);

  // A pinned node is excluded from the physics simulation (physics: false) but
  // can still be dragged by hand; `fixed` would block dragging. Its border is
  // thicker in the same color. vis-network doubles borderWidth when selected,
  // so a selected pinned node stays thicker than a selected unpinned one.
  useEffect(() => {
    const pendingPositions = pendingPositionsRef.current;
    pendingPositionsRef.current = {};
    const updates = nodes.map(n => {
      const pinned = pinnedNodeIds.has(n.id);
      return {
        id: n.id,
        physics: !pinned,
        borderWidth: pinned ? graph.pinnedNodeBorderWidthPx : graph.nodeBorderWidthPx,
        ...(pendingPositions[n.id] ?? {}),
      };
    });
    nodesDataSetRef.current.update(updates);
  }, [pinnedNodeIds, nodes]);

  const fit = useCallback(() => {
    networkRef.current?.fit();
  }, []);

  const networkHandle = useMemo<NetworkHandle>(() => ({
    getPositions: (nodeIds) => {
      const positions = networkRef.current?.getPositions(nodeIds) ?? {};
      return Object.fromEntries(
        Object.entries(positions).map(([nodeId, { x, y }]) => [nodeId, { x, y }])
      );
    },
    placeNodes: (positions) => {
      pendingPositionsRef.current = positions;
    },
    onceStabilized: (callback) => {
      networkRef.current?.once('stabilized', callback);
    },
  }), []);

  return {
    containerRef,
    fit,
    networkHandle,
  };
}
