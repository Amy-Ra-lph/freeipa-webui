import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useGetDelegationFullDataQuery } from "src/services/rpcOAuth2";
// Data types
import { OAuth2Delegation, Metadata } from "src/utils/datatypes/globalDataTypes";

type SettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalDelegation: Partial<OAuth2Delegation>;
  delegation: Partial<OAuth2Delegation>;
  setDelegation: (delegation: Partial<OAuth2Delegation>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<OAuth2Delegation>;
};

const useOAuth2DelegationSettings = (delegationId: string): SettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Host Group
  const delegationFullDataQuery = useGetDelegationFullDataQuery(delegationId);
  const delegationFullData = delegationFullDataQuery.data;
  const isFullDataLoading = delegationFullDataQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [delegation, setDelegation] = useState<Partial<OAuth2Delegation>>({});

  useEffect(() => {
    if (delegationFullData && !delegationFullDataQuery.isFetching) {
      setDelegation({ ...delegationFullData.delegation });
    }
  }, [delegationFullData, delegationFullDataQuery.isFetching]);

  const settings = {
    isLoading: metadataLoading || isFullDataLoading,
    isFetching: delegationFullDataQuery.isFetching,
    modified,
    setModified,
    metadata,
    resetValues: () => {},
    originalDelegation: delegation,
    delegation,
    setDelegation,
    refetch: delegationFullDataQuery.refetch,
    modifiedValues: () => delegation,
  } as SettingsData;

  if (delegationFullData) {
    settings.originalDelegation = delegationFullData.delegation || {};
  } else {
    settings.originalDelegation = {};
  }

  const getModifiedValues = (): Partial<OAuth2Delegation> => {
    if (!delegationFullData || !delegationFullData.delegation) {
      return {};
    }

    const modifiedValues = {};
    for (const [key, value] of Object.entries(delegation)) {
      if (Array.isArray(value)) {
        // Using 'JSON.stringify' when comparing arrays (to prevent data type false positives)
        if (JSON.stringify(delegationFullData.delegation[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (delegationFullData.delegation[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };
  settings.modifiedValues = getModifiedValues;

  // Detect any change in 'originalGroup' and 'group' objects
  useEffect(() => {
    if (!delegationFullData || !delegationFullData.delegation) {
      return;
    }
    let modified = false;
    for (const [key, value] of Object.entries(delegation)) {
      if (Array.isArray(value)) {
        // Using 'JSON.stringify' when comparing arrays (to prevent data type false positives)
        if (JSON.stringify(delegationFullData.delegation[key]) !== JSON.stringify(value)) {
          modified = true;
          break;
        }
      } else {
        if (delegationFullData.delegation[key] !== value) {
          modified = true;
          break;
        }
      }
    }
    setModified(modified);
  }, [delegation, delegationFullData]);

  const onResetValues = () => {
    setModified(false);
  };
  settings.resetValues = onResetValues;

  return settings;
};

export { useOAuth2DelegationSettings };
