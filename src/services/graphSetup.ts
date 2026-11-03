import { Document, parse, stringify } from 'yaml';
import { NodeLabelMode } from '../types/graph.types';

export const GRAPH_SETUP_VERSION = 1;

export type GraphSetupSource =
  | { kind: 'file'; turtle_file: string | null }
  | { kind: 'triplestore' };

export interface GraphSetupNode {
  id: string;
  pinned: boolean;
  // Coordinates are stored for pinned nodes only.
  x?: number;
  y?: number;
}

// Scene description with full URIs; prefixed names exist only in the file.
export interface GraphSetup {
  source: GraphSetupSource;
  nodeLabelMode: NodeLabelMode;
  hideIsolatedNodes: boolean;
  highlightedNodeTypes: Record<string, number>;
  hiddenEdgeTypes: string[];
  nodes: GraphSetupNode[];
}

const FILE_HEADER = `Graph setup written by kg_graph_viewer.
Node ids are prefixed names (see prefixes) or <full URIs>.
Only pinned nodes carry x, y coordinates.`;

export class GraphSetupSerializer {
  constructor(private readonly namespaces: Record<string, string>) {}

  serialize(setup: GraphSetup): string {
    const usedPrefixes: Record<string, string> = {};
    const nodes = setup.nodes.map(node => {
      const entry: Record<string, unknown> = { id: this.compact(node.id, usedPrefixes) };
      if (node.pinned) {
        entry.pinned = true;
        entry.x = node.x;
        entry.y = node.y;
      }
      return entry;
    });

    const document = new Document({
      version: GRAPH_SETUP_VERSION,
      source: setup.source,
      prefixes: usedPrefixes,
      nodeLabelMode: setup.nodeLabelMode,
      hideIsolatedNodes: setup.hideIsolatedNodes,
      highlightedNodeTypes: setup.highlightedNodeTypes,
      hiddenEdgeTypes: setup.hiddenEdgeTypes,
      nodes,
    });
    document.commentBefore = FILE_HEADER;
    return stringify(document);
  }

  parse(text: string): GraphSetup {
    const raw = parse(text);
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Graph setup: top level must be a mapping');
    }
    if (raw.version !== GRAPH_SETUP_VERSION) {
      throw new Error(`Graph setup: unsupported version ${String(raw.version)} (expected ${GRAPH_SETUP_VERSION})`);
    }
    const prefixes: Record<string, string> = { ...this.namespaces, ...(raw.prefixes ?? {}) };
    const rawNodes: unknown[] = Array.isArray(raw.nodes) ? raw.nodes : [];

    const nodes = rawNodes.map((rawNode): GraphSetupNode => {
      const entry = typeof rawNode === 'string' ? { id: rawNode } : (rawNode as Record<string, unknown>);
      if (typeof entry?.id !== 'string') {
        throw new Error('Graph setup: every node needs an id');
      }
      const pinned = entry.pinned === true;
      const hasCoordinates = typeof entry.x === 'number' && typeof entry.y === 'number';
      return {
        id: this.expand(entry.id, prefixes),
        pinned,
        ...(hasCoordinates ? { x: entry.x as number, y: entry.y as number } : {}),
      };
    });

    return {
      source: raw.source ?? { kind: 'file', turtle_file: null },
      nodeLabelMode: raw.nodeLabelMode === 'name' ? 'name' : 'neoId',
      hideIsolatedNodes: raw.hideIsolatedNodes !== false,
      highlightedNodeTypes: raw.highlightedNodeTypes ?? {},
      hiddenEdgeTypes: Array.isArray(raw.hiddenEdgeTypes) ? raw.hiddenEdgeTypes : [],
      nodes,
    };
  }

  // Longest matching namespace wins; falls back to <full URI> when the local part is not name-safe.
  private compact(uri: string, usedPrefixes: Record<string, string>): string {
    let bestPrefix = '';
    let bestNamespace = '';
    for (const [prefix, namespace] of Object.entries(this.namespaces)) {
      if (uri.startsWith(namespace) && namespace.length > bestNamespace.length) {
        bestPrefix = prefix;
        bestNamespace = namespace;
      }
    }
    const localPart = uri.slice(bestNamespace.length);
    if (!bestNamespace || localPart === '' || /[/#\s<>]/.test(localPart)) {
      return `<${uri}>`;
    }
    usedPrefixes[bestPrefix] = bestNamespace;
    return `${bestPrefix}:${localPart}`;
  }

  private expand(name: string, prefixes: Record<string, string>): string {
    if (name.startsWith('<') && name.endsWith('>')) return name.slice(1, -1);
    const colonIndex = name.indexOf(':');
    if (colonIndex > 0) {
      const namespace = prefixes[name.slice(0, colonIndex)];
      if (namespace !== undefined) return namespace + name.slice(colonIndex + 1);
    }
    return name;
  }
}
