import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useDelegationShowQuery } from "src/services/rpcDelegation";
// Data types
import {
  DelegationPermission,
  Metadata,
} from "src/utils/datatypes/globalDataTypes";

type DelegationSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalDelegation: Partial<DelegationPermission>;
  delegation: Partial<DelegationPermission>;
  setDelegation: (delegation: Partial<DelegationPermission>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<DelegationPermission>;
};

const useDelegationSettings = (
  delegationId: string
): DelegationSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Delegation
  const delegationQuery = useDelegationShowQuery(delegationId);
  const delegationData = delegationQuery.data;
  const isDelegationLoading = delegationQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [delegation, setDelegation] = useState<Partial<DelegationPermission>>(
    {}
  );
  const [originalDelegation, setOriginalDelegation] = useState<
    Partial<DelegationPermission>
  >({});

  useEffect(() => {
    if (
      delegationData &&
      delegationData.length > 0 &&
      !delegationQuery.isFetching
    ) {
      setDelegation({ ...delegationData[0] });
      setOriginalDelegation({ ...delegationData[0] });
    }
  }, [delegationData, delegationQuery.isFetching]);

  const getModifiedValues = (): Partial<DelegationPermission> => {
    if (!originalDelegation) {
      return {};
    }

    const modifiedValues: Partial<DelegationPermission> = {};
    for (const [key, value] of Object.entries(delegation)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalDelegation[key]) !== JSON.stringify(value)
        ) {
          modifiedValues[key] = value;
        }
      } else if (originalDelegation[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalDelegation) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(delegation)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalDelegation[key]) !== JSON.stringify(value)
        ) {
          isModified = true;
          break;
        }
      } else {
        if (originalDelegation[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [delegation, originalDelegation]);

  const onResetValues = () => {
    setOriginalDelegation({ ...delegation });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isDelegationLoading,
    isFetching: delegationQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalDelegation,
    delegation,
    setDelegation,
    refetch: delegationQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { useDelegationSettings };
