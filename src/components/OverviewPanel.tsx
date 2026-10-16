import { useMemo, useState } from 'react';
import { useGraphData } from '../context/GraphDataContext';
import { useViewSettings } from '../context/ViewSettingsContext';
import { nodeHighlightPalette } from '../styles/theme';
import { styles } from './OverviewPanel.styles';

type SortMode = 'alpha' | 'alpha-rev' | 'count-desc' | 'count-asc';

function sortTypes(types: string[], counts: Map<string, number>, mode: SortMode): string[] {
  const sorted = [...types];
  if (mode === 'alpha') return sorted.sort((a, b) => a.localeCompare(b));
  if (mode === 'alpha-rev') return sorted.sort((a, b) => b.localeCompare(a));
  if (mode === 'count-desc') return sorted.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
  return sorted.sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0));
}

function cycleTypeSort(mode: SortMode): SortMode {
  if (mode === 'alpha') return 'alpha-rev';
  if (mode === 'alpha-rev') return 'alpha';
  return 'alpha';
}

function cycleCountSort(mode: SortMode): SortMode {
  if (mode === 'count-desc') return 'count-asc';
  if (mode === 'count-asc') return 'count-desc';
  return 'count-desc';
}

function typeColumnArrow(mode: SortMode): string {
  if (mode === 'alpha') return '↑';
  if (mode === 'alpha-rev') return '↓';
  return '↕';
}

function countColumnArrow(mode: SortMode): string {
  if (mode === 'count-desc') return '↓';
  if (mode === 'count-asc') return '↑';
  return '↕';
}

export function OverviewPanel() {
  const { nodes, edges } = useGraphData();
  const { visibleNodeTypes, visibleEdgeTypes, toggleNodeType, toggleEdgeType,
          overviewListsCollapsed, highlightedNodeTypes, toggleHighlightedNodeType } = useViewSettings();

  const [nodeTypesOpen, setNodeTypesOpen] = useState(!overviewListsCollapsed);
  const [edgeTypesOpen, setEdgeTypesOpen] = useState(!overviewListsCollapsed);
  const [nodeSortMode, setNodeSortMode] = useState<SortMode>('alpha');
  const [edgeSortMode, setEdgeSortMode] = useState<SortMode>('alpha');

  const nodeTypeSet = useMemo(
    () => [...new Set(nodes.flatMap(n => n.types))],
    [nodes]
  );
  const edgeTypeSet = useMemo(
    () => [...new Set(edges.map(e => e.label))],
    [edges]
  );

  const nodeTypeCounts = useMemo(
    () => new Map(nodeTypeSet.map(t => [t, nodes.filter(n => n.types.includes(t)).length])),
    [nodeTypeSet, nodes]
  );
  const edgeTypeCounts = useMemo(
    () => new Map(edgeTypeSet.map(t => [t, edges.filter(e => e.label === t).length])),
    [edgeTypeSet, edges]
  );

  const allNodeTypes = useMemo(
    () => sortTypes(nodeTypeSet, nodeTypeCounts, nodeSortMode),
    [nodeTypeSet, nodeTypeCounts, nodeSortMode]
  );
  const allEdgeTypes = useMemo(
    () => sortTypes(edgeTypeSet, edgeTypeCounts, edgeSortMode),
    [edgeTypeSet, edgeTypeCounts, edgeSortMode]
  );

  const isNodeAllVisible = nodeTypeSet.length > 0 && nodeTypeSet.every(t => visibleNodeTypes.has(t));
  const isNodeMixed = !isNodeAllVisible && nodeTypeSet.some(t => visibleNodeTypes.has(t));

  const isEdgeAllVisible = edgeTypeSet.length > 0 && edgeTypeSet.every(t => visibleEdgeTypes.has(t));
  const isEdgeMixed = !isEdgeAllVisible && edgeTypeSet.some(t => visibleEdgeTypes.has(t));

  function handleNodeSelectAll() {
    if (isNodeAllVisible) {
      nodeTypeSet.forEach(t => { if (visibleNodeTypes.has(t)) toggleNodeType(t); });
    } else {
      nodeTypeSet.forEach(t => { if (!visibleNodeTypes.has(t)) toggleNodeType(t); });
    }
  }

  function handleEdgeSelectAll() {
    if (isEdgeAllVisible) {
      edgeTypeSet.forEach(t => { if (visibleEdgeTypes.has(t)) toggleEdgeType(t); });
    } else {
      edgeTypeSet.forEach(t => { if (!visibleEdgeTypes.has(t)) toggleEdgeType(t); });
    }
  }

  return (
    <div style={styles.panel}>
      <section style={styles.section}>
        <button style={styles.heading} onClick={() => setNodeTypesOpen(o => !o)}>
          <span style={styles.chevron}>{nodeTypesOpen ? '▾' : '▸'}</span>
          Node types
        </button>
        {nodeTypesOpen && (
          nodeTypeSet.length === 0
            ? <p style={styles.empty}>No types found</p>
            : <>
              <div style={styles.columnHeaderRow}>
                <input
                  type="checkbox"
                  ref={(el) => { if (el) el.indeterminate = isNodeMixed; }}
                  checked={isNodeAllVisible}
                  onChange={handleNodeSelectAll}
                  style={styles.checkbox}
                />
                <span
                  style={nodeSortMode === 'alpha' || nodeSortMode === 'alpha-rev'
                    ? styles.columnHeaderTypeCellActive
                    : styles.columnHeaderTypeCell}
                  onClick={() => setNodeSortMode(cycleTypeSort)}
                >
                  Type {typeColumnArrow(nodeSortMode)}
                </span>
                <span
                  style={nodeSortMode === 'count-desc' || nodeSortMode === 'count-asc'
                    ? styles.columnHeaderCountCellActive
                    : styles.columnHeaderCountCell}
                  onClick={() => setNodeSortMode(cycleCountSort)}
                >
                  Count {countColumnArrow(nodeSortMode)}
                </span>
              </div>
              {allNodeTypes.map(type => (
                <div key={type} style={styles.row}>
                  <input
                    type="checkbox"
                    checked={visibleNodeTypes.has(type)}
                    onChange={() => toggleNodeType(type)}
                    style={styles.checkbox}
                  />
                  <span
                    style={highlightedNodeTypes.has(type)
                      ? { ...styles.typeNameActive, color: nodeHighlightPalette[highlightedNodeTypes.get(type)! % nodeHighlightPalette.length].border }
                      : styles.typeName}
                    onClick={() => toggleHighlightedNodeType(type)}
                  >
                    {type}
                  </span>
                  <span style={styles.countBadge}>{nodeTypeCounts.get(type)}</span>
                </div>
              ))}
            </>
        )}
      </section>
      <section style={styles.section}>
        <button style={styles.heading} onClick={() => setEdgeTypesOpen(o => !o)}>
          <span style={styles.chevron}>{edgeTypesOpen ? '▾' : '▸'}</span>
          Relationship types
        </button>
        {edgeTypesOpen && (
          edgeTypeSet.length === 0
            ? <p style={styles.empty}>No relationships found</p>
            : <>
              <div style={styles.columnHeaderRow}>
                <input
                  type="checkbox"
                  ref={(el) => { if (el) el.indeterminate = isEdgeMixed; }}
                  checked={isEdgeAllVisible}
                  onChange={handleEdgeSelectAll}
                  style={styles.checkbox}
                />
                <span
                  style={edgeSortMode === 'alpha' || edgeSortMode === 'alpha-rev'
                    ? styles.columnHeaderTypeCellActive
                    : styles.columnHeaderTypeCell}
                  onClick={() => setEdgeSortMode(cycleTypeSort)}
                >
                  Type {typeColumnArrow(edgeSortMode)}
                </span>
                <span
                  style={edgeSortMode === 'count-desc' || edgeSortMode === 'count-asc'
                    ? styles.columnHeaderCountCellActive
                    : styles.columnHeaderCountCell}
                  onClick={() => setEdgeSortMode(cycleCountSort)}
                >
                  Count {countColumnArrow(edgeSortMode)}
                </span>
              </div>
              {allEdgeTypes.map(type => (
                <div key={type} style={styles.row}>
                  <input
                    type="checkbox"
                    checked={visibleEdgeTypes.has(type)}
                    onChange={() => toggleEdgeType(type)}
                    style={styles.checkbox}
                  />
                  <span style={styles.typeName}>{type}</span>
                  <span style={styles.countBadge}>{edgeTypeCounts.get(type)}</span>
                </div>
              ))}
            </>
        )}
      </section>
    </div>
  );
}
