import { useState, useCallback, useMemo } from "react";
import { TopologySegment } from "src/utils/datatypes/globalDataTypes";

export interface ProposedSegment {
  leftNode: string;
  rightNode: string;
  direction: "both" | "left-right" | "right-left";
}

export interface UseTopologyComparisonReturn {
  additions: ProposedSegment[];
  removals: string[];
  addSegment: (segment: ProposedSegment) => void;
  removeSegment: (cn: string) => void;
  undoAdd: (index: number) => void;
  undoRemoval: (cn: string) => void;
  reset: () => void;
  hasChanges: boolean;
  getProposedSegments: (current: TopologySegment[]) => TopologySegment[];
}

const useTopologyComparison = (): UseTopologyComparisonReturn => {
  const [additions, setAdditions] = useState<ProposedSegment[]>([]);
  const [removals, setRemovals] = useState<string[]>([]);

  const addSegment = useCallback((segment: ProposedSegment) => {
    setAdditions((prev) => [...prev, segment]);
  }, []);

  const removeSegment = useCallback((cn: string) => {
    setRemovals((prev) => [...prev, cn]);
  }, []);

  const undoAdd = useCallback((index: number) => {
    setAdditions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const undoRemoval = useCallback((cn: string) => {
    setRemovals((prev) => prev.filter((r) => r !== cn));
  }, []);

  const reset = useCallback(() => {
    setAdditions([]);
    setRemovals([]);
  }, []);

  const hasChanges = useMemo(
    () => additions.length > 0 || removals.length > 0,
    [additions, removals]
  );

  const getProposedSegments = useCallback(
    (current: TopologySegment[]): TopologySegment[] => {
      const filtered = current.filter((seg) => !removals.includes(seg.cn));

      const added: TopologySegment[] = additions.map((a, i) => ({
        cn: `proposed-${i}-${a.leftNode}-${a.rightNode}`,
        iparepltoposegmentleftnode: a.leftNode,
        iparepltoposegmentrightnode: a.rightNode,
        iparepltoposegmentdirection: a.direction,
        nsds5replicastripattrs: "",
        nsds5replicatedattributelist: "",
        nsds5replicatedattributelisttotal: "",
        nsds5replicatimeout: 0,
        nsds5replicaenabled: "on" as const,
        suffixType: "",
      }));

      return [...filtered, ...added];
    },
    [additions, removals]
  );

  return {
    additions,
    removals,
    addSegment,
    removeSegment,
    undoAdd,
    undoRemoval,
    reset,
    hasChanges,
    getProposedSegments,
  };
};

export default useTopologyComparison;
