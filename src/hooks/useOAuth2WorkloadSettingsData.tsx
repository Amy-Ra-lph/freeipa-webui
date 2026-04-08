import React from "react";
// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useOauth2WorkloadShowQuery } from "src/services/rpcOAuth2";
// Data types
import { Metadata } from "src/utils/datatypes/globalDataTypes";

export interface OAuth2Workload {
  cn: string;
  dn: string;
  oauth2workloadtype: string[];
  oauth2workloadowner: string[];
  oauth2spiffeid: string[];
  oauth2workloadclient: string[];
  oauth2workloadserviceprincipal: string[];
  oauth2enabled: string[];
  oauth2maxtokenlifetime: string[];
  description: string[];
}

type OAuth2WorkloadSettingsData = {
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

const useOAuth2WorkloadSettingsData = (
  workloadName: string
): OAuth2WorkloadSettingsData => {
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  const workloadDetails = useOauth2WorkloadShowQuery(workloadName);
  const workloadData = workloadDetails.data as unknown as
    | OAuth2Workload
    | undefined;
  const isWorkloadDataLoading = workloadDetails.isLoading;

  const [modified, setModified] = React.useState(false);
  const [workload, setWorkload] = React.useState<Partial<OAuth2Workload>>({});

  React.useEffect(() => {
    if (workloadData && !workloadDetails.isFetching) {
      setWorkload({ ...workloadData });
    }
  }, [workloadData, workloadDetails.isFetching]);

  const settings: OAuth2WorkloadSettingsData = {
    isLoading: metadataLoading || isWorkloadDataLoading,
    isFetching: workloadDetails.isFetching,
    modified,
    setModified,
    metadata,
    resetValues: () => {},
    originalWorkload: workload,
    setWorkload,
    refetch: workloadDetails.refetch,
    workload,
    modifiedValues: () => workload,
  };

  const getModifiedValues = (): Partial<OAuth2Workload> => {
    if (!workloadData) {
      return {};
    }
    const modifiedValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(workload)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(workloadData[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (workloadData[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues as Partial<OAuth2Workload>;
  };
  settings.modifiedValues = getModifiedValues;

  React.useEffect(() => {
    if (!workloadData) {
      return;
    }
    let mod = false;
    for (const [key, value] of Object.entries(workload)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(workloadData[key]) !== JSON.stringify(value)) {
          mod = true;
          break;
        }
      } else {
        if (workloadData[key] !== value) {
          mod = true;
          break;
        }
      }
    }
    setModified(mod);
  }, [workload, workloadData]);

  const onResetValues = () => {
    setModified(false);
  };
  settings.resetValues = onResetValues;

  return settings;
};

export { useOAuth2WorkloadSettingsData };
