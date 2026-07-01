import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useTopologySuffixShowQuery } from "src/services/rpcTopologySuffixes";
// Data types
import { TopologySuffix, Metadata } from "src/utils/datatypes/globalDataTypes";

type TopologySuffixSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalSuffix: Partial<TopologySuffix>;
  suffix: Partial<TopologySuffix>;
  setSuffix: (suffix: Partial<TopologySuffix>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<TopologySuffix>;
};

const useTopologySuffixSettings = (
  suffixId: string
): TopologySuffixSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Suffix
  const suffixQuery = useTopologySuffixShowQuery(suffixId);
  const suffixData = suffixQuery.data;
  const isSuffixLoading = suffixQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [suffix, setSuffix] = useState<Partial<TopologySuffix>>({});
  const [originalSuffix, setOriginalSuffix] = useState<
    Partial<TopologySuffix>
  >({});

  useEffect(() => {
    if (suffixData && suffixData.length > 0 && !suffixQuery.isFetching) {
      setSuffix({ ...suffixData[0] });
      setOriginalSuffix({ ...suffixData[0] });
    }
  }, [suffixData, suffixQuery.isFetching]);

  const getModifiedValues = (): Partial<TopologySuffix> => {
    if (!originalSuffix) {
      return {};
    }

    const modifiedValues: Partial<TopologySuffix> = {};
    for (const [key, value] of Object.entries(suffix)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalSuffix[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (originalSuffix[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalSuffix) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(suffix)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalSuffix[key]) !== JSON.stringify(value)) {
          isModified = true;
          break;
        }
      } else {
        if (originalSuffix[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [suffix, originalSuffix]);

  const onResetValues = () => {
    setOriginalSuffix({ ...suffix });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isSuffixLoading,
    isFetching: suffixQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalSuffix,
    suffix,
    setSuffix,
    refetch: suffixQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { useTopologySuffixSettings };
