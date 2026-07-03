import React from "react";
// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useOauth2ClientShowQuery } from "src/services/rpcOAuth2";
// Data types
import { Metadata } from "src/utils/datatypes/globalDataTypes";

export interface OAuth2Client {
  cn: string;
  dn: string;
  oauth2clientid: string[];
  oauth2clienttype: string[];
  oauth2redirecturi: string[];
  oauth2granttype: string[];
  oauth2scope: string[];
  oauth2tokenlifetime: string[];
  oauth2enabled: string[];
  oauth2clientsecret: string[];
  oauth2keycloakid: string[];
  description: string[];
}

type OAuth2ClientSettingsData = {
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

const useOAuth2ClientSettingsData = (
  clientName: string
): OAuth2ClientSettingsData => {
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  const clientDetails = useOauth2ClientShowQuery(clientName);
  const clientData = clientDetails.data as unknown as OAuth2Client | undefined;
  const isClientDataLoading = clientDetails.isLoading;

  const [modified, setModified] = React.useState(false);
  const [client, setClient] = React.useState<Partial<OAuth2Client>>({});

  React.useEffect(() => {
    if (clientData && !clientDetails.isFetching) {
      setClient({ ...clientData });
    }
  }, [clientData, clientDetails.isFetching]);

  const settings: OAuth2ClientSettingsData = {
    isLoading: metadataLoading || isClientDataLoading,
    isFetching: clientDetails.isFetching,
    modified,
    setModified,
    metadata,
    resetValues: () => {},
    originalClient: client,
    setClient,
    refetch: clientDetails.refetch,
    client,
    modifiedValues: () => client,
  };

  const getModifiedValues = (): Partial<OAuth2Client> => {
    if (!clientData) {
      return {};
    }
    const modifiedValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(client)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(clientData[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (clientData[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues as Partial<OAuth2Client>;
  };
  settings.modifiedValues = getModifiedValues;

  React.useEffect(() => {
    if (!clientData) {
      return;
    }
    let mod = false;
    for (const [key, value] of Object.entries(client)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(clientData[key]) !== JSON.stringify(value)) {
          mod = true;
          break;
        }
      } else {
        if (clientData[key] !== value) {
          mod = true;
          break;
        }
      }
    }
    setModified(mod);
  }, [client, clientData]);

  const onResetValues = () => {
    setModified(false);
  };
  settings.resetValues = onResetValues;

  return settings;
};

export { useOAuth2ClientSettingsData };
