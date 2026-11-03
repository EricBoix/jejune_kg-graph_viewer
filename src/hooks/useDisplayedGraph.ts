import { useMemo } from 'react';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';

// Nodes and edges currently on the canvas, before any SPARQL highlighting filter.
export function useDisplayedGraph() {
  const { nodes, edges } = useGraphData();
  const { displayedNodeIds, visibleEdgeTypes, hideIsolatedNodes } = useViewSettings();

  const visibleNodes = useMemo(
    () => nodes.filter(node => displayedNodeIds.has(node.id)),
    [nodes, displayedNodeIds]
  );

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map(node => node.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(
    () => edges.filter(edge =>
      visibleEdgeTypes.has(edge.label) &&
      visibleNodeIds.has(edge.from) &&
      visibleNodeIds.has(edge.to)
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
      nodes.filter(node => node.types.includes('DocumentChunk')).map(node => node.id)
    );
    const connectedToNonDoc = new Set<string>();
    for (const edge of edges) {
      if (!allDocumentIds.has(edge.from) || !allDocumentIds.has(edge.to)) {
        connectedToNonDoc.add(edge.from);
        connectedToNonDoc.add(edge.to);
      }
    }
    return visibleNodes.filter(node => allDocumentIds.has(node.id) || connectedToNonDoc.has(node.id));
  }, [visibleNodes, nodes, edges, hideIsolatedNodes]);

  const displayedIds = useMemo(
    () => new Set(displayedNodes.map(node => node.id)),
    [displayedNodes]
  );

  const displayedEdges = useMemo(
    () => visibleEdges.filter(edge => displayedIds.has(edge.from) && displayedIds.has(edge.to)),
    [visibleEdges, displayedIds]
  );

  return { displayedNodes, displayedEdges };
}
