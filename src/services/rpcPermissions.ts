import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToPermission } from "src/utils/permissionsUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { Permission, cnType } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Permissions-related endpoints: getPermissionsInfoByName, addPermission,
 * deletePermissions, savePermission, searchPermissionsEntries, getPermissionById,
 * addAsMemberPermission, removeAsMemberPermission
 *
 * API commands:
 * - permission_find: https://freeipa.readthedocs.io/en/latest/api/permission_find.html
 * - permission_show: https://freeipa.readthedocs.io/en/latest/api/permission_show.html
 * - permission_add: https://freeipa.readthedocs.io/en/latest/api/permission_add.html
 * - permission_del: https://freeipa.readthedocs.io/en/latest/api/permission_del.html
 * - permission_mod: https://freeipa.readthedocs.io/en/latest/api/permission_mod.html
 * - permission_add_member: https://freeipa.readthedocs.io/en/latest/api/permission_add_member.html
 * - permission_remove_member: https://freeipa.readthedocs.io/en/latest/api/permission_remove_member.html
 */

interface PermissionShowPayload {
  permissionNamesList: string[];
  no_members?: boolean;
  version: string;
}

interface PermissionAddPayload {
  cn: string;
  description?: string;
  ipapermright?: string[];
  ipapermbindruletype?: string;
  type?: string;
  attrs?: string[];
}

interface PermissionsSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

export interface PermissionMemberPayload {
  entryName: string;
  entityType: string;
  idsToAdd: string[];
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of permission names, show the full data of those permissions
     * @param {PermissionShowPayload} - Payload with permission names and options
     * @returns {BatchRPCResponse} - Batch response
     */
    getPermissionsInfoByName: build.query<
      Permission[],
      PermissionShowPayload
    >({
      query: (payload) => {
        const permissionNames = payload.permissionNamesList;
        const noMembers = payload.no_members || false;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const permissionShowCommands: Command[] = permissionNames.map(
          (permissionName) => ({
            method: "permission_show",
            params: [[permissionName], { no_members: noMembers }],
          })
        );
        return getBatchCommand(permissionShowCommands, apiVersion);
      },
      transformResponse: (response: BatchRPCResponse): Permission[] => {
        const permissionList: Permission[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const permissionData = apiToPermission(results[i].result);
          permissionList.push(permissionData);
        }
        return permissionList;
      },
    }),
    /**
     * Add a new permission via `permission_add`
     * @param {PermissionAddPayload} - Payload with permission cn and optional fields
     * @returns {FindRPCResponse} - Response from API
     */
    addPermission: build.mutation<FindRPCResponse, PermissionAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
        };
        if (payload.description) {
          params.description = payload.description;
        }
        if (payload.ipapermright && payload.ipapermright.length > 0) {
          params.ipapermright = payload.ipapermright;
        }
        if (payload.ipapermbindruletype) {
          params.ipapermbindruletype = payload.ipapermbindruletype;
        }
        if (payload.type) {
          params.type = payload.type;
        }
        if (payload.attrs && payload.attrs.length > 0) {
          params.attrs = payload.attrs;
        }
        return getCommand({
          method: "permission_add",
          params: [[payload.cn], params],
        });
      },
    }),
    /**
     * Delete permissions via batch `permission_del`
     * @param {Permission[]} - Array of permissions to delete
     * @returns {BatchRPCResponse} - Batch response
     */
    deletePermissions: build.mutation<BatchRPCResponse, Permission[]>({
      query: (permissions) => {
        const commands: Command[] = permissions.map((permission) => ({
          method: "permission_del",
          params: [[permission.cn], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    /**
     * Modify an existing permission via `permission_mod`
     * @param {Partial<Permission>} - Permission data to modify (must include cn)
     * @returns {FindRPCResponse} - Response from API
     */
    savePermission: build.mutation<FindRPCResponse, Partial<Permission>>({
      query: (permission) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...permission,
        };
        delete params.cn;
        return getCommand({
          method: "permission_mod",
          params: [[permission.cn], params],
        });
      },
    }),
    /**
     * Search permissions via two-step permission_find + permission_show pattern
     * @param {PermissionsSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with permission data
     */
    searchPermissionsEntries: build.mutation<
      BatchRPCResponse,
      PermissionsSearchPayload
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

        // Step 1: Find permission IDs
        const findCommand: Command = {
          method: "permission_find",
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
          const permissionId = findResponse.result.result[i] as cnType;
          ids.push(permissionId.cn[0] as string);
        }

        // Step 2: Batch show for each permission
        const showCommands: Command[] = ids.map((id) => ({
          method: "permission_show",
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
     * Get a single permission by cn (with members)
     * @param {string} cn - Permission cn
     * @returns {Permission} - Permission data with members
     */
    getPermissionById: build.query<Permission, string>({
      query: (cn) => {
        return getCommand({
          method: "permission_show",
          params: [[cn], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): Permission => {
        return apiToPermission(response.result.result);
      },
    }),
    /**
     * Add members to a permission (privileges)
     * @param {PermissionMemberPayload} - Payload with permission name, entity type, and IDs to add
     * @returns {FindRPCResponse} - Response from API
     */
    addAsMemberPermission: build.mutation<
      FindRPCResponse,
      PermissionMemberPayload
    >({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          [payload.entityType]: payload.idsToAdd,
        };
        return getCommand({
          method: "permission_add_member",
          params: [[payload.entryName], params],
        });
      },
    }),
    /**
     * Remove members from a permission (privileges)
     * @param {PermissionMemberPayload} - Payload with permission name, entity type, and IDs to remove
     * @returns {FindRPCResponse} - Response from API
     */
    removeAsMemberPermission: build.mutation<
      FindRPCResponse,
      PermissionMemberPayload
    >({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          [payload.entityType]: payload.idsToAdd,
        };
        return getCommand({
          method: "permission_remove_member",
          params: [[payload.entryName], params],
        });
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingPermissionsQuery = (payloadData, options?) => {
  payloadData["objName"] = "permission";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData, options);
};

export const usePermissionShowQuery = (permissionId: string) => {
  return useGetPermissionsInfoByNameQuery(
    {
      permissionNamesList: [permissionId],
      no_members: true,
      version: API_VERSION_BACKUP,
    },
    { skip: !permissionId }
  );
};

export const {
  useGetPermissionsInfoByNameQuery,
  useAddPermissionMutation,
  useDeletePermissionsMutation,
  useSearchPermissionsEntriesMutation,
  useSavePermissionMutation,
  useGetPermissionByIdQuery,
  useAddAsMemberPermissionMutation,
  useRemoveAsMemberPermissionMutation,
} = extendedApi;
