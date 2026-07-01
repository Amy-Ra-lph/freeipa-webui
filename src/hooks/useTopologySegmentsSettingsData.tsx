import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useTopologySegmentShowQuery } from "src/services/rpcTopologySegments";
// Data types
import {
  TopologySegment,
  Metadata,
} from "src/utils/datatypes/globalDataTypes";

type TopologySegmentSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalSegment: Partial<TopologySegment>;
  segment: Partial<TopologySegment>;
  setSegment: (segment: Partial<TopologySegment>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<TopologySegment>;
};

const useTopologySegmentSettings = (
  suffixCn: string,
  segmentId: string
): TopologySegmentSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Segment (needs both suffixCn and segmentId)
  const segmentQuery = useTopologySegmentShowQuery(suffixCn, segmentId);
  const segmentData = segmentQuery.data;
  const isSegmentLoading = segmentQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [segment, setSegment] = useState<Partial<TopologySegment>>({});
  const [originalSegment, setOriginalSegment] = useState<
    Partial<TopologySegment>
  >({});

  useEffect(() => {
    if (segmentData && segmentData.length > 0 && !segmentQuery.isFetching) {
      setSegment({ ...segmentData[0] });
      setOriginalSegment({ ...segmentData[0] });
    }
  }, [segmentData, segmentQuery.isFetching]);

  const getModifiedValues = (): Partial<TopologySegment> => {
    if (!originalSegment) {
      return {};
    }

    const modifiedValues: Partial<TopologySegment> = {};
    for (const [key, value] of Object.entries(segment)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalSegment[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (originalSegment[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalSegment) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(segment)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalSegment[key]) !== JSON.stringify(value)) {
          isModified = true;
          break;
        }
      } else {
        if (originalSegment[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [segment, originalSegment]);

  const onResetValues = () => {
    setOriginalSegment({ ...segment });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isSegmentLoading,
    isFetching: segmentQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalSegment,
    segment,
    setSegment,
    refetch: segmentQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { useTopologySegmentSettings };
