import { colors, nodeHighlightPalette } from '../styles/theme';
import { useEffect, useRef, useCallback } from 'react';
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
  onSelect: (selection: Selection) => void;
}

interface NodeColor {
  background: string;
  border: string;
  highlight: { background: string; border: string };
}

type VisNode = { id: string; label: string; color?: NodeColor };

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

export function useVisNetwork({ nodes, edges, nodeLabelMode, physicsEnabled, highlightedNodeTypes, onSelect }: UseVisNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDataSetRef = useRef<DataSet<VisNode>>(new DataSet());
  const edgesDataSetRef = useRef<DataSet<{ id: string; from: string; to: string; label: string }>>(new DataSet());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

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

  const fit = useCallback(() => {
    networkRef.current?.fit();
  }, []);

  return {
    containerRef,
    fit,
  };
}
