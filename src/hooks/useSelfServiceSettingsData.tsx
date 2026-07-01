import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useSelfServiceShowQuery } from "src/services/rpcSelfService";
// Data types
import {
  SelfServicePermission,
  Metadata,
} from "src/utils/datatypes/globalDataTypes";

type SelfServiceSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalSelfService: Partial<SelfServicePermission>;
  selfService: Partial<SelfServicePermission>;
  setSelfService: (selfService: Partial<SelfServicePermission>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<SelfServicePermission>;
};

const useSelfServiceSettings = (
  aciname: string
): SelfServiceSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Self-service permission
  const selfServiceQuery = useSelfServiceShowQuery(aciname);
  const selfServiceData = selfServiceQuery.data;
  const isSelfServiceLoading = selfServiceQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [selfService, setSelfService] = useState<
    Partial<SelfServicePermission>
  >({});
  const [originalSelfService, setOriginalSelfService] = useState<
    Partial<SelfServicePermission>
  >({});

  useEffect(() => {
    if (
      selfServiceData &&
      selfServiceData.length > 0 &&
      !selfServiceQuery.isFetching
    ) {
      setSelfService({ ...selfServiceData[0] });
      setOriginalSelfService({ ...selfServiceData[0] });
    }
  }, [selfServiceData, selfServiceQuery.isFetching]);

  const getModifiedValues = (): Partial<SelfServicePermission> => {
    if (!originalSelfService) {
      return {};
    }

    const modifiedValues: Partial<SelfServicePermission> = {};
    for (const [key, value] of Object.entries(selfService)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalSelfService[key]) !== JSON.stringify(value)
        ) {
          modifiedValues[key] = value;
        }
      } else if (originalSelfService[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalSelfService) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(selfService)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalSelfService[key]) !== JSON.stringify(value)
        ) {
          isModified = true;
          break;
        }
      } else {
        if (originalSelfService[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [selfService, originalSelfService]);

  const onResetValues = () => {
    setOriginalSelfService({ ...selfService });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isSelfServiceLoading,
    isFetching: selfServiceQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalSelfService,
    selfService,
    setSelfService,
    refetch: selfServiceQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { useSelfServiceSettings };
