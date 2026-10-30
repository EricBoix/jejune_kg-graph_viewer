import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';
import { uriToPrefixedName } from '../services/rdfParser';
import { config } from '../config';
import { GraphNode } from '../types/graph.types';
import { NodeDetails } from './NodeDetails';
import { styles } from './EdgeInfoPanel.styles';

const NEO_ID_PREDICATE = config.rdf.neo4jIdPredicateUri;

interface NodePopup    { node: GraphNode; x: number; y: number }
interface AnchoredPopup { node: GraphNode; left: number; top: number }

export function EdgeInfoPanel() {
  const { selectedEdge, namespaces, nodes } = useGraphData();
  const { nodeLabelMode } = useViewSettings();

  const [nodePopup,     setNodePopup]     = useState<NodePopup | null>(null);
  const [popupLeft,     setPopupLeft]     = useState(0);
  const [anchoredPopup, setAnchoredPopup] = useState<AnchoredPopup | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!nodePopup || !popupRef.current) return;
    const w = popupRef.current.offsetWidth;
    setPopupLeft(Math.min(nodePopup.x + 14, window.innerWidth - w - 8));
  }, [nodePopup]);

  useEffect(() => {
    if (!anchoredPopup) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setAnchoredPopup(null); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [anchoredPopup]);

  // Discard anchored popup when the selected edge changes.
  useEffect(() => { setAnchoredPopup(null); }, [selectedEdge]);

  if (!selectedEdge) return null;

  const resolveNode = (uri: string) => nodes.find(n => n.id === uri);

  const nodeLabel = (uri: string) => {
    const node = resolveNode(uri);
    if (!node) return uriToPrefixedName(uri, namespaces);
    return nodeLabelMode === 'neoId'
      ? (node.metadata[NEO_ID_PREDICATE]?.[0] ?? node.label)
      : node.label;
  };

  const hoverProps = (uri: string) => {
    const node = resolveNode(uri);
    if (!node) return {};
    return {
      onMouseEnter: (e: React.MouseEvent) => { setAnchoredPopup(null); setNodePopup({ node, x: e.clientX, y: e.clientY }); },
      onMouseMove:  (e: React.MouseEvent) => setNodePopup(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null),
      onMouseLeave: () => setNodePopup(null),
      onClick:      () => {
        setAnchoredPopup({ node, left: popupLeft, top: (nodePopup?.y ?? 0) + 14 });
        setNodePopup(null);
      },
    };
  };

  return (
    <>
      <h3 style={styles.title}>Edge: {selectedEdge.label}</h3>
      <div style={styles.predicateSection}>
        <strong>Predicate URI:</strong>
        <span style={styles.uri} title={selectedEdge.predicateUri}>{uriToPrefixedName(selectedEdge.predicateUri, namespaces)}</span>
      </div>
      <div style={styles.section}>
        <strong>From:</strong>{' '}
        <span style={styles.hoverable} title="Click to pin" {...hoverProps(selectedEdge.from)}>{nodeLabel(selectedEdge.from)}</span>
      </div>
      <div style={styles.section}>
        <strong>To:</strong>{' '}
        <span style={styles.hoverable} title="Click to pin" {...hoverProps(selectedEdge.to)}>{nodeLabel(selectedEdge.to)}</span>
      </div>
      {selectedEdge.chunkIds && selectedEdge.chunkIds.length > 0 && (
        <div style={styles.section}>
          <strong>Extracted from:</strong>
          <ul>
            {selectedEdge.chunkIds.map(chunkId => (
              <li key={chunkId}>
                <span style={styles.hoverable} title="Click to pin" {...hoverProps(chunkId)}>{nodeLabel(chunkId)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedEdge.properties && Object.entries(selectedEdge.properties).map(([predicateUri, values]) => (
        <div key={predicateUri} style={styles.section}>
          <strong>{uriToPrefixedName(predicateUri, namespaces)}:</strong> {values.join(', ')}
        </div>
      ))}
      {nodePopup && (
        <div ref={popupRef} style={{ ...styles.popup, left: popupLeft, top: nodePopup.y + 14 }}>
          <NodeDetails node={nodePopup.node} />
        </div>
      )}
      {anchoredPopup && (
        <div style={{ ...styles.anchoredPopup, left: anchoredPopup.left, top: anchoredPopup.top }}>
          <div style={styles.anchoredHeader}>
            <button style={styles.closeButton} onClick={() => setAnchoredPopup(null)}>✕</button>
          </div>
          <div style={styles.anchoredContent}>
            <NodeDetails node={anchoredPopup.node} />
          </div>
        </div>
      )}
    </>
  );
}
