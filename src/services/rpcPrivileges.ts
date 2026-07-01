import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToPrivilege } from "src/utils/privilegesUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { Privilege, cnType } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Privileges-related endpoints: addToPrivileges, removeFromPrivileges,
 * getPrivilegesInfoByName, addPrivilege, deletePrivileges
 *
 * API commands:
 * - privilege_find: https://freeipa.readthedocs.io/en/latest/api/privilege_find.html
 * - privilege_show: https://freeipa.readthedocs.io/en/latest/api/privilege_show.html
 * - privilege_add: https://freeipa.readthedocs.io/en/latest/api/privilege_add.html
 * - privilege_del: https://freeipa.readthedocs.io/en/latest/api/privilege_del.html
 * - privilege_add_member: https://freeipa.readthedocs.io/en/latest/api/privilege_add_member.html
 * - privilege_remove_member: https://freeipa.readthedocs.io/en/latest/api/privilege_remove_member.html
 */

interface PrivilegeShowPayload {
  privilegeNamesList: string[];
  no_members?: boolean;
  version: string;
}

interface PrivilegeAddPayload {
  cn: string;
  description?: string;
}

interface PrivilegesSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

export interface PrivilegeMemberPayload {
  entryName: string;
  entityType: string;
  idsToAdd: string[];
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    addToPrivileges: build.mutation<
      BatchRPCResponse,
      [string, string, string[]]
    >({
      query: (payload) => {
        const memberId = payload[0];
        const memberType = payload[1];
        const privilegeNames = payload[2];
        const membersToAdd: Command[] = [];
        privilegeNames.map((privilegeName) => {
          const payloadItem = {
            method: "privilege_add_member",
            params: [[privilegeName], { [memberType]: memberId }],
          } as Command;
          membersToAdd.push(payloadItem);
        });
        return getBatchCommand(membersToAdd, API_VERSION_BACKUP);
      },
    }),
    removeFromPrivileges: build.mutation<
      BatchRPCResponse,
      [string, string, string[]]
    >({
      query: (payload) => {
        const memberId = payload[0];
        const memberType = payload[1];
        const listOfPrivileges = payload[2];
        const membersToRemove: Command[] = [];
        listOfPrivileges.map((privilege) => {
          const payloadItem: Command = {
            method: "privilege_remove_member",
            params: [[privilege], { [memberType]: memberId }],
          };
          membersToRemove.push(payloadItem);
        });
        return getBatchCommand(membersToRemove, API_VERSION_BACKUP);
      },
    }),
    getPrivilegesInfoByName: build.query<Privilege[], PrivilegeShowPayload>({
      query: (payload) => {
        const privilegeNames = payload.privilegeNamesList;
        const noMembers = payload.no_members || false;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const privilegeShowCommands: Command[] = privilegeNames.map(
          (privilegeName) => ({
            method: "privilege_show",
            params: [[privilegeName], { no_members: noMembers }],
          })
        );
        return getBatchCommand(privilegeShowCommands, apiVersion);
      },
      transformResponse: (response: BatchRPCResponse): Privilege[] => {
        const privilegeList: Privilege[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const privilegeData = apiToPrivilege(results[i].result);
          privilegeList.push(privilegeData);
        }
        return privilegeList;
      },
    }),
    addPrivilege: build.mutation<FindRPCResponse, PrivilegeAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
        };
        if (payload.description) {
          params.description = payload.description;
        }
        return getCommand({
          method: "privilege_add",
          params: [[payload.cn], params],
        });
      },
    }),
    deletePrivileges: build.mutation<BatchRPCResponse, Privilege[]>({
      query: (privileges) => {
        const commands: Command[] = privileges.map((privilege) => ({
          method: "privilege_del",
          params: [[privilege.cn], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    savePrivilege: build.mutation<FindRPCResponse, Partial<Privilege>>({
      query: (privilege) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...privilege,
        };
        delete params.cn;
        return getCommand({
          method: "privilege_mod",
          params: [[privilege.cn], params],
        });
      },
    }),
    searchPrivilegesEntries: build.mutation<
      BatchRPCResponse,
      PrivilegesSearchPayload
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

        // Step 1: Find privilege IDs
        const findCommand: Command = {
          method: "privilege_find",
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
          const privilegeId = findResponse.result.result[i] as cnType;
          ids.push(privilegeId.cn[0] as string);
        }

        // Step 2: Batch show for each privilege
        const showCommands: Command[] = ids.map((id) => ({
          method: "privilege_show",
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
    getPrivilegeById: build.query<Privilege, string>({
      query: (cn) => {
        return getCommand({
          method: "privilege_show",
          params: [[cn], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): Privilege => {
        return apiToPrivilege(response.result.result);
      },
    }),
    addAsMemberPrivilege: build.mutation<
      FindRPCResponse,
      PrivilegeMemberPayload
    >({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          [payload.entityType]: payload.idsToAdd,
        };
        return getCommand({
          method: "privilege_add_member",
          params: [[payload.entryName], params],
        });
      },
    }),
    removeAsMemberPrivilege: build.mutation<
      FindRPCResponse,
      PrivilegeMemberPayload
    >({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          [payload.entityType]: payload.idsToAdd,
        };
        return getCommand({
          method: "privilege_remove_member",
          params: [[payload.entryName], params],
        });
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingPrivilegesQuery = (payloadData, options?) => {
  payloadData["objName"] = "privilege";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData, options);
};

export const usePrivilegeShowQuery = (privilegeId: string) => {
  return useGetPrivilegesInfoByNameQuery(
    {
      privilegeNamesList: [privilegeId],
      no_members: true,
      version: API_VERSION_BACKUP,
    },
    { skip: !privilegeId }
  );
};

export const {
  useAddToPrivilegesMutation,
  useRemoveFromPrivilegesMutation,
  useGetPrivilegesInfoByNameQuery,
  useAddPrivilegeMutation,
  useDeletePrivilegesMutation,
  useSearchPrivilegesEntriesMutation,
  useSavePrivilegeMutation,
  useGetPrivilegeByIdQuery,
  useAddAsMemberPrivilegeMutation,
  useRemoveAsMemberPrivilegeMutation,
} = extendedApi;
