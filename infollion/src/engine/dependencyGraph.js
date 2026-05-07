// Dependency graph tracks which cells depend on which

export const createDependencyGraph = () => {
  return {
    dependencies: {},    // cell -> [cells it depends on]
    dependents: {}       // cell -> [cells that depend on it]
  };
};

export const updateDependencies = (graph, cellRef, newDeps) => {
  const oldDeps = graph.dependencies[cellRef] || [];
  
  // Remove old dependency links
  for (const dep of oldDeps) {
    if (dep !== cellRef) { // Avoid self-reference issues
      const dependents = graph.dependents[dep] || [];
      graph.dependents[dep] = dependents.filter(d => d !== cellRef);
    }
  }
  
  // Add new dependency links
  graph.dependencies[cellRef] = newDeps;
  
  for (const dep of newDeps) {
    if (dep !== cellRef) {
      if (!graph.dependents[dep]) {
        graph.dependents[dep] = [];
      }
      if (!graph.dependents[dep].includes(cellRef)) {
        graph.dependents[dep].push(cellRef);
      }
    }
  }
};

export const getDependents = (graph, cellRef) => {
  return graph.dependents[cellRef] || [];
};

export const getDependencies = (graph, cellRef) => {
  return graph.dependencies[cellRef] || [];
};

export const getAllDownstreamDependents = (graph, cellRef, visited = new Set()) => {
  const direct = getDependents(graph, cellRef);
  
  for (const dependent of direct) {
    if (!visited.has(dependent)) {
      visited.add(dependent);
      getAllDownstreamDependents(graph, dependent, visited);
    }
  }
  
  return visited;
};

export const getAllUpstreamDependencies = (graph, cellRef, visited = new Set()) => {
  const direct = getDependencies(graph, cellRef);
  
  for (const dependency of direct) {
    if (!visited.has(dependency)) {
      visited.add(dependency);
      getAllUpstreamDependencies(graph, dependency, visited);
    }
  }
  
  return visited;
};

export const clearCellDependencies = (graph, cellRef) => {
  // Remove from dependency references
  const deps = graph.dependencies[cellRef] || [];
  for (const dep of deps) {
    if (graph.dependents[dep]) {
      graph.dependents[dep] = graph.dependents[dep].filter(d => d !== cellRef);
    }
  }
  
  // Clear this cell's dependencies (what it depends on)
  // But preserve its dependents list (what depends on it)
  delete graph.dependencies[cellRef];
};
