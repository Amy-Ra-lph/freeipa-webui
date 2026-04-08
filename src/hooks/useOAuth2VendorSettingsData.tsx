import React from "react";
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useOauth2VendorShowQuery } from "src/services/rpcOAuth2";
import { Metadata } from "src/utils/datatypes/globalDataTypes";

export interface OAuth2Vendor {
  cn: string;
  dn: string;
  oauth2vendorcacert: string[];
  oauth2vendorscope: string[];
  oauth2vendornotafter: string[];
  oauth2vendorcontact: string[];
  oauth2vendorrekorurl: string[];
  oauth2enabled: string[];
  description: string[];
}

export interface OAuth2VendorSettingsData {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalVendor: Partial<OAuth2Vendor>;
  vendor: Partial<OAuth2Vendor>;
  setVendor: (vendor: Partial<OAuth2Vendor>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<OAuth2Vendor>;
}

const useOAuth2VendorSettingsData = (
  vendorName: string
): OAuth2VendorSettingsData => {
  const { data: metadataData } = useGetObjectMetadataQuery();
  const metadata = metadataData || ({} as Metadata);

  const {
    data: vendorData,
    isFetching,
    refetch,
  } = useOauth2VendorShowQuery(vendorName);

  const [vendor, setVendor] = React.useState<Partial<OAuth2Vendor>>({});
  const [modified, setModified] = React.useState(false);

  React.useEffect(() => {
    if (vendorData && !isFetching) {
      setVendor({ ...vendorData } as Partial<OAuth2Vendor>);
    }
  }, [vendorData, isFetching]);

  const getModifiedValues = (): Partial<OAuth2Vendor> => {
    if (!vendorData) {
      return {};
    }

    const modifiedValues = {} as Record<string, unknown>;

    for (const [key, value] of Object.entries(vendor)) {
      if (vendorData[key] !== undefined) {
        const original = vendorData[key];
        if (Array.isArray(original) && Array.isArray(value)) {
          if (JSON.stringify(original) !== JSON.stringify(value)) {
            modifiedValues[key] = value;
          }
        } else if (original !== value) {
          modifiedValues[key] = value;
        }
      }
    }

    return modifiedValues as Partial<OAuth2Vendor>;
  };

  React.useEffect(() => {
    if (!vendorData) {
      return;
    }

    let isModified = false;
    for (const [key, value] of Object.entries(vendor)) {
      if (vendorData[key] !== undefined) {
        const original = vendorData[key];
        if (Array.isArray(original) && Array.isArray(value)) {
          if (JSON.stringify(original) !== JSON.stringify(value)) {
            isModified = true;
            break;
          }
        } else if (original !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [vendor, vendorData]);

  const onResetValues = () => {
    setModified(false);
  };

  return {
    isLoading: isFetching,
    isFetching,
    modified,
    setModified,
    resetValues: onResetValues,
    metadata,
    originalVendor: (vendorData || {}) as Partial<OAuth2Vendor>,
    vendor,
    setVendor,
    refetch,
    modifiedValues: getModifiedValues,
  };
};

export default useOAuth2VendorSettingsData;
