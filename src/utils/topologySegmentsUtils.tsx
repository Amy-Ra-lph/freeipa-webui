// Data types
import { TopologySegment } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";
import { createEmptyTopologySegment } from "./topologyUtils";
// Re-export
export { createEmptyTopologySegment } from "./topologyUtils";

export const asRecord = (
  element: Partial<TopologySegment>,
  onElementChange: (element: Partial<TopologySegment>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as TopologySegment);
  }

  return { ipaObject, recordOnChange };
};

const simpleValues = new Set([
  "cn",
  "iparepltoposegmentleftnode",
  "iparepltoposegmentrightnode",
  "iparepltoposegmentdirection",
  "nsds5replicastripattrs",
  "nsds5replicatedattributelist",
  "nsds5replicatedattributelisttotal",
  "nsds5replicatimeout",
  "nsds5replicaenabled",
  "suffixType",
  "pkeyOnly",
  "version",
]);
const dateValues = new Set([]);

export function apiToTopologySegment(
  apiRecord: Record<string, unknown>
): TopologySegment {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<TopologySegment>;
  return partialTopologySegmentToTopologySegment(converted);
}

export function partialTopologySegmentToTopologySegment(
  partialSegment: Partial<TopologySegment>
): TopologySegment {
  return {
    ...createEmptyTopologySegment(),
    ...partialSegment,
  };
}
