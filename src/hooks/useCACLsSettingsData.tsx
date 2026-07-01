import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useCACLShowQuery } from "src/services/rpcCACLs";
// Data types
import { CertACL, Metadata } from "src/utils/datatypes/globalDataTypes";

type CACLSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalCACL: Partial<CertACL>;
  cacl: Partial<CertACL>;
  setCACL: (cacl: Partial<CertACL>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<CertACL>;
};

const useCACLSettings = (caclId: string): CACLSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] CA ACL
  const caclQuery = useCACLShowQuery(caclId);
  const caclData = caclQuery.data;
  const isCACLLoading = caclQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [cacl, setCACL] = useState<Partial<CertACL>>({});
  const [originalCACL, setOriginalCACL] = useState<Partial<CertACL>>({});

  useEffect(() => {
    if (caclData && caclData.length > 0 && !caclQuery.isFetching) {
      setCACL({ ...caclData[0] });
      setOriginalCACL({ ...caclData[0] });
    }
  }, [caclData, caclQuery.isFetching]);

  const getModifiedValues = (): Partial<CertACL> => {
    if (!originalCACL) {
      return {};
    }

    const modifiedValues: Partial<CertACL> = {};
    for (const [key, value] of Object.entries(cacl)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalCACL[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (originalCACL[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalCACL) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(cacl)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalCACL[key]) !== JSON.stringify(value)) {
          isModified = true;
          break;
        }
      } else {
        if (originalCACL[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [cacl, originalCACL]);

  const onResetValues = () => {
    setOriginalCACL({ ...cacl });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isCACLLoading,
    isFetching: caclQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalCACL,
    cacl,
    setCACL,
    refetch: caclQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { useCACLSettings };
