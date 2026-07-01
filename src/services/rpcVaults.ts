import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToVault } from "src/utils/vaultsUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { Vault, cnType } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Vaults-related endpoints: getVaultsInfoByName, addVault, deleteVaults,
 * saveVault, searchVaultsEntries, getVaultById, addMemberVault,
 * removeMemberVault, addOwnerVault, removeOwnerVault
 *
 * API commands:
 * - vault_find: https://freeipa.readthedocs.io/en/latest/api/vault_find.html
 * - vault_show: https://freeipa.readthedocs.io/en/latest/api/vault_show.html
 * - vault_add: https://freeipa.readthedocs.io/en/latest/api/vault_add.html
 * - vault_del: https://freeipa.readthedocs.io/en/latest/api/vault_del.html
 * - vault_mod: https://freeipa.readthedocs.io/en/latest/api/vault_mod.html
 * - vault_add_member: https://freeipa.readthedocs.io/en/latest/api/vault_add_member.html
 * - vault_remove_member: https://freeipa.readthedocs.io/en/latest/api/vault_remove_member.html
 * - vault_add_owner: https://freeipa.readthedocs.io/en/latest/api/vault_add_owner.html
 * - vault_remove_owner: https://freeipa.readthedocs.io/en/latest/api/vault_remove_owner.html
 */

interface VaultShowPayload {
  vaultNamesList: string[];
  no_members?: boolean;
  version: string;
}

interface VaultAddPayload {
  cn: string;
  description?: string;
  ipavaulttype?: "standard" | "symmetric" | "asymmetric";
  password?: string;
  ipavaultpublickey?: string;
}

interface VaultsSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

export interface VaultMemberPayload {
  entryName: string;
  entityType: string;
  idsToAdd: string[];
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of vault names, show the full data of those vaults
     * @param {VaultShowPayload} - Payload with vault names and options
     * @returns {BatchRPCResponse} - Batch response
     */
    getVaultsInfoByName: build.query<Vault[], VaultShowPayload>({
      query: (payload) => {
        const vaultNames = payload.vaultNamesList;
        const noMembers = payload.no_members || false;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const vaultShowCommands: Command[] = vaultNames.map((vaultName) => ({
          method: "vault_show",
          params: [[vaultName], { no_members: noMembers }],
        }));
        return getBatchCommand(vaultShowCommands, apiVersion);
      },
      transformResponse: (response: BatchRPCResponse): Vault[] => {
        const vaultList: Vault[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const vaultData = apiToVault(results[i].result);
          vaultList.push(vaultData);
        }
        return vaultList;
      },
    }),
    /**
     * Add a new vault via `vault_add`
     * @param {VaultAddPayload} - Payload with vault cn, optional description and type
     * @returns {FindRPCResponse} - Response from API
     */
    addVault: build.mutation<FindRPCResponse, VaultAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
        };
        if (payload.description) {
          params.description = payload.description;
        }
        if (payload.ipavaulttype) {
          params.ipavaulttype = payload.ipavaulttype;
        }
        if (payload.password) {
          params.password = payload.password;
        }
        if (payload.ipavaultpublickey) {
          params.ipavaultpublickey = payload.ipavaultpublickey;
        }
        return getCommand({
          method: "vault_add",
          params: [[payload.cn], params],
        });
      },
    }),
    /**
     * Delete vaults via batch `vault_del`
     * @param {Vault[]} - Array of vaults to delete
     * @returns {BatchRPCResponse} - Batch response
     */
    deleteVaults: build.mutation<BatchRPCResponse, Vault[]>({
      query: (vaults) => {
        const commands: Command[] = vaults.map((vault) => ({
          method: "vault_del",
          params: [[vault.cn], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    /**
     * Modify an existing vault via `vault_mod`
     * @param {Partial<Vault>} - Vault data to modify (must include cn)
     * @returns {FindRPCResponse} - Response from API
     */
    saveVault: build.mutation<FindRPCResponse, Partial<Vault>>({
      query: (vault) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...vault,
        };
        delete params.cn;
        return getCommand({
          method: "vault_mod",
          params: [[vault.cn], params],
        });
      },
    }),
    /**
     * Search vaults via two-step vault_find + vault_show pattern
     * @param {VaultsSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with vault data
     */
    searchVaultsEntries: build.mutation<BatchRPCResponse, VaultsSearchPayload>({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, sizeLimit, apiVersion, startIdx, stopIdx } =
          payloadData;

        const params = {
          pkey_only: true,
          sizelimit: sizeLimit,
          version: apiVersion,
          all: true,
        };

        // Step 1: Find vault IDs
        const findCommand: Command = {
          method: "vault_find",
          params: [[searchValue], params],
        };

        const findResult = await fetchWithBQ(getCommand(findCommand));
        if (findResult.error) {
          return { error: findResult.error as FetchBaseQueryError };
        }

        const findResponse = findResult.data as FindRPCResponse;
        const totalCount = findResponse.result.result.length as number;
        const ids: string[] = [];

        for (let i = startIdx; i < totalCount && i < stopIdx; i++) {
          const vaultId = findResponse.result.result[i] as cnType;
          ids.push(vaultId.cn[0] as string);
        }

        // Step 2: Batch show for each vault
        const showCommands: Command[] = ids.map((id) => ({
          method: "vault_show",
          params: [[id], { no_members: true }],
        }));

        const showResult = await fetchWithBQ(
          getBatchCommand(showCommands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = totalCount;
        }

        return response
          ? { data: response }
          : { error: showResult.error as FetchBaseQueryError };
      },
    }),
    /**
     * Get a single vault by cn (with members)
     * @param {string} cn - Vault cn
     * @returns {Vault} - Vault data with members
     */
    getVaultById: build.query<Vault, string>({
      query: (cn) => {
        return getCommand({
          method: "vault_show",
          params: [[cn], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): Vault => {
        return apiToVault(response.result.result);
      },
    }),
    /**
     * Add members to a vault
     * @param {VaultMemberPayload} - Payload with vault name, entity type, and IDs to add
     * @returns {FindRPCResponse} - Response from API
     */
    addMemberVault: build.mutation<FindRPCResponse, VaultMemberPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          [payload.entityType]: payload.idsToAdd,
        };
        return getCommand({
          method: "vault_add_member",
          params: [[payload.entryName], params],
        });
      },
    }),
    /**
     * Remove members from a vault
     * @param {VaultMemberPayload} - Payload with vault name, entity type, and IDs to remove
     * @returns {FindRPCResponse} - Response from API
     */
    removeMemberVault: build.mutation<FindRPCResponse, VaultMemberPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          [payload.entityType]: payload.idsToAdd,
        };
        return getCommand({
          method: "vault_remove_member",
          params: [[payload.entryName], params],
        });
      },
    }),
    /**
     * Add owners to a vault
     * @param {VaultMemberPayload} - Payload with vault name, entity type, and IDs to add
     * @returns {FindRPCResponse} - Response from API
     */
    addOwnerVault: build.mutation<FindRPCResponse, VaultMemberPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          [payload.entityType]: payload.idsToAdd,
        };
        return getCommand({
          method: "vault_add_owner",
          params: [[payload.entryName], params],
        });
      },
    }),
    /**
     * Remove owners from a vault
     * @param {VaultMemberPayload} - Payload with vault name, entity type, and IDs to remove
     * @returns {FindRPCResponse} - Response from API
     */
    removeOwnerVault: build.mutation<FindRPCResponse, VaultMemberPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          [payload.entityType]: payload.idsToAdd,
        };
        return getCommand({
          method: "vault_remove_owner",
          params: [[payload.entryName], params],
        });
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingVaultsQuery = (payloadData, options?) => {
  payloadData["objName"] = "vault";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData, options);
};

export const useVaultShowQuery = (vaultId: string) => {
  return useGetVaultsInfoByNameQuery(
    {
      vaultNamesList: [vaultId],
      no_members: true,
      version: API_VERSION_BACKUP,
    },
    { skip: !vaultId }
  );
};

export const {
  useGetVaultsInfoByNameQuery,
  useAddVaultMutation,
  useDeleteVaultsMutation,
  useSearchVaultsEntriesMutation,
  useSaveVaultMutation,
  useGetVaultByIdQuery,
  useAddMemberVaultMutation,
  useRemoveMemberVaultMutation,
  useAddOwnerVaultMutation,
  useRemoveOwnerVaultMutation,
} = extendedApi;
