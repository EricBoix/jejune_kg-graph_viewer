const ALIGNMENT_GRAPH = 'urn:jejune:alignment';

const CONSTRUCT_ALL_QUERY = `
CONSTRUCT {
  ?s ?p ?o .
  ?nodeA <urn:jejune:similarTo> ?nodeB .
}
WHERE {
  { GRAPH ?g { ?s ?p ?o } FILTER(?g != <${ALIGNMENT_GRAPH}>) }
  UNION
  { GRAPH <${ALIGNMENT_GRAPH}> {
      ?nodeA <urn:jejune:inLabelCluster> ?cluster .
      ?nodeB <urn:jejune:inLabelCluster> ?cluster .
      FILTER(?nodeA != ?nodeB && STR(?nodeA) < STR(?nodeB))
    }
  }
}
`.trim();

export async function listGraphs(oxigraphUrl: string): Promise<string[]> {
  const base = oxigraphUrl.replace(/\/$/, '');
  const query = `SELECT DISTINCT ?g WHERE { GRAPH ?g {} FILTER(?g != <${ALIGNMENT_GRAPH}>) }`;
  const resp = await fetch(`${base}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      Accept: 'application/sparql-results+json',
    },
    body: query,
  });
  if (!resp.ok) throw new Error(`listGraphs: HTTP ${resp.status}`);
  const json = await resp.json();
  return (json.results?.bindings ?? []).map((b: Record<string, { value: string }>) => b.g.value);
}

export async function loadGraph(oxigraphUrl: string, graphUri: string): Promise<string> {
  const base = oxigraphUrl.replace(/\/$/, '');
  const url = `${base}/store?graph=${encodeURIComponent(graphUri)}`;
  const resp = await fetch(url, { headers: { Accept: 'text/turtle' } });
  if (!resp.ok) throw new Error(`loadGraph: HTTP ${resp.status}`);
  return resp.text();
}

export async function loadAllGraphs(oxigraphUrl: string): Promise<string> {
  const base = oxigraphUrl.replace(/\/$/, '');
  const resp = await fetch(`${base}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      Accept: 'text/turtle',
    },
    body: CONSTRUCT_ALL_QUERY,
  });
  if (!resp.ok) throw new Error(`loadAllGraphs: HTTP ${resp.status}`);
  return resp.text();
}
