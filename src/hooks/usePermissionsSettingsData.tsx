import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { usePermissionShowQuery } from "src/services/rpcPermissions";
// Data types
import { Permission, Metadata } from "src/utils/datatypes/globalDataTypes";

type PermissionSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalPermission: Partial<Permission>;
  permission: Partial<Permission>;
  setPermission: (permission: Partial<Permission>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<Permission>;
};

const usePermissionSettings = (
  permissionId: string
): PermissionSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Permission
  const permissionQuery = usePermissionShowQuery(permissionId);
  const permissionData = permissionQuery.data;
  const isPermissionLoading = permissionQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [permission, setPermission] = useState<Partial<Permission>>({});
  const [originalPermission, setOriginalPermission] = useState<
    Partial<Permission>
  >({});

  useEffect(() => {
    if (
      permissionData &&
      permissionData.length > 0 &&
      !permissionQuery.isFetching
    ) {
      setPermission({ ...permissionData[0] });
      setOriginalPermission({ ...permissionData[0] });
    }
  }, [permissionData, permissionQuery.isFetching]);

  const getModifiedValues = (): Partial<Permission> => {
    if (!originalPermission) {
      return {};
    }

    const modifiedValues: Partial<Permission> = {};
    for (const [key, value] of Object.entries(permission)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalPermission[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (originalPermission[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalPermission) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(permission)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalPermission[key]) !== JSON.stringify(value)) {
          isModified = true;
          break;
        }
      } else {
        if (originalPermission[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [permission, originalPermission]);

  const onResetValues = () => {
    setOriginalPermission({ ...permission });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isPermissionLoading,
    isFetching: permissionQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalPermission,
    permission,
    setPermission,
    refetch: permissionQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { usePermissionSettings };
