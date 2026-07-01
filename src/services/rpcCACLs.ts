import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToCACL } from "src/utils/caclsUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { CertACL, cnType } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * CA ACL-related endpoints: getCACLsInfoByName, addCACL, deleteCACLs,
 * saveCACL, searchCACLsEntries, getCACLById, enableCACL, disableCACL
 *
 * API commands:
 * - caacl_find: https://freeipa.readthedocs.io/en/latest/api/caacl_find.html
 * - caacl_show: https://freeipa.readthedocs.io/en/latest/api/caacl_show.html
 * - caacl_add: https://freeipa.readthedocs.io/en/latest/api/caacl_add.html
 * - caacl_del: https://freeipa.readthedocs.io/en/latest/api/caacl_del.html
 * - caacl_mod: https://freeipa.readthedocs.io/en/latest/api/caacl_mod.html
 * - caacl_enable: https://freeipa.readthedocs.io/en/latest/api/caacl_enable.html
 * - caacl_disable: https://freeipa.readthedocs.io/en/latest/api/caacl_disable.html
 */

interface CACLInfoPayload {
  caclNamesList: string[];
  no_members?: boolean;
  version?: string;
}

interface CACLAddPayload {
  cn: string;
  description?: string;
}

interface CACLsSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of CA ACL names, show the full data of those CA ACLs
     * @param {CACLInfoPayload} - Payload with CA ACL names and options
     * @returns {BatchRPCResponse} - Batch response
     */
    getCACLsInfoByName: build.query<CertACL[], CACLInfoPayload>({
      query: (payload) => {
        const caclNames = payload.caclNamesList;
        const noMembers = payload.no_members || false;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const caclShowCommands: Command[] = caclNames.map((caclName) => ({
          method: "caacl_show",
          params: [[caclName], { no_members: noMembers }],
        }));
        return getBatchCommand(caclShowCommands, apiVersion);
      },
      transformResponse: (response: BatchRPCResponse): CertACL[] => {
        const caclList: CertACL[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const caclData = apiToCACL(results[i].result);
          caclList.push(caclData);
        }
        return caclList;
      },
    }),
    /**
     * Add a new CA ACL via `caacl_add`
     * @param {CACLAddPayload} - Payload with CA ACL cn and optional description
     * @returns {FindRPCResponse} - Response from API
     */
    addCACL: build.mutation<FindRPCResponse, CACLAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
        };
        if (payload.description) {
          params.description = payload.description;
        }
        return getCommand({
          method: "caacl_add",
          params: [[payload.cn], params],
        });
      },
    }),
    /**
     * Delete CA ACLs via batch `caacl_del`
     * @param {CertACL[]} - Array of CA ACLs to delete
     * @returns {BatchRPCResponse} - Batch response
     */
    deleteCACLs: build.mutation<BatchRPCResponse, CertACL[]>({
      query: (cacls) => {
        const commands: Command[] = cacls.map((cacl) => ({
          method: "caacl_del",
          params: [[cacl.cn], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    /**
     * Modify an existing CA ACL via `caacl_mod`
     * @param {Partial<CertACL>} - CA ACL data to modify (must include cn)
     * @returns {FindRPCResponse} - Response from API
     */
    saveCACL: build.mutation<FindRPCResponse, Partial<CertACL>>({
      query: (cacl) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...cacl,
        };
        delete params.cn;
        return getCommand({
          method: "caacl_mod",
          params: [[cacl.cn], params],
        });
      },
    }),
    /**
     * Search CA ACLs via two-step caacl_find + caacl_show pattern
     * @param {CACLsSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with CA ACL data
     */
    searchCACLsEntries: build.mutation<BatchRPCResponse, CACLsSearchPayload>({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, sizeLimit, apiVersion, startIdx, stopIdx } =
          payloadData;

        const params = {
          pkey_only: true,
          sizelimit: sizeLimit,
          version: apiVersion,
          all: true,
        };

        // Step 1: Find CA ACL IDs
        const findCommand: Command = {
          method: "caacl_find",
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
          const caclId = findResponse.result.result[i] as cnType;
          ids.push(caclId.cn[0] as string);
        }

        // Step 2: Batch show for each CA ACL
        const showCommands: Command[] = ids.map((id) => ({
          method: "caacl_show",
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
     * Get a single CA ACL by cn (with members)
     * @param {string} cn - CA ACL cn
     * @returns {CertACL} - CA ACL data with members
     */
    getCACLById: build.query<CertACL, string>({
      query: (cn) => {
        return getCommand({
          method: "caacl_show",
          params: [[cn], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): CertACL => {
        return apiToCACL(response.result.result);
      },
    }),
    /**
     * Enable a CA ACL via `caacl_enable`
     * @param {CertACL} - CA ACL to enable
     * @returns {FindRPCResponse} - Response from API
     */
    enableCACL: build.mutation<FindRPCResponse, CertACL>({
      query: (cacl) => {
        const params = [
          [cacl.cn],
          {
            version: API_VERSION_BACKUP,
          },
        ];

        return getCommand({
          method: "caacl_enable",
          params: params,
        });
      },
    }),
    /**
     * Disable a CA ACL via `caacl_disable`
     * @param {CertACL} - CA ACL to disable
     * @returns {FindRPCResponse} - Response from API
     */
    disableCACL: build.mutation<FindRPCResponse, CertACL>({
      query: (cacl) => {
        const params = [
          [cacl.cn],
          {
            version: API_VERSION_BACKUP,
          },
        ];

        return getCommand({
          method: "caacl_disable",
          params: params,
        });
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingCACLsQuery = (payloadData, options?) => {
  payloadData["objName"] = "caacl";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData, options);
};

export const useCACLShowQuery = (caclId: string) => {
  return useGetCACLsInfoByNameQuery(
    {
      caclNamesList: [caclId],
      no_members: true,
      version: API_VERSION_BACKUP,
    },
    { skip: !caclId }
  );
};

export const {
  useGetCACLsInfoByNameQuery,
  useAddCACLMutation,
  useDeleteCACLsMutation,
  useSearchCACLsEntriesMutation,
  useSaveCACLMutation,
  useGetCACLByIdQuery,
  useEnableCACLMutation,
  useDisableCACLMutation,
} = extendedApi;
