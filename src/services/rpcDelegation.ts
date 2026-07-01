import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToDelegation } from "src/utils/delegationUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { DelegationPermission } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Delegation-related endpoints: getDelegationInfoByName, addDelegation,
 * deleteDelegations, saveDelegation, searchDelegationEntries, getDelegationById
 *
 * API commands:
 * - delegation_find: https://freeipa.readthedocs.io/en/latest/api/delegation_find.html
 * - delegation_show: https://freeipa.readthedocs.io/en/latest/api/delegation_show.html
 * - delegation_add: https://freeipa.readthedocs.io/en/latest/api/delegation_add.html
 * - delegation_del: https://freeipa.readthedocs.io/en/latest/api/delegation_del.html
 * - delegation_mod: https://freeipa.readthedocs.io/en/latest/api/delegation_mod.html
 */

interface DelegationShowPayload {
  delegationNamesList: string[];
  version: string;
}

interface DelegationAddPayload {
  aciname: string;
  group: string;
  memberof: string;
  permissions?: string[];
  attrs?: string[];
}

interface DelegationSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

interface acinameType {
  dn: string;
  aciname: string[];
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of delegation names, show the full data of those delegations
     * @param {DelegationShowPayload} - Payload with delegation names and options
     * @returns {BatchRPCResponse} - Batch response
     */
    getDelegationInfoByName: build.query<
      DelegationPermission[],
      DelegationShowPayload
    >({
      query: (payload) => {
        const delegationNames = payload.delegationNamesList;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const delegationShowCommands: Command[] = delegationNames.map(
          (delegationName) => ({
            method: "delegation_show",
            params: [[delegationName], {}],
          })
        );
        return getBatchCommand(delegationShowCommands, apiVersion);
      },
      transformResponse: (
        response: BatchRPCResponse
      ): DelegationPermission[] => {
        const delegationList: DelegationPermission[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const delegationData = apiToDelegation(results[i].result);
          delegationList.push(delegationData);
        }
        return delegationList;
      },
    }),
    /**
     * Add a new delegation via `delegation_add`
     * @param {DelegationAddPayload} - Payload with delegation data
     * @returns {FindRPCResponse} - Response from API
     */
    addDelegation: build.mutation<FindRPCResponse, DelegationAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          group: payload.group,
          memberof: payload.memberof,
        };
        if (payload.permissions && payload.permissions.length > 0) {
          params.permissions = payload.permissions;
        }
        if (payload.attrs && payload.attrs.length > 0) {
          params.attrs = payload.attrs;
        }
        return getCommand({
          method: "delegation_add",
          params: [[payload.aciname], params],
        });
      },
    }),
    /**
     * Delete delegations via batch `delegation_del`
     * @param {DelegationPermission[]} - Array of delegations to delete
     * @returns {BatchRPCResponse} - Batch response
     */
    deleteDelegations: build.mutation<
      BatchRPCResponse,
      DelegationPermission[]
    >({
      query: (delegations) => {
        const commands: Command[] = delegations.map((delegation) => ({
          method: "delegation_del",
          params: [[delegation.aciname], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    /**
     * Modify an existing delegation via `delegation_mod`
     * @param {Partial<DelegationPermission>} - Delegation data to modify (must include aciname)
     * @returns {FindRPCResponse} - Response from API
     */
    saveDelegation: build.mutation<
      FindRPCResponse,
      Partial<DelegationPermission>
    >({
      query: (delegation) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...delegation,
        };
        delete params.aciname;
        return getCommand({
          method: "delegation_mod",
          params: [[delegation.aciname], params],
        });
      },
    }),
    /**
     * Search delegations via two-step delegation_find + delegation_show pattern
     * @param {DelegationSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with delegation data
     */
    searchDelegationEntries: build.mutation<
      BatchRPCResponse,
      DelegationSearchPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, sizeLimit, apiVersion, startIdx, stopIdx } =
          payloadData;

        const params = {
          pkey_only: true,
          sizelimit: sizeLimit,
          version: apiVersion,
          all: true,
        };

        // Step 1: Find delegation IDs
        const findCommand: Command = {
          method: "delegation_find",
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
          const delegationId = findResponse.result.result[
            i
          ] as acinameType;
          ids.push(delegationId.aciname[0] as string);
        }

        // Step 2: Batch show for each delegation
        const showCommands: Command[] = ids.map((id) => ({
          method: "delegation_show",
          params: [[id], {}],
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
     * Get a single delegation by aciname
     * @param {string} aciname - Delegation aciname
     * @returns {DelegationPermission} - Delegation data
     */
    getDelegationById: build.query<DelegationPermission, string>({
      query: (aciname) => {
        return getCommand({
          method: "delegation_show",
          params: [[aciname], { all: true, rights: true }],
        });
      },
      transformResponse: (
        response: FindRPCResponse
      ): DelegationPermission => {
        return apiToDelegation(response.result.result);
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingDelegationQuery = (payloadData, options?) => {
  payloadData["objName"] = "delegation";
  payloadData["objAttr"] = "aciname";
  return useGettingGenericQuery(payloadData, options);
};

export const useDelegationShowQuery = (delegationId: string) => {
  return useGetDelegationInfoByNameQuery(
    {
      delegationNamesList: [delegationId],
      version: API_VERSION_BACKUP,
    },
    { skip: !delegationId }
  );
};

export const {
  useGetDelegationInfoByNameQuery,
  useAddDelegationMutation,
  useDeleteDelegationsMutation,
  useSearchDelegationEntriesMutation,
  useSaveDelegationMutation,
  useGetDelegationByIdQuery,
} = extendedApi;
