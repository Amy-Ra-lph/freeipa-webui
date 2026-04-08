import React from "react";
// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useOauth2ScopeShowQuery } from "src/services/rpcOAuth2";
// Data types
import { Metadata } from "src/utils/datatypes/globalDataTypes";

export interface OAuth2Scope {
  cn: string;
  dn: string;
  oauth2scope: string[];
  oauth2scopedescription: string[];
  oauth2enabled: string[];
}

type OAuth2ScopeSettingsData = {
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

const useOAuth2ScopeSettingsData = (
  scopeName: string
): OAuth2ScopeSettingsData => {
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  const scopeDetails = useOauth2ScopeShowQuery(scopeName);
  const scopeData = scopeDetails.data as unknown as OAuth2Scope | undefined;
  const isScopeDataLoading = scopeDetails.isLoading;

  const [modified, setModified] = React.useState(false);
  const [scope, setScope] = React.useState<Partial<OAuth2Scope>>({});

  React.useEffect(() => {
    if (scopeData && !scopeDetails.isFetching) {
      setScope({ ...scopeData });
    }
  }, [scopeData, scopeDetails.isFetching]);

  const settings: OAuth2ScopeSettingsData = {
    isLoading: metadataLoading || isScopeDataLoading,
    isFetching: scopeDetails.isFetching,
    modified,
    setModified,
    metadata,
    resetValues: () => {},
    originalScope: scope,
    setScope,
    refetch: scopeDetails.refetch,
    scope,
    modifiedValues: () => scope,
  };

  const getModifiedValues = (): Partial<OAuth2Scope> => {
    if (!scopeData) {
      return {};
    }
    const modifiedValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(scope)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(scopeData[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (scopeData[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues as Partial<OAuth2Scope>;
  };
  settings.modifiedValues = getModifiedValues;

  React.useEffect(() => {
    if (!scopeData) {
      return;
    }
    let mod = false;
    for (const [key, value] of Object.entries(scope)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(scopeData[key]) !== JSON.stringify(value)) {
          mod = true;
          break;
        }
      } else {
        if (scopeData[key] !== value) {
          mod = true;
          break;
        }
      }
    }
    setModified(mod);
  }, [scope, scopeData]);

  const onResetValues = () => {
    setModified(false);
  };
  settings.resetValues = onResetValues;

  return settings;
};

export { useOAuth2ScopeSettingsData };
