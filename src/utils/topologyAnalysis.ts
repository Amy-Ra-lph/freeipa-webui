/**
 * Topology analysis engine — ported from ipatopo (Thomas Woerner).
 * Pure graph algorithms: health scoring, failure simulation, pattern
 * classification, articulation point / bridge detection.
 * No external graph libraries required.
 */

import {
  IpaServer,
  TopologySegment,
} from "src/utils/datatypes/globalDataTypes";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdjacencyMap = Map<string, string[]>;

export interface ScoreComponent {
  name: string;
  key: string;
  pts: number;
  max: number;
  detail: string;
  relevantNodes: string[];
}

export interface HealthScore {
  score: number;
  label: "Excellent" | "Good" | "Fair" | "Poor";
  breakdown: ScoreComponent[];
  serverCount: number;
  tier: string;
  tierLabel: string;
}

export interface FailureSimResult {
  name: string;
  staysConnected: boolean;
  newComponents: number;
  isolatedNodes: string[];
  newDiameter: number;
  diameterChange: number;
  lostRedundancy: string[];
  newArticulationPoints: number;
}

export interface FailureSimulation {
  baselineDiameter: number;
  serverCount: number;
  simulations: Map<string, FailureSimResult>;
  mostCritical: string[];
}

export interface TopologyPattern {
  pattern: string;
  patternLabel: string;
  description: string;
  hubs: string[];
  hubNames: string[];
  degreeDistribution: Map<string, number>;
  avgDegree: number;
  isConnected: boolean;
  componentCount: number;
}

export interface TopologyAnalysis {
  suffix: string;
  articulationPoints: Set<string>;
  bridges: Set<string>;
  overloadedNodes: Map<string, number>;
  unreachableNodes: Set<string>;
}

export interface AdjacencyResult {
  adj: AdjacencyMap;
  agrLookup: Map<string, string[]>;
  suffixCount: Map<string, number>;
  nonParticipating: Set<string>;
  participating: Set<string>;
}

// ---------------------------------------------------------------------------
// Graph primitives
// ---------------------------------------------------------------------------

export function bfsDistances(
  start: string,
  adj: AdjacencyMap
): Map<string, number> {
  const dist = new Map<string, number>([[start, 0]]);
  const queue: string[] = [start];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const curDist = dist.get(cur)!;
    for (const nb of adj.get(cur) || []) {
      if (!dist.has(nb)) {
        dist.set(nb, curDist + 1);
        queue.push(nb);
      }
    }
  }
  return dist;
}

export function isGraphConnected(
  nodeSet: Set<string>,
  adj: AdjacencyMap
): boolean {
  if (nodeSet.size === 0) return true;
  const start = nodeSet.values().next().value;
  if (start === undefined) return true;
  const visited = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const nb of adj.get(cur) || []) {
      if (nodeSet.has(nb) && !visited.has(nb)) {
        stack.push(nb);
      }
    }
  }
  return visited.size === nodeSet.size;
}

export function graphDiameter(adj: AdjacencyMap): number {
  let d = 0;
  for (const start of adj.keys()) {
    const dist = bfsDistances(start, adj);
    let farthest = 0;
    for (const v of dist.values()) {
      if (v > farthest) farthest = v;
    }
    if (farthest > d) d = farthest;
  }
  return d;
}

export function isConnectedWithoutEdge(
  adj: AdjacencyMap,
  skipSrc: string,
  skipTgt: string
): boolean {
  const tmp = new Map<string, string[]>();
  for (const [nid, neighbors] of adj) {
    tmp.set(
      nid,
      neighbors.filter(
        (nb) =>
          !(nid === skipSrc && nb === skipTgt) &&
          !(nid === skipTgt && nb === skipSrc)
      )
    );
  }
  const start = tmp.keys().next().value;
  if (start === undefined) return true;
  const visited = new Set<string>();
  const stack = [start];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const nb of tmp.get(cur) || []) {
      if (!visited.has(nb)) {
        stack.push(nb);
      }
    }
  }
  return visited.size === tmp.size;
}

// ---------------------------------------------------------------------------
// Adjacency construction from WebUI data types
// ---------------------------------------------------------------------------

export function buildSuffixAdjacency(
  servers: IpaServer[],
  segments: TopologySegment[],
  suffix: string
): AdjacencyResult {
  const adj: AdjacencyMap = new Map();
  const agrLookup = new Map<string, string[]>();
  const suffixCount = new Map<string, number>();

  const nodeMap = new Map<string, IpaServer>();
  for (const srv of servers) {
    nodeMap.set(srv.cn, srv);
  }

  for (const seg of segments) {
    if (seg.suffixType !== suffix) continue;
    const src = seg.iparepltoposegmentleftnode;
    const tgt = seg.iparepltoposegmentrightnode;

    suffixCount.set(src, (suffixCount.get(src) || 0) + 1);
    suffixCount.set(tgt, (suffixCount.get(tgt) || 0) + 1);

    if (!adj.has(src)) adj.set(src, []);
    if (!adj.has(tgt)) adj.set(tgt, []);
    adj.get(src)!.push(tgt);
    adj.get(tgt)!.push(src);

    const pairKey = [src, tgt].sort().join("|");
    if (!agrLookup.has(pairKey)) agrLookup.set(pairKey, []);
    agrLookup.get(pairKey)!.push(seg.cn);
  }

  const nonParticipating = new Set<string>();
  if (suffix !== "domain") {
    for (const srv of servers) {
      if (!adj.has(srv.cn)) {
        nonParticipating.add(srv.cn);
      }
    }
  }

  const participating = new Set<string>();
  for (const srv of servers) {
    if (!nonParticipating.has(srv.cn)) {
      participating.add(srv.cn);
    }
  }

  for (const nid of participating) {
    if (!adj.has(nid)) adj.set(nid, []);
  }

  for (const [nid, neighbors] of adj) {
    adj.set(
      nid,
      [...neighbors].sort((a, b) => a.localeCompare(b))
    );
  }

  return { adj, agrLookup, suffixCount, nonParticipating, participating };
}

// ---------------------------------------------------------------------------
// Tarjan's iterative algorithm — articulation points + bridges
// ---------------------------------------------------------------------------

interface TarjanStackFrame {
  u: string;
  parent: string | null;
  nbrIter: Iterator<string, undefined>;
  childCount: number;
}

export function findArticulationPointsAndBridges(
  participating: Set<string>,
  adj: AdjacencyMap,
  agrLookup: Map<string, string[]>
): { articulationPoints: Set<string>; bridges: Set<string> } {
  const disc = new Map<string, number>();
  const low = new Map<string, number>();
  let timer = 0;
  const articulationPoints = new Set<string>();
  const bridgeAgrIds = new Set<string>();

  for (const startNid of participating) {
    if (disc.has(startNid)) continue;
    disc.set(startNid, timer);
    low.set(startNid, timer);
    timer++;
    const neighbors = adj.get(startNid) || [];
    const itStack: TarjanStackFrame[] = [
      {
        u: startNid,
        parent: null,
        nbrIter: neighbors[Symbol.iterator](),
        childCount: 0,
      },
    ];

    while (itStack.length > 0) {
      const frame = itStack[itStack.length - 1];
      let advanced = false;

      let next = frame.nbrIter.next();
      while (!next.done) {
        const v = next.value;
        if (!disc.has(v)) {
          frame.childCount++;
          disc.set(v, timer);
          low.set(v, timer);
          timer++;
          const vNeighbors = adj.get(v) || [];
          itStack.push({
            u: v,
            parent: frame.u,
            nbrIter: vNeighbors[Symbol.iterator](),
            childCount: 0,
          });
          advanced = true;
          break;
        } else if (v !== frame.parent) {
          const discV = disc.get(v)!;
          if (discV < low.get(frame.u)!) {
            low.set(frame.u, discV);
          }
        }
        next = frame.nbrIter.next();
      }

      if (!advanced) {
        itStack.pop();
        if (itStack.length > 0) {
          const parentFrame = itStack[itStack.length - 1];
          const lowU = low.get(frame.u)!;
          if (lowU < low.get(parentFrame.u)!) {
            low.set(parentFrame.u, lowU);
          }
          if (
            parentFrame.parent === null &&
            parentFrame.childCount > 1
          ) {
            articulationPoints.add(parentFrame.u);
          }
          if (
            parentFrame.parent !== null &&
            low.get(frame.u)! >= disc.get(parentFrame.u)!
          ) {
            articulationPoints.add(parentFrame.u);
          }
          if (low.get(frame.u)! > disc.get(parentFrame.u)!) {
            const pairKey = [parentFrame.u, frame.u].sort().join("|");
            for (const aid of agrLookup.get(pairKey) || []) {
              bridgeAgrIds.add(aid);
            }
          }
        }
      }
    }
  }

  return { articulationPoints, bridges: bridgeAgrIds };
}

// ---------------------------------------------------------------------------
// Full topology analysis (articulation points, bridges, overloaded)
// ---------------------------------------------------------------------------

export function computeTopologyAnalysis(
  servers: IpaServer[],
  segments: TopologySegment[],
  suffix = "domain",
  maxAgreements = 4
): TopologyAnalysis {
  const { adj, agrLookup, suffixCount, nonParticipating, participating } =
    buildSuffixAdjacency(servers, segments, suffix);

  const { articulationPoints, bridges } = findArticulationPointsAndBridges(
    participating,
    adj,
    agrLookup
  );

  const overloadedNodes = new Map<string, number>();
  for (const nid of participating) {
    const count = suffixCount.get(nid) || 0;
    if (count > maxAgreements) {
      overloadedNodes.set(nid, count);
    }
  }

  const unreachableNodes = new Set(nonParticipating);

  return {
    suffix,
    articulationPoints,
    bridges,
    overloadedNodes,
    unreachableNodes,
  };
}

// ---------------------------------------------------------------------------
// Pattern classification
// ---------------------------------------------------------------------------

export function classifyTopologyPattern(
  servers: IpaServer[],
  segments: TopologySegment[],
  suffix = "domain"
): TopologyPattern {
  const { adj, participating } = buildSuffixAdjacency(
    servers,
    segments,
    suffix
  );

  const n = participating.size;
  if (n === 0) {
    return {
      pattern: "empty",
      patternLabel: "Empty",
      description: "No servers in topology.",
      hubs: [],
      hubNames: [],
      degreeDistribution: new Map(),
      avgDegree: 0,
      isConnected: true,
      componentCount: 0,
    };
  }

  const degrees = new Map<string, number>();
  let totalDegree = 0;
  for (const nid of participating) {
    const d = (adj.get(nid) || []).length;
    degrees.set(nid, d);
    totalDegree += d;
  }
  const avgDegree = totalDegree / n;

  const visited = new Set<string>();
  let components = 0;
  for (const start of participating) {
    if (visited.has(start)) continue;
    components++;
    const stack = [start];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const nb of adj.get(cur) || []) {
        if (!visited.has(nb)) stack.push(nb);
      }
    }
  }
  const isConnected = components === 1;

  const degValues = [...degrees.values()];
  const maxDeg = Math.max(...degValues);
  const minDeg = Math.min(...degValues);

  const hubThreshold = Math.max(3, n * 0.3);
  const hubs: string[] = [];
  for (const [nid, d] of degrees) {
    if (d >= hubThreshold) hubs.push(nid);
  }

  let pattern: string;
  let patternLabel: string;
  let description: string;

  if (n <= 1) {
    pattern = "single";
    patternLabel = "Single Server";
    description = "Single server, no replication.";
  } else if (n === 2) {
    pattern = "pair";
    patternLabel = "Server Pair";
    description = "Two servers with direct replication.";
  } else if (isConnected && maxDeg === n - 1 && minDeg === n - 1) {
    pattern = "complete";
    patternLabel = "Complete Mesh";
    description = `All ${n} servers directly connected (full mesh).`;
  } else if (isConnected && avgDegree >= (n - 1) * 0.8) {
    pattern = "near_complete";
    patternLabel = "Near-Complete Mesh";
    description = `Most servers directly connected (${avgDegree.toFixed(1)} avg agreements).`;
  } else if (isConnected && maxDeg === 2 && minDeg === 2) {
    pattern = "ring";
    patternLabel = "Ring";
    description = `All ${n} servers connected in a ring topology.`;
  } else if (isConnected && hubs.length === 1 && maxDeg >= n * 0.6) {
    pattern = "star";
    patternLabel = "Star";
    description = `Star topology centered on ${hubs[0]}.`;
  } else if (isConnected && hubs.length >= 2) {
    const nonHubDegs = [...degrees.entries()]
      .filter(([nid]) => !hubs.includes(nid))
      .map(([, d]) => d);
    const avgNonHub =
      nonHubDegs.length > 0
        ? nonHubDegs.reduce((a, b) => a + b, 0) / nonHubDegs.length
        : 0;
    if (avgNonHub <= 2.5) {
      pattern = "hub_and_spoke";
      patternLabel = "Hub-and-Spoke";
      description = `${hubs.length} hub servers with spoke servers (avg ${avgNonHub.toFixed(1)} agreements for spokes).`;
    } else {
      pattern = "mesh";
      patternLabel = "Mesh";
      description = `Mesh topology with ${hubs.length} well-connected hubs (${avgDegree.toFixed(1)} avg agreements).`;
    }
  } else if (isConnected && Math.floor(totalDegree / 2) === n - 1) {
    pattern = "tree";
    patternLabel = "Tree";
    description = `Tree topology with ${n} servers (no redundant paths).`;
  } else if (isConnected) {
    pattern = "mesh";
    patternLabel = "Mesh";
    description = `Mesh topology (${avgDegree.toFixed(1)} avg agreements per server).`;
  } else {
    pattern = "disconnected";
    patternLabel = "Disconnected";
    description = `${components} disconnected components.`;
  }

  return {
    pattern,
    patternLabel,
    description,
    hubs,
    hubNames: hubs,
    degreeDistribution: degrees,
    avgDegree,
    isConnected,
    componentCount: components,
  };
}

// ---------------------------------------------------------------------------
// Health scoring (5 components, 0-100)
// ---------------------------------------------------------------------------

export function goodDiameter(n: number): number | null {
  if (n <= 5) return null;
  if (n <= 15) return 2;
  if (n <= 41) return 3;
  if (n <= 98) return 4;
  if (n <= 364) return 5;
  if (n <= 740) return 6;
  return 7;
}

export function computeHealthScore(
  servers: IpaServer[],
  segments: TopologySegment[],
  suffix = "domain",
  maxAgreements = 4
): HealthScore {
  const { adj, suffixCount, participating } = buildSuffixAdjacency(
    servers,
    segments,
    suffix
  );

  const patternInfo = classifyTopologyPattern(servers, segments, suffix);
  const n = participating.size;
  const degrees = patternInfo.degreeDistribution;
  const isConnected = patternInfo.isConnected;
  const avgDegree = patternInfo.avgDegree;

  let tier: string;
  let tierLabel: string;
  if (n <= 5) {
    tier = "small";
    tierLabel = `Small (${n} servers)`;
  } else if (n <= 15) {
    tier = "medium";
    tierLabel = `Medium (${n} servers)`;
  } else if (n <= 64) {
    tier = "large";
    tierLabel = `Large (${n} servers)`;
  } else {
    tier = "enterprise";
    tierLabel = `Enterprise (${n} servers)`;
  }

  const degVals = [...degrees.values()];
  let score = 0;
  const breakdown: ScoreComponent[] = [];

  // --- Connectivity (25 points) ---
  let pts: number;
  let detail: string;
  let relNodes: string[] = [];

  if (n === 0) {
    pts = 0;
    detail = "No servers in topology.";
  } else if (isConnected) {
    pts = 25;
    detail = "All servers are reachable from any other server.";
  } else {
    pts = 0;
    detail = `Topology is split into ${patternInfo.componentCount} disconnected components.`;
  }
  score += pts;
  breakdown.push({
    name: "Connectivity",
    key: "connectivity",
    pts,
    max: 25,
    detail,
    relevantNodes: relNodes,
  });

  // --- Redundancy (35 points: 20 for min degree, 15 for coverage) ---
  const minDeg = degVals.length > 0 ? Math.min(...degVals) : 0;
  const fullyConnected = n > 1 && minDeg >= n - 1;

  let minPts: number;
  if (minDeg >= 3 || fullyConnected) {
    minPts = 20;
  } else if (minDeg >= 2) {
    minPts = 13;
  } else if (minDeg === 1) {
    minPts = 6;
  } else {
    minPts = 0;
  }

  let covPts: number;
  let wellConnected: number;
  if (n > 0) {
    if (fullyConnected) {
      wellConnected = n;
      covPts = 15;
    } else {
      wellConnected = degVals.filter((d) => d >= 3).length;
      covPts = Math.round((15 * wellConnected) / n);
    }
  } else {
    wellConnected = 0;
    covPts = 0;
  }
  pts = minPts + covPts;

  const underNodes: string[] = [];
  for (const [nid, d] of degrees) {
    if (d < 3 && d < n - 1) underNodes.push(nid);
  }

  if (fullyConnected) {
    detail = `Fully connected (${minDeg}/${n - 1} possible agreements per server). Maximum redundancy for ${n} servers.`;
  } else {
    const pct = n > 0 ? Math.round((100 * wellConnected) / n) : 0;
    detail = `Minimum degree: ${minDeg} (${minPts}/20). Coverage: ${wellConnected} of ${n} servers (${pct}%) have 3+ agreements (${covPts}/15).`;
  }
  score += pts;
  breakdown.push({
    name: "Redundancy",
    key: "redundancy",
    pts,
    max: 35,
    detail,
    relevantNodes: underNodes,
  });

  // --- Diameter (20 points) ---
  if (n === 0) {
    pts = 0;
    detail = "No servers in topology.";
  } else if (n <= 5) {
    pts = 20;
    detail = "Diameter not evaluated (too few servers).";
  } else {
    const diameter = graphDiameter(adj);
    const gd = goodDiameter(n);
    if (gd === null) {
      pts = 20;
      detail = "Diameter not evaluated.";
    } else if (diameter <= gd) {
      pts = 20;
      detail = `${diameter} hops is good for ${n} servers (good: ≤ ${gd}).`;
    } else if (diameter <= gd + 1) {
      pts = 13;
      detail = `${diameter} hops is acceptable for ${n} servers (good: ≤ ${gd}).`;
    } else if (diameter <= gd + 2) {
      pts = 10;
      detail = `${diameter} hops is slightly high for ${n} servers (good: ≤ ${gd}).`;
    } else {
      pts = 8;
      detail = `${diameter} hops is high for ${n} servers (good: ≤ ${gd}). Consider adding shortcuts.`;
    }
  }
  score += pts;
  breakdown.push({
    name: "Diameter",
    key: "diameter",
    pts,
    max: 20,
    detail,
    relevantNodes: [],
  });

  // --- No overloaded servers (10 points) ---
  const maxDeg = degVals.length > 0 ? Math.max(...degVals) : 0;
  const overloaded: string[] = [];
  for (const [nid, d] of degrees) {
    if (d > maxAgreements) overloaded.push(nid);
  }

  if (n === 0) {
    pts = 0;
    detail = "No servers in topology.";
  } else if (maxDeg <= maxAgreements) {
    pts = 10;
    detail = `No server exceeds the ${maxAgreements}-agreement limit.`;
  } else {
    pts = 0;
    detail = `${overloaded.length} server(s) exceed the ${maxAgreements}-agreement limit (max degree: ${maxDeg}).`;
  }
  score += pts;
  breakdown.push({
    name: "No overloaded servers",
    key: "no_overloaded",
    pts,
    max: 10,
    detail,
    relevantNodes: overloaded,
  });

  // --- Balance (10 points) ---
  if (degVals.length > 0) {
    const variance =
      degVals.reduce((sum, d) => sum + (d - avgDegree) ** 2, 0) /
      degVals.length;
    if (variance < 1.0) {
      pts = 10;
      detail = `Degree variance is ${variance.toFixed(2)}. Well balanced.`;
    } else if (variance < 2.0) {
      pts = 6;
      detail = `Degree variance is ${variance.toFixed(2)}. Moderate variance.`;
    } else {
      pts = 0;
      detail = `Degree variance is ${variance.toFixed(2)}. High variance — some servers have many more agreements than others.`;
    }
  } else {
    pts = 0;
    detail = "No servers to evaluate.";
  }
  score += pts;
  breakdown.push({
    name: "Balance",
    key: "balance",
    pts,
    max: 10,
    detail,
    relevantNodes: [],
  });

  score = Math.min(score, 100);

  let healthLabel: "Excellent" | "Good" | "Fair" | "Poor";
  if (score >= 95) healthLabel = "Excellent";
  else if (score >= 80) healthLabel = "Good";
  else if (score >= 60) healthLabel = "Fair";
  else healthLabel = "Poor";

  return {
    score,
    label: healthLabel,
    breakdown,
    serverCount: n,
    tier,
    tierLabel,
  };
}

// ---------------------------------------------------------------------------
// Failure simulation — "what if server X is removed?"
// ---------------------------------------------------------------------------

export function computeFailureSimulation(
  servers: IpaServer[],
  segments: TopologySegment[],
  suffix = "domain"
): FailureSimulation {
  const { adj, participating } = buildSuffixAdjacency(
    servers,
    segments,
    suffix
  );
  const n = participating.size;

  if (n <= 1) {
    return {
      baselineDiameter: 0,
      serverCount: n,
      simulations: new Map(),
      mostCritical: [],
    };
  }

  const partList = [...participating];

  // Baseline diameter
  let baselineDiameter = 0;
  for (const start of partList) {
    const dist = bfsDistances(start, adj);
    let farthest = 0;
    for (const v of dist.values()) {
      if (v > farthest) farthest = v;
    }
    if (farthest > baselineDiameter) baselineDiameter = farthest;
  }

  const simulations = new Map<string, FailureSimResult>();

  for (const removed of partList) {
    const remaining = partList.filter((nid) => nid !== removed);
    if (remaining.length === 0) continue;

    // Build adjacency without removed node
    const remAdj = new Map<string, string[]>();
    const remDeg = new Map<string, number>();
    for (const nid of remaining) {
      const neighbors = (adj.get(nid) || []).filter((nb) => nb !== removed);
      remAdj.set(nid, neighbors);
      remDeg.set(nid, neighbors.length);
    }

    // Find connected components
    const components: string[][] = [];
    const visited = new Set<string>();
    for (const nid of remaining) {
      if (visited.has(nid)) continue;
      const comp: string[] = [];
      const stack = [nid];
      while (stack.length > 0) {
        const cur = stack.pop()!;
        if (visited.has(cur)) continue;
        visited.add(cur);
        comp.push(cur);
        for (const nb of remAdj.get(cur) || []) {
          if (!visited.has(nb)) stack.push(nb);
        }
      }
      components.push(comp);
    }

    const staysConnected = components.length === 1;
    const largestComp = components.reduce((a, b) =>
      a.length >= b.length ? a : b
    );
    const largestSet = new Set(largestComp);

    const isolated: string[] = [];
    for (const comp of components) {
      if (comp !== largestComp) {
        for (const nid of comp.sort()) {
          isolated.push(nid);
        }
      }
    }

    // 4-pass BFS diameter approximation on largest component
    let newDiameter = 0;
    if (largestComp.length > 0) {
      let node = largestComp[0];
      for (let pass = 0; pass < 4; pass++) {
        const dist = new Map<string, number>([[node, 0]]);
        const queue = [node];
        let head = 0;
        let farNode = node;
        let farDist = 0;
        while (head < queue.length) {
          const cur = queue[head++];
          const curDist = dist.get(cur)!;
          for (const nb of remAdj.get(cur) || []) {
            if (!dist.has(nb) && largestSet.has(nb)) {
              const d = curDist + 1;
              dist.set(nb, d);
              queue.push(nb);
              if (d > farDist) {
                farDist = d;
                farNode = nb;
              }
            }
          }
        }
        if (farDist > newDiameter) newDiameter = farDist;
        node = farNode;
      }
    }

    // Nodes that lost redundancy (dropped to degree 1)
    const lostRedundancy: string[] = [];
    for (const nb of adj.get(removed) || []) {
      if ((remDeg.get(nb) || 0) === 1) {
        lostRedundancy.push(nb);
      }
    }
    lostRedundancy.sort();

    // Articulation points after removal
    const remParticipating = new Set(remaining);
    const remAgrLookup = new Map<string, string[]>();
    const { articulationPoints: rArt } = findArticulationPointsAndBridges(
      remParticipating,
      remAdj,
      remAgrLookup
    );

    simulations.set(removed, {
      name: removed,
      staysConnected,
      newComponents: components.length,
      isolatedNodes: isolated,
      newDiameter,
      diameterChange: newDiameter - baselineDiameter,
      lostRedundancy,
      newArticulationPoints: rArt.size,
    });
  }

  // Rank by impact
  const mostCritical = [...simulations.keys()].sort((a, b) => {
    const sa = simulations.get(a)!;
    const sb = simulations.get(b)!;

    const connA = sa.staysConnected ? 1 : 0;
    const connB = sb.staysConnected ? 1 : 0;
    if (connA !== connB) return connA - connB;

    const isoA = sa.isolatedNodes.length;
    const isoB = sb.isolatedNodes.length;
    if (isoA !== isoB) return isoB - isoA;

    if (sa.diameterChange !== sb.diameterChange)
      return sb.diameterChange - sa.diameterChange;

    if (sa.lostRedundancy.length !== sb.lostRedundancy.length)
      return sb.lostRedundancy.length - sa.lostRedundancy.length;

    return sa.name.localeCompare(sb.name);
  });

  return {
    baselineDiameter,
    serverCount: n,
    simulations,
    mostCritical,
  };
}

// ---------------------------------------------------------------------------
// Simulate a single server failure (for interactive use)
// ---------------------------------------------------------------------------

export function simulateSingleFailure(
  servers: IpaServer[],
  segments: TopologySegment[],
  removedServer: string,
  suffix = "domain"
): FailureSimResult | null {
  const { adj, participating } = buildSuffixAdjacency(
    servers,
    segments,
    suffix
  );
  if (!participating.has(removedServer)) return null;

  const partList = [...participating];
  const remaining = partList.filter((nid) => nid !== removedServer);
  if (remaining.length === 0) return null;

  // Baseline diameter
  let baselineDiameter = 0;
  for (const start of partList) {
    const dist = bfsDistances(start, adj);
    let farthest = 0;
    for (const v of dist.values()) {
      if (v > farthest) farthest = v;
    }
    if (farthest > baselineDiameter) baselineDiameter = farthest;
  }

  const remAdj = new Map<string, string[]>();
  const remDeg = new Map<string, number>();
  for (const nid of remaining) {
    const neighbors = (adj.get(nid) || []).filter((nb) => nb !== removedServer);
    remAdj.set(nid, neighbors);
    remDeg.set(nid, neighbors.length);
  }

  const components: string[][] = [];
  const visited = new Set<string>();
  for (const nid of remaining) {
    if (visited.has(nid)) continue;
    const comp: string[] = [];
    const stack = [nid];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      comp.push(cur);
      for (const nb of remAdj.get(cur) || []) {
        if (!visited.has(nb)) stack.push(nb);
      }
    }
    components.push(comp);
  }

  const staysConnected = components.length === 1;
  const largestComp = components.reduce((a, b) =>
    a.length >= b.length ? a : b
  );
  const largestSet = new Set(largestComp);

  const isolated: string[] = [];
  for (const comp of components) {
    if (comp !== largestComp) {
      for (const nid of comp.sort()) isolated.push(nid);
    }
  }

  let newDiameter = 0;
  if (largestComp.length > 0) {
    let node = largestComp[0];
    for (let pass = 0; pass < 4; pass++) {
      const dist = new Map<string, number>([[node, 0]]);
      const queue = [node];
      let head = 0;
      let farNode = node;
      let farDist = 0;
      while (head < queue.length) {
        const cur = queue[head++];
        const curDist = dist.get(cur)!;
        for (const nb of remAdj.get(cur) || []) {
          if (!dist.has(nb) && largestSet.has(nb)) {
            const d = curDist + 1;
            dist.set(nb, d);
            queue.push(nb);
            if (d > farDist) {
              farDist = d;
              farNode = nb;
            }
          }
        }
      }
      if (farDist > newDiameter) newDiameter = farDist;
      node = farNode;
    }
  }

  const lostRedundancy: string[] = [];
  for (const nb of adj.get(removedServer) || []) {
    if ((remDeg.get(nb) || 0) === 1) lostRedundancy.push(nb);
  }
  lostRedundancy.sort();

  const remParticipating = new Set(remaining);
  const { articulationPoints: rArt } = findArticulationPointsAndBridges(
    remParticipating,
    remAdj,
    new Map()
  );

  return {
    name: removedServer,
    staysConnected,
    newComponents: components.length,
    isolatedNodes: isolated,
    newDiameter,
    diameterChange: newDiameter - baselineDiameter,
    lostRedundancy,
    newArticulationPoints: rArt.size,
  };
}

// ---------------------------------------------------------------------------
// Health color helper
// ---------------------------------------------------------------------------

export function healthScoreColor(score: number): string {
  if (score >= 80) return "green";
  if (score >= 60) return "orange";
  return "red";
}

export function healthScoreVariant(
  score: number
): "success" | "warning" | "danger" {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}
