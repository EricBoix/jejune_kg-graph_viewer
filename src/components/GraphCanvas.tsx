import { colors } from '../styles/theme';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';
import { useScene } from '../context/SceneContext';
import { useDisplayedGraph } from '../hooks/useDisplayedGraph';
import { useVisNetwork, NodeContextMenuRequest } from '../hooks/useVisNetwork';
import { SetupNotice } from './SetupNotice';
import { NodeContextMenu } from './NodeContextMenu';
import { NodeCount } from './NodeCount';
import { FileSourceButton } from './FileSourceButton';
import { FitScreenButton } from './FitScreenButton';
import { PhysicsToggle } from './PhysicsToggle';

export function GraphCanvas() {
  const { nodes, setSelection } = useGraphData();
  const {
    nodeLabelMode, physicsEnabled,
    highlightedNodeTypes, sparqlMatchedIds,
    pinnedNodeIds, togglePinnedNode, hideNode,
  } = useViewSettings();
  const { registerNetworkHandle, notice, dismissNotice } = useScene();

  const { displayedNodes, displayedEdges } = useDisplayedGraph();

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

  const { containerRef, fit, networkHandle } = useVisNetwork({
    nodes: sparqlNodes,
    edges: sparqlEdges,
    nodeLabelMode,
    physicsEnabled,
    highlightedNodeTypes,
    pinnedNodeIds,
    onSelect: setSelection,
    onNodeContextMenu: setContextMenu,
  });

  useEffect(() => {
    registerNetworkHandle(networkHandle);
    return () => registerNetworkHandle(null);
  }, [registerNetworkHandle, networkHandle]);

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
      {notice && <SetupNotice message={notice} onDismiss={dismissNotice} />}
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
            {
              label: 'Hide',
              onSelect: () => hideNode(contextMenu.nodeId),
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
