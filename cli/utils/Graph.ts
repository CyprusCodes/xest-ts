// Ziyovuddin Shamsiddini's Directed Graph Implementation
// taken from https://medium.com/@ziyoshams/graphs-in-javascript-cc0ed170b156
/* eslint-disable no-restricted-syntax */

interface SerializedGraph {
  nodes: string[];
  links: Array<{ source: string; target: string }>;
}

class Graph {
  AdjList: Map<string, string[]>;

  constructor() {
    this.AdjList = new Map();
  }

  addVertex(vertex: string): void {
    if (!this.AdjList.has(vertex)) {
      this.AdjList.set(vertex, []);
    }
  }

  addEdge(vertex: string, node: string): void {
    if (this.AdjList.has(vertex)) {
      if (this.AdjList.has(node)) {
        const arr = this.AdjList.get(vertex) as string[];
        if (!arr.includes(node)) {
          arr.push(node);
        }
      } else {
        throw new Error(`Can't add non-existing vertex ->'${node}'`);
      }
    } else {
      throw new Error(`You should add '${vertex}' first`);
    }
  }

  nodes(): string[] {
    const nodes: string[] = [];
    for (const [key] of this.AdjList) {
      nodes.push(key);
    }
    return nodes;
  }

  serialize(): SerializedGraph {
    const result: SerializedGraph = {
      nodes: [],
      links: [],
    };
    for (const [key, value] of this.AdjList) {
      result.nodes.push(key);
      value.forEach((edge: string) => {
        result.links.push({ source: key, target: edge });
      });
    }
    return result;
  }

  deserialize(serializedGraph: SerializedGraph): void {
    serializedGraph.nodes.forEach((n: string) => {
      this.addVertex(n);
    });

    serializedGraph.links.forEach((e: { source: string; target: string }) => {
      this.addEdge(e.source, e.target);
    });
  }

  createVisitedObject(): Record<string, boolean> {
    const arr: Record<string, boolean> = {};
    for (const key of this.AdjList.keys()) {
      arr[key] = false;
    }

    return arr;
  }

  doesPathExist(
    firstNode: string,
    secondNode: string
  ): { path: string[]; pathExists: boolean } {
    // https://stackoverflow.com/a/50575971
    const pathQueue: string[][] = [];
    const visited = this.createVisitedObject();
    const q: string[] = [];
    visited[firstNode] = true;
    q.push(firstNode);
    pathQueue.push([firstNode]);
    while (q.length) {
      const node = q.shift() as string;
      const path = pathQueue.shift() as string[];
      visited[node] = true;

      const elements = this.AdjList.get(node) as string[];
      if (elements.includes(secondNode)) {
        return { path: [...path, secondNode], pathExists: true };
      }
      for (const elem of elements) {
        if (!visited[elem]) {
          pathQueue.push([...path, elem]);
          q.push(elem);
          visited[elem] = true;
        }
      }
    }
    return { path: [], pathExists: false };
  }

  getIndegree(node: string): number {
    const indegrees: Record<string, number> = Array.from(
      this.AdjList.entries()
    ).reduce((acc: Record<string, number>, curr: [string, string[]]) => {
      curr[1].forEach((table: string) => {
        if (acc[table]) {
          acc[table] = acc[table] + 1;
        } else {
          acc[table] = 1;
        }
      });

      return acc;
    }, {});

    return indegrees[node] || 0;
  }
}

export default Graph;
