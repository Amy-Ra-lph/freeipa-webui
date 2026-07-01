import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToSelfService } from "src/utils/selfServiceUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import {
  SelfServicePermission,
  acinameType,
} from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Self-service permission-related endpoints
 *
 * API commands:
 * - selfservice_find: https://freeipa.readthedocs.io/en/latest/api/selfservice_find.html
 * - selfservice_show: https://freeipa.readthedocs.io/en/latest/api/selfservice_show.html
 * - selfservice_add: https://freeipa.readthedocs.io/en/latest/api/selfservice_add.html
 * - selfservice_del: https://freeipa.readthedocs.io/en/latest/api/selfservice_del.html
 * - selfservice_mod: https://freeipa.readthedocs.io/en/latest/api/selfservice_mod.html
 */

interface SelfServiceShowPayload {
  selfServiceNamesList: string[];
  version: string;
}

interface SelfServiceAddPayload {
  aciname: string;
  attrs: string[];
}

interface SelfServiceSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of self-service permission names, show their full data
     * @param {SelfServiceShowPayload} - Payload with names and options
     * @returns {BatchRPCResponse} - Batch response
     */
    getSelfServiceInfoByName: build.query<
      SelfServicePermission[],
      SelfServiceShowPayload
    >({
      query: (payload) => {
        const names = payload.selfServiceNamesList;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const showCommands: Command[] = names.map((name) => ({
          method: "selfservice_show",
          params: [[name], {}],
        }));
        return getBatchCommand(showCommands, apiVersion);
      },
      transformResponse: (
        response: BatchRPCResponse
      ): SelfServicePermission[] => {
        const list: SelfServicePermission[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const data = apiToSelfService(results[i].result);
          list.push(data);
        }
        return list;
      },
    }),
    /**
     * Add a new self-service permission via `selfservice_add`
     * @param {SelfServiceAddPayload} - Payload with aciname and attrs
     * @returns {FindRPCResponse} - Response from API
     */
    addSelfService: build.mutation<FindRPCResponse, SelfServiceAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          attrs: payload.attrs,
        };
        return getCommand({
          method: "selfservice_add",
          params: [[payload.aciname], params],
        });
      },
    }),
    /**
     * Delete self-service permissions via batch `selfservice_del`
     * @param {SelfServicePermission[]} - Array of self-service permissions to delete
     * @returns {BatchRPCResponse} - Batch response
     */
    deleteSelfServices: build.mutation<
      BatchRPCResponse,
      SelfServicePermission[]
    >({
      query: (selfServices) => {
        const commands: Command[] = selfServices.map((ss) => ({
          method: "selfservice_del",
          params: [[ss.aciname], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    /**
     * Modify an existing self-service permission via `selfservice_mod`
     * @param {Partial<SelfServicePermission>} - Data to modify (must include aciname)
     * @returns {FindRPCResponse} - Response from API
     */
    saveSelfService: build.mutation<
      FindRPCResponse,
      Partial<SelfServicePermission>
    >({
      query: (selfService) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...selfService,
        };
        delete params.aciname;
        return getCommand({
          method: "selfservice_mod",
          params: [[selfService.aciname], params],
        });
      },
    }),
    /**
     * Search self-service permissions via two-step selfservice_find + selfservice_show
     * @param {SelfServiceSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with data
     */
    searchSelfServiceEntries: build.mutation<
      BatchRPCResponse,
      SelfServiceSearchPayload
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

        // Step 1: Find self-service permission IDs
        const findCommand: Command = {
          method: "selfservice_find",
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
          const item = findResponse.result.result[i] as acinameType;
          ids.push(item.aciname[0] as string);
        }

        // Step 2: Batch show for each self-service permission
        const showCommands: Command[] = ids.map((id) => ({
          method: "selfservice_show",
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
     * Get a single self-service permission by aciname
     * @param {string} aciname - Self-service permission name
     * @returns {SelfServicePermission} - Self-service permission data
     */
    getSelfServiceById: build.query<SelfServicePermission, string>({
      query: (aciname) => {
        return getCommand({
          method: "selfservice_show",
          params: [[aciname], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): SelfServicePermission => {
        return apiToSelfService(response.result.result);
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingSelfServiceQuery = (payloadData, options?) => {
  payloadData["objName"] = "selfservice";
  payloadData["objAttr"] = "aciname";
  return useGettingGenericQuery(payloadData, options);
};

export const useSelfServiceShowQuery = (aciname: string) => {
  return useGetSelfServiceInfoByNameQuery(
    {
      selfServiceNamesList: [aciname],
      version: API_VERSION_BACKUP,
    },
    { skip: !aciname }
  );
};

export const {
  useGetSelfServiceInfoByNameQuery,
  useAddSelfServiceMutation,
  useDeleteSelfServicesMutation,
  useSearchSelfServiceEntriesMutation,
  useSaveSelfServiceMutation,
  useGetSelfServiceByIdQuery,
} = extendedApi;
