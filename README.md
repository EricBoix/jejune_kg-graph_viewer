# Knowledge Graph Visualization<!-- omit from toc -->

Interactive web application for visualizing RDF knowledge graphs using vis-network.

## Table of contents<!-- omit from toc -->

- [Features](#features)
- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Visualizing the sample graph](#visualizing-the-sample-graph)

## Features

- Load and parse RDF files (Turtle format)
- Interactive graph visualization with node/edge selection
- View node metadata and edge properties
- Edit node and edge labels in-memory
- File upload for custom RDF data

## Installation

## Prerequisites

- Node.js (v18+)
- npm

### Edit the configuration (optional)

`src/config.ts` centralises all tuneable constants. Edit it before building to adjust e.g.

- graph rendering parameters,
- default view settings,
- sidebar dimensions,
- RDF predicate URIs.

### Commands

- `npm install`: install package dependencies
- `npm run build`: compiles TypeScript and builds the production bundle to `dist/`
- `npm run preview`: serves the production build locally for testing
- `npm run dev`: starts a development server at `http://localhost:5173`
- `npm run lint`: runs ESLint on the codebase.

## Running things with Docker

Build the image from the `DockerContext/` directory, which holds the `Dockerfile`:

```bash
docker build -t jejuneness:kg_graph_viewer DockerContext/
```

Or build directly from GitHub without cloning (requires a public repository):

```bash
docker build -t jejuneness:kg_graph_viewer \
  "https://github.com/EricBoix/jejune_kg-graph_viewer.git#main:DockerContext"
```

Run the container, mapping nginx port 80 to localhost:8080:

```bash
docker run --rm -p 8080:80 jejuneness:kg_graph_viewer
open http://localhost:8080
```

## Health check

Install the check package once (requires `jejune_cli` to be installed):

```sh
pip install -e check/
```

Then probe a running container:

```sh
python -m jejune_kg_viewer_check status
```

The default port is `8080`. Override with `KG_PORT`:

```sh
KG_PORT=9090 python -m jejune_kg_viewer_check status
```

## Visualizing the sample graph

### Visualizing the default sample graph

The default graph is the file [`src/data/sample.ttl`](./src/data/sample.ttl)

```bash
npm run dev
open http://localhost:5173
```

### Visualizing an output of [Neo4jToRDF converter](../Neo4jToRDF/README.md)

Either use the "Load RDF File" button or

```bash
mv src/data/sample.ttl src/data/sample.ttl.orig
ln -s ../Neo4jToRDF/output.ttl src/data/sample.ttl
npm run dev
open http://localhost:5173
```
