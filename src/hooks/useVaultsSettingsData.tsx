import { useState, useEffect } from "react";

// RPC
import { useGetObjectMetadataQuery } from "src/services/rpc";
import { useVaultShowQuery } from "src/services/rpcVaults";
// Data types
import { Vault, Metadata } from "src/utils/datatypes/globalDataTypes";

type VaultSettingsData = {
  isLoading: boolean;
  isFetching: boolean;
  modified: boolean;
  setModified: (value: boolean) => void;
  resetValues: () => void;
  metadata: Metadata;
  originalVault: Partial<Vault>;
  vault: Partial<Vault>;
  setVault: (vault: Partial<Vault>) => void;
  refetch: () => void;
  modifiedValues: () => Partial<Vault>;
};

const useVaultSettings = (vaultId: string): VaultSettingsData => {
  // [API call] Metadata
  const metadataQuery = useGetObjectMetadataQuery();
  const metadata = metadataQuery.data || {};
  const metadataLoading = metadataQuery.isLoading;

  // [API call] Vault
  const vaultQuery = useVaultShowQuery(vaultId);
  const vaultData = vaultQuery.data;
  const isVaultLoading = vaultQuery.isLoading;
  const [modified, setModified] = useState(false);
  const [vault, setVault] = useState<Partial<Vault>>({});
  const [originalVault, setOriginalVault] = useState<Partial<Vault>>({});

  useEffect(() => {
    if (vaultData && vaultData.length > 0 && !vaultQuery.isFetching) {
      setVault({ ...vaultData[0] });
      setOriginalVault({ ...vaultData[0] });
    }
  }, [vaultData, vaultQuery.isFetching]);

  const getModifiedValues = (): Partial<Vault> => {
    if (!originalVault) {
      return {};
    }

    const modifiedValues: Partial<Vault> = {};
    for (const [key, value] of Object.entries(vault)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalVault[key]) !== JSON.stringify(value)) {
          modifiedValues[key] = value;
        }
      } else if (originalVault[key] !== value) {
        modifiedValues[key] = value;
      }
    }
    return modifiedValues;
  };

  useEffect(() => {
    if (!originalVault) {
      return;
    }
    let isModified = false;
    for (const [key, value] of Object.entries(vault)) {
      if (Array.isArray(value)) {
        if (JSON.stringify(originalVault[key]) !== JSON.stringify(value)) {
          isModified = true;
          break;
        }
      } else {
        if (originalVault[key] !== value) {
          isModified = true;
          break;
        }
      }
    }
    setModified(isModified);
  }, [vault, originalVault]);

  const onResetValues = () => {
    setOriginalVault({ ...vault });
    setModified(false);
  };

  return {
    isLoading: metadataLoading || isVaultLoading,
    isFetching: vaultQuery.isFetching,
    modified,
    setModified,
    metadata,
    originalVault,
    vault,
    setVault,
    refetch: vaultQuery.refetch,
    modifiedValues: getModifiedValues,
    resetValues: onResetValues,
  };
};

export { useVaultSettings };
