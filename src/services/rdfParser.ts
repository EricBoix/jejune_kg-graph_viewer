import { Parser, Quad, Term } from 'n3';

const RDF_REIFIES = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies';

export interface RdfTriple {
  subject: string;
  predicate: string;
  object: string;
  objectType: 'uri' | 'literal' | 'blank';
  objectValue: string;
}

// An RDF 1.2 reifier: `reifier rdf:reifies <<( subject predicate object )>>`
export interface Reification {
  reifier: string;
  subject: string;
  predicate: string;
  object: string;
}

export interface ParsedRdf {
  triples: RdfTriple[];
  subjects: Set<string>;
  namespaces: Record<string, string>;
  reifications: Reification[];
  // Triples whose subject is a reifier (e.g. extractedFrom): kept apart so that
  // reifiers do not show up as graph nodes.
  annotations: RdfTriple[];
}

function getTermType(term: Term): 'uri' | 'literal' | 'blank' {
  if (term.termType === 'NamedNode') return 'uri';
  if (term.termType === 'BlankNode') return 'blank';
  return 'literal';
}

function isResource(term: Term): boolean {
  return term.termType === 'NamedNode' || term.termType === 'BlankNode';
}

// @types/n3 does not list 'Quad' among Term.termType although N3.js produces it for triple terms
function isTripleTerm(term: Term): boolean {
  return (term.termType as string) === 'Quad';
}

function toTriple(quad: Quad): RdfTriple {
  return {
    subject: quad.subject.value,
    predicate: quad.predicate.value,
    object: quad.object.value,
    objectType: getTermType(quad.object),
    objectValue: quad.object.value,
  };
}

function extractNamespaces(turtleContent: string): Record<string, string> {
  const namespaces: Record<string, string> = {};
  const re = /@prefix\s+([\w-]*):\s*<([^>]+)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(turtleContent)) !== null) {
    namespaces[m[1]] = m[2];
  }
  return namespaces;
}

export function parseRdfTurtle(turtleContent: string, baseUri: string = 'http://example.org/'): ParsedRdf {
  // N3.js (unlike rdflib.js) understands RDF 1.2 triple terms: <<( s p o )>>
  const quads = new Parser({ baseIRI: baseUri }).parse(turtleContent);

  const reifications: Reification[] = [];
  const reifierIds = new Set<string>();
  for (const quad of quads) {
    if (quad.predicate.value !== RDF_REIFIES || !isTripleTerm(quad.object)) continue;
    const reified = quad.object as unknown as Quad;
    // Only edges (resource to resource) can be drawn, literal-valued triples are ignored
    if (!isResource(reified.subject) || !isResource(reified.object)) continue;
    reifications.push({
      reifier: quad.subject.value,
      subject: reified.subject.value,
      predicate: reified.predicate.value,
      object: reified.object.value,
    });
    reifierIds.add(quad.subject.value);
  }

  const triples: RdfTriple[] = [];
  const annotations: RdfTriple[] = [];
  const subjects = new Set<string>();

  for (const quad of quads) {
    if (isTripleTerm(quad.subject) || isTripleTerm(quad.object)) continue;
    if (reifierIds.has(quad.subject.value)) {
      annotations.push(toTriple(quad));
      continue;
    }
    subjects.add(quad.subject.value);
    triples.push(toTriple(quad));
  }

  return {
    triples,
    subjects,
    namespaces: extractNamespaces(turtleContent),
    reifications,
    annotations,
  };
}

export function uriToPrefixedName(uri: string, namespaces: Record<string, string>): string {
  let bestPrefix = '';
  let bestNs = '';
  for (const [prefix, ns] of Object.entries(namespaces)) {
    if (uri.startsWith(ns) && ns.length > bestNs.length) {
      bestPrefix = prefix;
      bestNs = ns;
    }
  }
  return bestNs ? `${bestPrefix}:${uri.slice(bestNs.length)}` : getLocalName(uri);
}

export function getLocalName(uri: string): string {
  const hashIndex = uri.lastIndexOf('#');
  if (hashIndex !== -1) {
    return uri.substring(hashIndex + 1);
  }
  const slashIndex = uri.lastIndexOf('/');
  if (slashIndex !== -1) {
    return uri.substring(slashIndex + 1);
  }
  return uri;
}
