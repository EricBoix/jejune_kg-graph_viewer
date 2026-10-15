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

export interface Selection {
  type: SelectionType;
  id: string | null;
}
