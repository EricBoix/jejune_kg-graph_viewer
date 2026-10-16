import pkg from '../package.json';

export const config = {

  project: {
    // Repo URL derived from the single ecosystem-repo-base defined in package.json,
    // mirroring the [tool.jejune] ecosystem-repo-base pattern used in pyproject.toml.
    repoUrl: `${pkg.jejune['ecosystem-repo-base']}/${pkg.name}`,
  },

  sidebar: {
    defaultWidth: 300,
    minWidth:     150,
    maxWidth:     700,
  },

  rdf: {
    // Predicate URI used by Neo4j RDF exports for the internal node identifier.
    neo4jIdPredicateUri: 'http://example.org/neo4j/id',
  },

  // Initial values for settings that the user can change at runtime via the UI.
  viewSettings: {
    // Text shown (node labels) on each graph node. Possible choices are: 
    //   - 'name' for rdfs:label
    //   -'neoId' for Neo4j internal id
    nodeLabelMode:        'neoId'     as const,
    physicsEnabled:       true,
    hideIsolatedNodes:    true,
    // Node types whose Overview checkbox is unchecked when a graph is first loaded.
    hiddenByDefaultTypes: ['Document'],
    // Whether the Node types / Relationship types lists in the Overview tab
    // start collapsed or expanded.
    overviewListsCollapsed: true,
  },

  // vis-network rendering parameters.
  graph: {
    nodeSizePx:        20,
    nodeFontSizePx:    14,
    nodeBorderWidthPx: 2,
    edgeWidthPx:       2,
    edgeFontSizePx:    12,
    physics: {
      gravitationalConstant: -50,
      centralGravity:        0.01,
      springLength:          100,
      springConstant:        0.08,
      stabilizationIter:     100,
    },
  },

} as const;
