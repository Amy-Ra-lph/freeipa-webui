import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToRadiusServer } from "src/utils/radiusServersUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { RadiusServer, cnType } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * RADIUS Servers-related endpoints: getRadiusServersInfoByName, addRadiusServer,
 * deleteRadiusServers, saveRadiusServer, searchRadiusServersEntries, getRadiusServerById
 *
 * API commands:
 * - radiusproxy_find: https://freeipa.readthedocs.io/en/latest/api/radiusproxy_find.html
 * - radiusproxy_show: https://freeipa.readthedocs.io/en/latest/api/radiusproxy_show.html
 * - radiusproxy_add: https://freeipa.readthedocs.io/en/latest/api/radiusproxy_add.html
 * - radiusproxy_del: https://freeipa.readthedocs.io/en/latest/api/radiusproxy_del.html
 * - radiusproxy_mod: https://freeipa.readthedocs.io/en/latest/api/radiusproxy_mod.html
 */

interface RadiusServerShowPayload {
  radiusServerNamesList: string[];
  no_members?: boolean;
  version: string;
}

interface RadiusServerAddPayload {
  cn: string;
  ipatokenradiusserver: string;
  ipatokenradiussecret: string;
}

interface RadiusServersSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of RADIUS server names, show the full data of those servers
     * @param {RadiusServerShowPayload} - Payload with server names and options
     * @returns {BatchRPCResponse} - Batch response
     */
    getRadiusServersInfoByName: build.query<
      RadiusServer[],
      RadiusServerShowPayload
    >({
      query: (payload) => {
        const serverNames = payload.radiusServerNamesList;
        const noMembers = payload.no_members || false;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const showCommands: Command[] = serverNames.map((serverName) => ({
          method: "radiusproxy_show",
          params: [[serverName], { no_members: noMembers }],
        }));
        return getBatchCommand(showCommands, apiVersion);
      },
      transformResponse: (response: BatchRPCResponse): RadiusServer[] => {
        const serverList: RadiusServer[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const serverData = apiToRadiusServer(results[i].result);
          serverList.push(serverData);
        }
        return serverList;
      },
    }),
    /**
     * Add a new RADIUS server via `radiusproxy_add`
     * @param {RadiusServerAddPayload} - Payload with cn, server, and secret
     * @returns {FindRPCResponse} - Response from API
     */
    addRadiusServer: build.mutation<FindRPCResponse, RadiusServerAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          ipatokenradiusserver: payload.ipatokenradiusserver,
          ipatokenradiussecret: payload.ipatokenradiussecret,
        };
        return getCommand({
          method: "radiusproxy_add",
          params: [[payload.cn], params],
        });
      },
    }),
    /**
     * Delete RADIUS servers via batch `radiusproxy_del`
     * @param {RadiusServer[]} - Array of servers to delete
     * @returns {BatchRPCResponse} - Batch response
     */
    deleteRadiusServers: build.mutation<BatchRPCResponse, RadiusServer[]>({
      query: (servers) => {
        const commands: Command[] = servers.map((server) => ({
          method: "radiusproxy_del",
          params: [[server.cn], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    /**
     * Modify an existing RADIUS server via `radiusproxy_mod`
     * @param {Partial<RadiusServer>} - Server data to modify (must include cn)
     * @returns {FindRPCResponse} - Response from API
     */
    saveRadiusServer: build.mutation<FindRPCResponse, Partial<RadiusServer>>({
      query: (server) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...server,
        };
        delete params.cn;
        return getCommand({
          method: "radiusproxy_mod",
          params: [[server.cn], params],
        });
      },
    }),
    /**
     * Search RADIUS servers via two-step radiusproxy_find + radiusproxy_show pattern
     * @param {RadiusServersSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with server data
     */
    searchRadiusServersEntries: build.mutation<
      BatchRPCResponse,
      RadiusServersSearchPayload
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

        // Step 1: Find server IDs
        const findCommand: Command = {
          method: "radiusproxy_find",
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
          const serverId = findResponse.result.result[i] as cnType;
          ids.push(serverId.cn[0] as string);
        }

        // Step 2: Batch show for each server
        const showCommands: Command[] = ids.map((id) => ({
          method: "radiusproxy_show",
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
     * Get a single RADIUS server by cn
     * @param {string} cn - Server cn
     * @returns {RadiusServer} - Server data
     */
    getRadiusServerById: build.query<RadiusServer, string>({
      query: (cn) => {
        return getCommand({
          method: "radiusproxy_show",
          params: [[cn], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): RadiusServer => {
        return apiToRadiusServer(response.result.result);
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingRadiusServersQuery = (payloadData, options?) => {
  payloadData["objName"] = "radiusproxy";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData, options);
};

export const useRadiusServerShowQuery = (serverId: string) => {
  return useGetRadiusServersInfoByNameQuery(
    {
      radiusServerNamesList: [serverId],
      no_members: true,
      version: API_VERSION_BACKUP,
    },
    { skip: !serverId }
  );
};

export const {
  useGetRadiusServersInfoByNameQuery,
  useAddRadiusServerMutation,
  useDeleteRadiusServersMutation,
  useSearchRadiusServersEntriesMutation,
  useSaveRadiusServerMutation,
  useGetRadiusServerByIdQuery,
} = extendedApi;
