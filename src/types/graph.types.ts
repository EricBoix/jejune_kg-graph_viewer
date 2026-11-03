export interface GraphNode {
  id: string;
  label: string;
  uri: string;
  types: string[];
  metadata: Record<string, string[]>;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  predicateUri: string;
  // Annotations of the edge triple (RDF 1.2 reifiers), keyed by full predicate URI
  properties?: Record<string, string[]>;
  // Ids of the chunk (DocumentChunk) nodes the edge was extracted from
  chunkIds?: string[];
}

import type { Store as N3Store } from 'n3';

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  namespaces: Record<string, string>;
  n3Store: N3Store | null;
}

export type SelectionType = 'node' | 'edge' | null;

export type NodeLabelMode = 'name' | 'neoId';

// Tri-state of a node type checkbox: all instances displayed, some, or none.
export type TypeCheckState = 'checked' | 'dash' | 'unchecked';

export interface Selection {
  type: SelectionType;
  id: string | null;
}
