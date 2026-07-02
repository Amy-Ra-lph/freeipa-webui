import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useGetScopeFullDataQuery } from "src/services/rpcOAuth2";
// Data types
import { OAuth2Scope, Metadata } from "src/utils/datatypes/globalDataTypes";

type SettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalScope: Partial<OAuth2Scope>;
  scope: Partial<OAuth2Scope>;
  setScope: (scope: Partial<OAuth2Scope>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<OAuth2Scope>;
};

const useOAuth2ScopeSettings = (scopeId: string): SettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Host Group
  const scopeFullDataQuery = useGetScopeFullDataQuery(scopeId);
  const scopeFullData = scopeFullDataQuery.data;
  const isFullDataLoading = scopeFullDataQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [scope, setScope] = useState<Partial<OAuth2Scope>>({});

  useEffect(() => {
    if (scopeFullData && !scopeFullDataQuery.isFetching) {
      setScope({ ...scopeFullData.scope });
    }
  }, [scopeFullData, scopeFullDataQuery.isFetching]);

  const settings = {
    isLoading: metadataLoading || isFullDataLoading,
    isFetching: scopeFullDataQuery.isFetching,
    modified,
    setModified,
    metadata,
    resetValues: () => {},
    originalScope: scope,
    scope,
    setScope,
    refetch: scopeFullDataQuery.refetch,
    modifiedValues: () => scope,
  } as SettingsData;

  if (scopeFullData) {
    settings.originalScope = scopeFullData.scope || {};
  } else {
    settings.originalScope = {};
  }

  const getModifiedValues = (): Partial<OAuth2Scope> => {
    if (!scopeFullData || !scopeFullData.scope) {
      return {};
    }

    const modifiedValues = {};
    for (const [key, value] of Object.entries(scope)) {
      if (Array.isArray(value)) {
        // Using 'JSON.stringify' when comparing arrays (to prevent data type false positives)
        if (JSON.stringify(scopeFullData.scope[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (scopeFullData.scope[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };
  settings.modifiedValues = getModifiedValues;

  // Detect any change in 'originalGroup' and 'group' objects
  useEffect(() => {
    if (!scopeFullData || !scopeFullData.scope) {
      return;
    }
    let modified = false;
    for (const [key, value] of Object.entries(scope)) {
      if (Array.isArray(value)) {
        // Using 'JSON.stringify' when comparing arrays (to prevent data type false positives)
        if (JSON.stringify(scopeFullData.scope[key]) !== JSON.stringify(value)) {
          modified = true;
          break;
        }
      } else {
        if (scopeFullData.scope[key] !== value) {
          modified = true;
          break;
        }
      }
    }
    setModified(modified);
  }, [scope, scopeFullData]);

  const onResetValues = () => {
    setModified(false);
  };
  settings.resetValues = onResetValues;

  return settings;
};

export { useOAuth2ScopeSettings };
