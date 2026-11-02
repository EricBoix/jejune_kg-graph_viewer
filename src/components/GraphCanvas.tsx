import { colors } from '../styles/theme';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';
import { useVisNetwork, NodeContextMenuRequest } from '../hooks/useVisNetwork';
import { NodeContextMenu } from './NodeContextMenu';
import { NodeCount } from './NodeCount';
import { FileSourceButton } from './FileSourceButton';
import { FitScreenButton } from './FitScreenButton';
import { PhysicsToggle } from './PhysicsToggle';

export function GraphCanvas() {
  const { nodes, edges, setSelection } = useGraphData();
  const {
    nodeLabelMode, physicsEnabled, hideIsolatedNodes,
    visibleNodeTypes, visibleEdgeTypes, highlightedNodeTypes, sparqlMatchedIds,
    pinnedNodeIds, togglePinnedNode,
  } = useViewSettings();

  // A node is visible when ANY of its types is checked (some, not every).
  // RDF nodes routinely carry several types (e.g. ['Concept','skos:Concept',
  // 'owl:NamedIndividual']); requiring every type to be checked would silently
  // hide nodes whose count IS shown in the Overview panel, because the panel
  // counts with .includes() (some semantics). Keeping both consistent avoids
  // the "1514 listed but 0 shown" confusion.
  const visibleNodes = useMemo(
    () => nodes.filter(n => n.types.length === 0 || n.types.some(t => visibleNodeTypes.has(t))),
    [nodes, visibleNodeTypes]
  );

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map(n => n.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(
    () => edges.filter(e =>
      visibleEdgeTypes.has(e.label) &&
      visibleNodeIds.has(e.from) &&
      visibleNodeIds.has(e.to)
    ),
    [edges, visibleEdgeTypes, visibleNodeIds]
  );

  // Second filter pass: drop nodes whose every edge connects to a DocumentChunk node.
  // Use the full graph (not the visible subgraph) to evaluate isolation so that a
  // node hidden only because its neighbors' types are currently deselected is not
  // incorrectly classified as isolated.
  const displayedNodes = useMemo(() => {
    if (!hideIsolatedNodes) return visibleNodes;
    const allDocumentIds = new Set(
      nodes.filter(n => n.types.includes('DocumentChunk')).map(n => n.id)
    );
    const connectedToNonDoc = new Set<string>();
    for (const edge of edges) {
      if (!allDocumentIds.has(edge.from) || !allDocumentIds.has(edge.to)) {
        connectedToNonDoc.add(edge.from);
        connectedToNonDoc.add(edge.to);
      }
    }
    return visibleNodes.filter(n => allDocumentIds.has(n.id) || connectedToNonDoc.has(n.id));
  }, [visibleNodes, nodes, edges, hideIsolatedNodes]);

  const displayedNodeIds = useMemo(
    () => new Set(displayedNodes.map(n => n.id)),
    [displayedNodes]
  );

  const displayedEdges = useMemo(
    () => visibleEdges.filter(e => displayedNodeIds.has(e.from) && displayedNodeIds.has(e.to)),
    [visibleEdges, displayedNodeIds]
  );

  const sparqlNodes = useMemo(
    () => sparqlMatchedIds ? displayedNodes.filter(n => sparqlMatchedIds.has(n.id)) : displayedNodes,
    [displayedNodes, sparqlMatchedIds]
  );

  const sparqlEdges = useMemo(
    () =>
      sparqlMatchedIds
        ? displayedEdges.filter(e => sparqlMatchedIds.has(e.from) && sparqlMatchedIds.has(e.to))
        : displayedEdges,
    [displayedEdges, sparqlMatchedIds]
  );

  const [contextMenu, setContextMenu] = useState<NodeContextMenuRequest | null>(null);
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // A new graph load resets the pins; a menu left open would act on a stale node.
  useEffect(() => { setContextMenu(null); }, [nodes]);

  const { containerRef, fit } = useVisNetwork({
    nodes: sparqlNodes,
    edges: sparqlEdges,
    nodeLabelMode,
    physicsEnabled,
    highlightedNodeTypes,
    pinnedNodeIds,
    onSelect: setSelection,
    onNodeContextMenu: setContextMenu,
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.backgroundCanvas,
        }}
      />
      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          entries={[
            {
              label: 'Pinned',
              checked: pinnedNodeIds.has(contextMenu.nodeId),
              onSelect: () => togglePinnedNode(contextMenu.nodeId),
            },
          ]}
        />
      )}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <NodeCount displayed={sparqlNodes.length} total={nodes.length} />
        <FileSourceButton />
      </div>
      <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
        <FitScreenButton onFit={fit} />
        <PhysicsToggle />
      </div>
    </div>
  );
}
