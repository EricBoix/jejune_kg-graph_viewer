import { GraphNode, GraphEdge, GraphData } from '../types/graph.types';
import { ParsedRdf, getLocalName } from './rdfParser';

const RDFS_LABEL = 'http://www.w3.org/2000/01/rdf-schema#label';
const RDF_TYPE   = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';

export function convertRdfToGraph(parsedRdf: ParsedRdf): GraphData {
  const { triples, subjects } = parsedRdf;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const nodeMap = new Map<string, GraphNode>();
  const labels = new Map<string, string>();
  const types = new Map<string, string[]>();
  const metadata = new Map<string, Record<string, string[]>>();

  // First pass: collect labels and types
  for (const triple of triples) {
    if (triple.predicate === RDFS_LABEL && triple.objectType === 'literal') {
      labels.set(triple.subject, triple.objectValue);
    }
    if (triple.predicate === RDF_TYPE && triple.objectType === 'uri') {
      const list = types.get(triple.subject) ?? [];
      list.push(getLocalName(triple.objectValue));
      types.set(triple.subject, list);
    }
  }

  // Initialize nodes for all subjects
  for (const subjectUri of subjects) {
    const label = labels.get(subjectUri) || getLocalName(subjectUri);
    nodeMap.set(subjectUri, {
      id: subjectUri,
      label,
      uri: subjectUri,
      types: types.get(subjectUri) ?? [],
      metadata: {},
    });
    metadata.set(subjectUri, {});
  }

  // Second pass: process all triples
  for (const triple of triples) {
    const { subject, predicate, object, objectType, objectValue } = triple;
    const predicateLocal = getLocalName(predicate);

    if ((objectType === 'uri' || objectType === 'blank') && predicate !== RDF_TYPE) {
      // URI/blank node object -> create edge
      // Also ensure the object node exists
      if (!nodeMap.has(object)) {
        nodeMap.set(object, {
          id: object,
          label: labels.get(object) || getLocalName(object),
          uri: object,
          types: types.get(object) ?? [],
          metadata: {},
        });
        metadata.set(object, {});
      }

      const edgeId = `${subject}--${predicate}--${object}`;
      edges.push({
        id: edgeId,
        from: subject,
        to: object,
        label: predicateLocal,
        predicateUri: predicate,
      });
    } else {
      // Literal object -> add to node metadata (keyed by full predicate URI)
      const nodeMeta = metadata.get(subject);
      if (nodeMeta) {
        if (!nodeMeta[predicate]) {
          nodeMeta[predicate] = [];
        }
        nodeMeta[predicate].push(objectValue);
      }
    }
  }

  // Build final nodes with their collected metadata
  for (const [uri, node] of nodeMap) {
    nodes.push({ ...node, metadata: metadata.get(uri) ?? {} });
  }

  return { nodes, edges, namespaces: parsedRdf.namespaces, n3Store: null };
}
