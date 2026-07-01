import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToTopologySuffix } from "src/utils/topologyUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { TopologySuffix, cnType } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * TopologySuffixes-related endpoints
 *
 * API commands:
 * - topologysuffix_find: https://freeipa.readthedocs.io/en/latest/api/topologysuffix_find.html
 * - topologysuffix_show: https://freeipa.readthedocs.io/en/latest/api/topologysuffix_show.html
 * - topologysuffix_mod: https://freeipa.readthedocs.io/en/latest/api/topologysuffix_mod.html
 */

interface TopologySuffixShowPayload {
  suffixNamesList: string[];
  no_members?: boolean;
  version: string;
}

interface TopologySuffixesSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of topology suffix names, show the full data of those suffixes
     * @param {TopologySuffixShowPayload} - Payload with suffix names and options
     * @returns {BatchRPCResponse} - Batch response
     */
    getTopologySuffixesInfoByName: build.query<
      TopologySuffix[],
      TopologySuffixShowPayload
    >({
      query: (payload) => {
        const suffixNames = payload.suffixNamesList;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const suffixShowCommands: Command[] = suffixNames.map(
          (suffixName) => ({
            method: "topologysuffix_show",
            params: [[suffixName], {}],
          })
        );
        return getBatchCommand(suffixShowCommands, apiVersion);
      },
      transformResponse: (response: BatchRPCResponse): TopologySuffix[] => {
        const suffixList: TopologySuffix[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const suffixData = apiToTopologySuffix(results[i].result);
          suffixList.push(suffixData);
        }
        return suffixList;
      },
    }),
    /**
     * Modify an existing topology suffix via `topologysuffix_mod`
     * @param {Partial<TopologySuffix>} - Suffix data to modify (must include cn)
     * @returns {FindRPCResponse} - Response from API
     */
    saveTopologySuffix: build.mutation<
      FindRPCResponse,
      Partial<TopologySuffix>
    >({
      query: (suffix) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...suffix,
        };
        delete params.cn;
        return getCommand({
          method: "topologysuffix_mod",
          params: [[suffix.cn], params],
        });
      },
    }),
    /**
     * Search topology suffixes via two-step topologysuffix_find + topologysuffix_show pattern
     * @param {TopologySuffixesSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with suffix data
     */
    searchTopologySuffixesEntries: build.mutation<
      BatchRPCResponse,
      TopologySuffixesSearchPayload
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

        // Step 1: Find suffix IDs
        const findCommand: Command = {
          method: "topologysuffix_find",
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
          const suffixId = findResponse.result.result[i] as cnType;
          ids.push(suffixId.cn[0] as string);
        }

        // Step 2: Batch show for each suffix
        const showCommands: Command[] = ids.map((id) => ({
          method: "topologysuffix_show",
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
     * Get a single topology suffix by cn
     * @param {string} cn - Suffix cn
     * @returns {TopologySuffix} - Suffix data
     */
    getTopologySuffixById: build.query<TopologySuffix, string>({
      query: (cn) => {
        return getCommand({
          method: "topologysuffix_show",
          params: [[cn], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): TopologySuffix => {
        return apiToTopologySuffix(response.result.result);
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingTopologySuffixesQuery = (payloadData, options?) => {
  payloadData["objName"] = "topologysuffix";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData, options);
};

export const useTopologySuffixShowQuery = (suffixId: string) => {
  return useGetTopologySuffixesInfoByNameQuery(
    {
      suffixNamesList: [suffixId],
      version: API_VERSION_BACKUP,
    },
    { skip: !suffixId }
  );
};

export const {
  useGetTopologySuffixesInfoByNameQuery,
  useSaveTopologySuffixMutation,
  useSearchTopologySuffixesEntriesMutation,
  useGetTopologySuffixByIdQuery,
} = extendedApi;
