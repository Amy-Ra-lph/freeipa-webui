import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useGetWorkloadFullDataQuery } from "src/services/rpcOAuth2";
// Data types
import { OAuth2Workload, Metadata } from "src/utils/datatypes/globalDataTypes";

type SettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalWorkload: Partial<OAuth2Workload>;
  workload: Partial<OAuth2Workload>;
  setWorkload: (workload: Partial<OAuth2Workload>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<OAuth2Workload>;
};

const useOAuth2WorkloadSettings = (workloadId: string): SettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Host Group
  const workloadFullDataQuery = useGetWorkloadFullDataQuery(workloadId);
  const workloadFullData = workloadFullDataQuery.data;
  const isFullDataLoading = workloadFullDataQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [workload, setWorkload] = useState<Partial<OAuth2Workload>>({});

  useEffect(() => {
    if (workloadFullData && !workloadFullDataQuery.isFetching) {
      setWorkload({ ...workloadFullData.workload });
    }
  }, [workloadFullData, workloadFullDataQuery.isFetching]);

  const settings = {
    isLoading: metadataLoading || isFullDataLoading,
    isFetching: workloadFullDataQuery.isFetching,
    modified,
    setModified,
    metadata,
    resetValues: () => {},
    originalWorkload: workload,
    workload,
    setWorkload,
    refetch: workloadFullDataQuery.refetch,
    modifiedValues: () => workload,
  } as SettingsData;

  if (workloadFullData) {
    settings.originalWorkload = workloadFullData.workload || {};
  } else {
    settings.originalWorkload = {};
  }

  const getModifiedValues = (): Partial<OAuth2Workload> => {
    if (!workloadFullData || !workloadFullData.workload) {
      return {};
    }

    const modifiedValues = {};
    for (const [key, value] of Object.entries(workload)) {
      if (Array.isArray(value)) {
        // Using 'JSON.stringify' when comparing arrays (to prevent data type false positives)
        if (JSON.stringify(workloadFullData.workload[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (workloadFullData.workload[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };
  settings.modifiedValues = getModifiedValues;

  // Detect any change in 'originalGroup' and 'group' objects
  useEffect(() => {
    if (!workloadFullData || !workloadFullData.workload) {
      return;
    }
    let modified = false;
    for (const [key, value] of Object.entries(workload)) {
      if (Array.isArray(value)) {
        // Using 'JSON.stringify' when comparing arrays (to prevent data type false positives)
        if (JSON.stringify(workloadFullData.workload[key]) !== JSON.stringify(value)) {
          modified = true;
          break;
        }
      } else {
        if (workloadFullData.workload[key] !== value) {
          modified = true;
          break;
        }
      }
    }
    setModified(modified);
  }, [workload, workloadFullData]);

  const onResetValues = () => {
    setModified(false);
  };
  settings.resetValues = onResetValues;

  return settings;
};

export { useOAuth2WorkloadSettings };
