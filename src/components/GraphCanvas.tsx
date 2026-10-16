import { colors } from '../styles/theme';
import { useMemo } from 'react';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';
import { useVisNetwork } from '../hooks/useVisNetwork';
import { NodeCount } from './NodeCount';
import { FitScreenButton } from './FitScreenButton';
import { PhysicsToggle } from './PhysicsToggle';

export function GraphCanvas() {
  const { nodes, edges, setSelection } = useGraphData();
  const {
    nodeLabelMode, physicsEnabled, hideIsolatedNodes,
    visibleNodeTypes, visibleEdgeTypes, highlightedNodeTypes, sparqlMatchedIds,
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

  // Second filter pass: drop nodes whose every edge connects to a Document node.
  // Use the full graph (not the visible subgraph) to evaluate isolation so that a
  // node hidden only because its neighbors' types are currently deselected is not
  // incorrectly classified as isolated.
  const displayedNodes = useMemo(() => {
    if (!hideIsolatedNodes) return visibleNodes;
    const allDocumentIds = new Set(
      nodes.filter(n => n.types.includes('Document')).map(n => n.id)
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

  const { containerRef, fit } = useVisNetwork({
    nodes: sparqlNodes,
    edges: sparqlEdges,
    nodeLabelMode,
    physicsEnabled,
    highlightedNodeTypes,
    onSelect: setSelection,
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
      <NodeCount displayed={sparqlNodes.length} total={nodes.length} />
      <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '8px' }}>
        <FitScreenButton onFit={fit} />
        <PhysicsToggle />
      </div>
    </div>
  );
}
