import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useCertAuthorityShowQuery } from "src/services/rpcCertAuthorities";
// Data types
import {
  CertificateAuthority,
  Metadata,
} from "src/utils/datatypes/globalDataTypes";

type CertAuthoritySettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalCertAuthority: Partial<CertificateAuthority>;
  certAuthority: Partial<CertificateAuthority>;
  setCertAuthority: (ca: Partial<CertificateAuthority>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<CertificateAuthority>;
};

const useCertAuthoritySettings = (
  caId: string
): CertAuthoritySettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Certificate Authority
  const caQuery = useCertAuthorityShowQuery(caId);
  const caData = caQuery.data;
  const isCaLoading = caQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [certAuthority, setCertAuthority] = useState<
    Partial<CertificateAuthority>
  >({});
  const [originalCertAuthority, setOriginalCertAuthority] = useState<
    Partial<CertificateAuthority>
  >({});

  useEffect(() => {
    if (caData && caData.length > 0 && !caQuery.isFetching) {
      setCertAuthority({ ...caData[0] });
      setOriginalCertAuthority({ ...caData[0] });
    }
  }, [caData, caQuery.isFetching]);

  const getModifiedValues = (): Partial<CertificateAuthority> => {
    if (!originalCertAuthority) {
      return {};
    }

    const modifiedValues: Partial<CertificateAuthority> = {};
    for (const [key, value] of Object.entries(certAuthority)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalCertAuthority[key]) !== JSON.stringify(value)
        ) {
          modifiedValues[key] = value;
        }
      } else if (originalCertAuthority[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalCertAuthority) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(certAuthority)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalCertAuthority[key]) !== JSON.stringify(value)
        ) {
          isModified = true;
          break;
        }
      } else {
        if (originalCertAuthority[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [certAuthority, originalCertAuthority]);

  const onResetValues = () => {
    setOriginalCertAuthority({ ...certAuthority });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isCaLoading,
    isFetching: caQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalCertAuthority,
    certAuthority,
    setCertAuthority,
    refetch: caQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { useCertAuthoritySettings };
