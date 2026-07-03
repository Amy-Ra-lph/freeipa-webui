import React from "react";
// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useOauth2DelegationShowQuery } from "src/services/rpcOAuth2";
// Data types
import { Metadata } from "src/utils/datatypes/globalDataTypes";

export interface OAuth2Delegation {
  cn: string;
  dn: string;
  oauth2delegatesource: string[];
  oauth2delegatetarget: string[];
  oauth2delegatescope: string[];
  oauth2delegatehostgroup: string[];
  oauth2delegateservice: string[];
  oauth2delegatenotafter: string[];
  oauth2enabled: string[];
  description: string[];
}

type OAuth2DelegationSettingsData = {
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

const useOAuth2DelegationSettingsData = (
  delegationName: string
): OAuth2DelegationSettingsData => {
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  const delegationDetails = useOauth2DelegationShowQuery(delegationName);
  const delegationData = delegationDetails.data as unknown as
    | OAuth2Delegation
    | undefined;
  const isDelegationDataLoading = delegationDetails.isLoading;

  const [modified, setModified] = React.useState(false);
  const [delegation, setDelegation] = React.useState<Partial<OAuth2Delegation>>(
    {}
  );

  React.useEffect(() => {
    if (delegationData && !delegationDetails.isFetching) {
      setDelegation({ ...delegationData });
    }
  }, [delegationData, delegationDetails.isFetching]);

  const settings: OAuth2DelegationSettingsData = {
    isLoading: metadataLoading || isDelegationDataLoading,
    isFetching: delegationDetails.isFetching,
    modified,
    setModified,
    metadata,
    resetValues: () => {},
    originalDelegation: delegation,
    setDelegation,
    refetch: delegationDetails.refetch,
    delegation,
    modifiedValues: () => delegation,
  };

  const getModifiedValues = (): Partial<OAuth2Delegation> => {
    if (!delegationData) {
      return {};
    }
    const modifiedValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(delegation)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(delegationData[key]) !== JSON.stringify(value)
        ) {
          modifiedValues[key] = value;
        }
      } else if (delegationData[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues as Partial<OAuth2Delegation>;
  };
  settings.modifiedValues = getModifiedValues;

  React.useEffect(() => {
    if (!delegationData) {
      return;
    }
    let mod = false;
    for (const [key, value] of Object.entries(delegation)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(delegationData[key]) !== JSON.stringify(value)
        ) {
          mod = true;
          break;
        }
      } else {
        if (delegationData[key] !== value) {
          mod = true;
          break;
        }
      }
    }
    setModified(mod);
  }, [delegation, delegationData]);

  const onResetValues = () => {
    setModified(false);
  };
  settings.resetValues = onResetValues;

  return settings;
};

export { useOAuth2DelegationSettingsData };
