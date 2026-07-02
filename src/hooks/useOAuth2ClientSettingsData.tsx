import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useGetClientFullDataQuery } from "src/services/rpcOAuth2";
// Data types
import { OAuth2Client, Metadata } from "src/utils/datatypes/globalDataTypes";

type SettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalClient: Partial<OAuth2Client>;
  client: Partial<OAuth2Client>;
  setClient: (client: Partial<OAuth2Client>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<OAuth2Client>;
};

const useOAuth2ClientSettings = (clientId: string): SettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Host Group
  const clientFullDataQuery = useGetClientFullDataQuery(clientId);
  const clientFullData = clientFullDataQuery.data;
  const isFullDataLoading = clientFullDataQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [client, setClient] = useState<Partial<OAuth2Client>>({});

  useEffect(() => {
    if (clientFullData && !clientFullDataQuery.isFetching) {
      setClient({ ...clientFullData.client });
    }
  }, [clientFullData, clientFullDataQuery.isFetching]);

  const settings = {
    isLoading: metadataLoading || isFullDataLoading,
    isFetching: clientFullDataQuery.isFetching,
    modified,
    setModified,
    metadata,
    resetValues: () => {},
    originalClient: client,
    client,
    setClient,
    refetch: clientFullDataQuery.refetch,
    modifiedValues: () => client,
  } as SettingsData;

  if (clientFullData) {
    settings.originalClient = clientFullData.client || {};
  } else {
    settings.originalClient = {};
  }

  const getModifiedValues = (): Partial<OAuth2Client> => {
    if (!clientFullData || !clientFullData.client) {
      return {};
    }

    const modifiedValues = {};
    for (const [key, value] of Object.entries(client)) {
      if (Array.isArray(value)) {
        // Using 'JSON.stringify' when comparing arrays (to prevent data type false positives)
        if (JSON.stringify(clientFullData.client[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (clientFullData.client[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };
  settings.modifiedValues = getModifiedValues;

  // Detect any change in 'originalGroup' and 'group' objects
  useEffect(() => {
    if (!clientFullData || !clientFullData.client) {
      return;
    }
    let modified = false;
    for (const [key, value] of Object.entries(client)) {
      if (Array.isArray(value)) {
        // Using 'JSON.stringify' when comparing arrays (to prevent data type false positives)
        if (JSON.stringify(clientFullData.client[key]) !== JSON.stringify(value)) {
          modified = true;
          break;
        }
      } else {
        if (clientFullData.client[key] !== value) {
          modified = true;
          break;
        }
      }
    }
    setModified(modified);
  }, [client, clientFullData]);

  const onResetValues = () => {
    setModified(false);
  };
  settings.resetValues = onResetValues;

  return settings;
};

export { useOAuth2ClientSettings };
