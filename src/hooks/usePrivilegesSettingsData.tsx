import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { usePrivilegeShowQuery } from "src/services/rpcPrivileges";
// Data types
import { Privilege, Metadata } from "src/utils/datatypes/globalDataTypes";

type PrivilegeSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalPrivilege: Partial<Privilege>;
  privilege: Partial<Privilege>;
  setPrivilege: (privilege: Partial<Privilege>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<Privilege>;
};

const usePrivilegeSettings = (
  privilegeId: string
): PrivilegeSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Privilege
  const privilegeQuery = usePrivilegeShowQuery(privilegeId);
  const privilegeData = privilegeQuery.data;
  const isPrivilegeLoading = privilegeQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [privilege, setPrivilege] = useState<Partial<Privilege>>({});
  const [originalPrivilege, setOriginalPrivilege] = useState<
    Partial<Privilege>
  >({});

  useEffect(() => {
    if (
      privilegeData &&
      privilegeData.length > 0 &&
      !privilegeQuery.isFetching
    ) {
      setPrivilege({ ...privilegeData[0] });
      setOriginalPrivilege({ ...privilegeData[0] });
    }
  }, [privilegeData, privilegeQuery.isFetching]);

  const getModifiedValues = (): Partial<Privilege> => {
    if (!originalPrivilege) {
      return {};
    }

    const modifiedValues: Partial<Privilege> = {};
    for (const [key, value] of Object.entries(privilege)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalPrivilege[key]) !== JSON.stringify(value)
        ) {
          modifiedValues[key] = value;
        }
      } else if (originalPrivilege[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalPrivilege) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(privilege)) {
      if (Array.isArray(value)) {
        if (
          JSON.stringify(originalPrivilege[key]) !== JSON.stringify(value)
        ) {
          isModified = true;
          break;
        }
      } else {
        if (originalPrivilege[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [privilege, originalPrivilege]);

  const onResetValues = () => {
    setOriginalPrivilege({ ...privilege });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isPrivilegeLoading,
    isFetching: privilegeQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalPrivilege,
    privilege,
    setPrivilege,
    refetch: privilegeQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { usePrivilegeSettings };
