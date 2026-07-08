import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchResponse,
  BatchRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import {
  apiToOAuth2Delegation,
  apiToOAuth2Client,
  apiToOAuth2Scope,
  apiToOAuth2Workload,
} from "src/utils/oauth2Utils";
import { API_VERSION_BACKUP } from "../utils/utils";
import {
  OAuth2Delegation,
  OAuth2Client,
  OAuth2Scope,
  OAuth2Workload,
} from "../utils/datatypes/globalDataTypes";

/**
 * OAuth2-related endpoints
 *
 * API commands:
 * - oauth2delegation_show, oauth2delegation_add, oauth2delegation_mod, oauth2delegation_del
 * - oauth2client_show, oauth2client_add, oauth2client_mod, oauth2client_del
 * - oauth2scope_show, oauth2scope_add, oauth2scope_mod, oauth2scope_del
 * - oauth2workload_show, oauth2workload_add, oauth2workload_mod, oauth2workload_del
 */

type DelegationFullData = {
  delegation?: Partial<OAuth2Delegation>;
};

type ClientFullData = {
  client?: Partial<OAuth2Client>;
};

type ScopeFullData = {
  scope?: Partial<OAuth2Scope>;
};

type WorkloadFullData = {
  workload?: Partial<OAuth2Workload>;
};

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    // OAuth2Delegation endpoints
    getDelegationFullData: build.query<DelegationFullData, string>({
      query: (delegationId) => {
        const delegation_params = {
          all: true,
          rights: true,
        };

        const delegationShowCommand: Command = {
          method: "oauth2delegation_show",
          params: [[delegationId], delegation_params],
        };

        const batchPayload: Command[] = [delegationShowCommand];

        return getBatchCommand(batchPayload, API_VERSION_BACKUP);
      },
      transformResponse: (response: BatchResponse): DelegationFullData => {
        const [delegationResponse] = response.result.results;

        const delegationData = delegationResponse.result;
        let delegationObject = {};
        if (!delegationResponse.error) {
          delegationObject = apiToOAuth2Delegation(delegationData);
        }

        return {
          delegation: delegationObject,
        };
      },
      providesTags: ["FullOAuth2Delegation"],
    }),
    addDelegation: build.mutation<BatchRPCResponse, [string, string]>({
      query: (payload) => {
        const params = [
          [payload[0]],
          {
            description: payload[1],
            version: API_VERSION_BACKUP,
          },
        ];
        return getCommand({
          method: "oauth2delegation_add",
          params: params,
        });
      },
    }),
    saveDelegation: build.mutation<
      BatchRPCResponse,
      Partial<OAuth2Delegation>
    >({
      query: (delegation) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...delegation,
        };
        delete params["cn"];
        return getCommand({
          method: "oauth2delegation_mod",
          params: [[delegation.cn], params],
        });
      },
      invalidatesTags: ["FullOAuth2Delegation"],
    }),
    removeDelegations: build.mutation<BatchRPCResponse, OAuth2Delegation[]>({
      query: (delegations) => {
        const delegationsToDeletePayload: Command[] = [];
        delegations.map((delegation) => {
          const payloadItem = {
            method: "oauth2delegation_del",
            params: [[delegation.cn], {}],
          } as Command;
          delegationsToDeletePayload.push(payloadItem);
        });
        return getBatchCommand(delegationsToDeletePayload, API_VERSION_BACKUP);
      },
    }),
    enableDelegations: build.mutation<BatchRPCResponse, string[]>({
      query: (ids) => {
        const commands: Command[] = ids.map((id) => ({
          method: "oauth2delegation_mod",
          params: [[id], { oauth2enabled: true }],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    disableDelegations: build.mutation<BatchRPCResponse, string[]>({
      query: (ids) => {
        const commands: Command[] = ids.map((id) => ({
          method: "oauth2delegation_mod",
          params: [[id], { oauth2enabled: false }],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),

    // OAuth2Client endpoints
    getClientFullData: build.query<ClientFullData, string>({
      query: (clientId) => {
        const client_params = {
          all: true,
          rights: true,
        };

        const clientShowCommand: Command = {
          method: "oauth2client_show",
          params: [[clientId], client_params],
        };

        const batchPayload: Command[] = [clientShowCommand];

        return getBatchCommand(batchPayload, API_VERSION_BACKUP);
      },
      transformResponse: (response: BatchResponse): ClientFullData => {
        const [clientResponse] = response.result.results;

        const clientData = clientResponse.result;
        let clientObject = {};
        if (!clientResponse.error) {
          clientObject = apiToOAuth2Client(clientData);
        }

        return {
          client: clientObject,
        };
      },
      providesTags: ["FullOAuth2Client"],
    }),
    addClient: build.mutation<BatchRPCResponse, [string, string]>({
      query: (payload) => {
        const params = [
          [payload[0]],
          {
            description: payload[1],
            version: API_VERSION_BACKUP,
          },
        ];
        return getCommand({
          method: "oauth2client_add",
          params: params,
        });
      },
    }),
    saveClient: build.mutation<BatchRPCResponse, Partial<OAuth2Client>>({
      query: (client) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...client,
        };
        delete params["cn"];
        return getCommand({
          method: "oauth2client_mod",
          params: [[client.cn], params],
        });
      },
      invalidatesTags: ["FullOAuth2Client"],
    }),
    removeClients: build.mutation<BatchRPCResponse, OAuth2Client[]>({
      query: (clients) => {
        const clientsToDeletePayload: Command[] = [];
        clients.map((client) => {
          const payloadItem = {
            method: "oauth2client_del",
            params: [[client.cn], {}],
          } as Command;
          clientsToDeletePayload.push(payloadItem);
        });
        return getBatchCommand(clientsToDeletePayload, API_VERSION_BACKUP);
      },
    }),

    // OAuth2Scope endpoints
    getScopeFullData: build.query<ScopeFullData, string>({
      query: (scopeId) => {
        const scope_params = {
          all: true,
          rights: true,
        };

        const scopeShowCommand: Command = {
          method: "oauth2scope_show",
          params: [[scopeId], scope_params],
        };

        const batchPayload: Command[] = [scopeShowCommand];

        return getBatchCommand(batchPayload, API_VERSION_BACKUP);
      },
      transformResponse: (response: BatchResponse): ScopeFullData => {
        const [scopeResponse] = response.result.results;

        const scopeData = scopeResponse.result;
        let scopeObject = {};
        if (!scopeResponse.error) {
          scopeObject = apiToOAuth2Scope(scopeData);
        }

        return {
          scope: scopeObject,
        };
      },
      providesTags: ["FullOAuth2Scope"],
    }),
    addScope: build.mutation<BatchRPCResponse, [string, string]>({
      query: (payload) => {
        const params = [
          [payload[0]],
          {
            description: payload[1],
            version: API_VERSION_BACKUP,
          },
        ];
        return getCommand({
          method: "oauth2scope_add",
          params: params,
        });
      },
    }),
    saveScope: build.mutation<BatchRPCResponse, Partial<OAuth2Scope>>({
      query: (scope) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...scope,
        };
        delete params["cn"];
        return getCommand({
          method: "oauth2scope_mod",
          params: [[scope.cn], params],
        });
      },
      invalidatesTags: ["FullOAuth2Scope"],
    }),
    removeScopes: build.mutation<BatchRPCResponse, OAuth2Scope[]>({
      query: (scopes) => {
        const scopesToDeletePayload: Command[] = [];
        scopes.map((scope) => {
          const payloadItem = {
            method: "oauth2scope_del",
            params: [[scope.cn], {}],
          } as Command;
          scopesToDeletePayload.push(payloadItem);
        });
        return getBatchCommand(scopesToDeletePayload, API_VERSION_BACKUP);
      },
    }),

    // OAuth2Workload endpoints
    getWorkloadFullData: build.query<WorkloadFullData, string>({
      query: (workloadId) => {
        const workload_params = {
          all: true,
          rights: true,
        };

        const workloadShowCommand: Command = {
          method: "oauth2workload_show",
          params: [[workloadId], workload_params],
        };

        const batchPayload: Command[] = [workloadShowCommand];

        return getBatchCommand(batchPayload, API_VERSION_BACKUP);
      },
      transformResponse: (response: BatchResponse): WorkloadFullData => {
        const [workloadResponse] = response.result.results;

        const workloadData = workloadResponse.result;
        let workloadObject = {};
        if (!workloadResponse.error) {
          workloadObject = apiToOAuth2Workload(workloadData);
        }

        return {
          workload: workloadObject,
        };
      },
      providesTags: ["FullOAuth2Workload"],
    }),
    addWorkload: build.mutation<BatchRPCResponse, [string, string]>({
      query: (payload) => {
        const params = [
          [payload[0]],
          {
            description: payload[1],
            version: API_VERSION_BACKUP,
          },
        ];
        return getCommand({
          method: "oauth2workload_add",
          params: params,
        });
      },
    }),
    saveWorkload: build.mutation<BatchRPCResponse, Partial<OAuth2Workload>>({
      query: (workload) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...workload,
        };
        delete params["cn"];
        return getCommand({
          method: "oauth2workload_mod",
          params: [[workload.cn], params],
        });
      },
      invalidatesTags: ["FullOAuth2Workload"],
    }),
    removeWorkloads: build.mutation<BatchRPCResponse, OAuth2Workload[]>({
      query: (workloads) => {
        const workloadsToDeletePayload: Command[] = [];
        workloads.map((workload) => {
          const payloadItem = {
            method: "oauth2workload_del",
            params: [[workload.cn], {}],
          } as Command;
          workloadsToDeletePayload.push(payloadItem);
        });
        return getBatchCommand(workloadsToDeletePayload, API_VERSION_BACKUP);
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDelegationFullDataQuery,
  useAddDelegationMutation,
  useSaveDelegationMutation,
  useRemoveDelegationsMutation,
  useEnableDelegationsMutation,
  useDisableDelegationsMutation,
  useGetClientFullDataQuery,
  useAddClientMutation,
  useSaveClientMutation,
  useRemoveClientsMutation,
  useGetScopeFullDataQuery,
  useAddScopeMutation,
  useSaveScopeMutation,
  useRemoveScopesMutation,
  useGetWorkloadFullDataQuery,
  useAddWorkloadMutation,
  useSaveWorkloadMutation,
  useRemoveWorkloadsMutation,
} = extendedApi;

// Keep existing useGettingGenericQuery wrappers
export const useGettingOAuth2ClientsQuery = (payloadData) => {
  payloadData["objName"] = "oauth2client";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData);
};

export const useGettingOAuth2ScopesQuery = (payloadData) => {
  payloadData["objName"] = "oauth2scope";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData);
};

export const useGettingOAuth2WorkloadsQuery = (payloadData) => {
  payloadData["objName"] = "oauth2workload";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData);
};

export const useGettingOAuth2DelegationsQuery = (payloadData) => {
  payloadData["objName"] = "oauth2delegation";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData);
};
