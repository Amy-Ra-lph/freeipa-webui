import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useCertProfileShowQuery } from "src/services/rpcCertProfiles";
// Data types
import { CertProfile, Metadata } from "src/utils/datatypes/globalDataTypes";

type CertProfileSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalCertProfile: Partial<CertProfile>;
  certProfile: Partial<CertProfile>;
  setCertProfile: (certProfile: Partial<CertProfile>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<CertProfile>;
};

const useCertProfileSettings = (
  profileId: string
): CertProfileSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] CertProfile
  const certProfileQuery = useCertProfileShowQuery(profileId);
  const certProfileData = certProfileQuery.data;
  const isCertProfileLoading = certProfileQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [certProfile, setCertProfile] = useState<Partial<CertProfile>>({});
  const [originalCertProfile, setOriginalCertProfile] = useState<
    Partial<CertProfile>
  >({});

  useEffect(() => {
    if (
      certProfileData &&
      certProfileData.length > 0 &&
      !certProfileQuery.isFetching
    ) {
      setCertProfile({ ...certProfileData[0] });
      setOriginalCertProfile({ ...certProfileData[0] });
    }
  }, [certProfileData, certProfileQuery.isFetching]);

  const getModifiedValues = (): Partial<CertProfile> => {
    if (!originalCertProfile) {
      return {};
    }

    const modifiedValues: Partial<CertProfile> = {};
    for (const [key, value] of Object.entries(certProfile)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalCertProfile[key]) !== JSON.stringify(value)
        ) {
          modifiedValues[key] = value;
        }
      } else if (originalCertProfile[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalCertProfile) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(certProfile)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalCertProfile[key]) !== JSON.stringify(value)
        ) {
          isModified = true;
          break;
        }
      } else {
        if (originalCertProfile[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [certProfile, originalCertProfile]);

  const onResetValues = () => {
    setOriginalCertProfile({ ...certProfile });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isCertProfileLoading,
    isFetching: certProfileQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalCertProfile,
    certProfile,
    setCertProfile,
    refetch: certProfileQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { useCertProfileSettings };
