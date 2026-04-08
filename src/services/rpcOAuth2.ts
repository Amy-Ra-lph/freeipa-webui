import {
  api,
  Command,
  getBatchCommand,
  BatchRPCResponse,
  FindRPCResponse,
  getCommand,
} from "./rpc";
// Data types
import { cnType } from "src/utils/datatypes/globalDataTypes";
// Redux
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { API_VERSION_BACKUP } from "src/utils/utils";

/**
 * OAuth2 Client endpoints
 *
 * API commands:
 * - oauth2client_find / oauth2client_show / oauth2client_add / oauth2client_del / oauth2client_mod
 * - oauth2scope_find / oauth2scope_show / oauth2scope_add / oauth2scope_del / oauth2scope_mod
 */

interface OAuth2FullDataPayload {
  searchValue: string;
  apiVersion: string;
  sizelimit: number;
  startIdx: number;
  stopIdx: number;
}

export interface OAuth2ClientAddPayload {
  cn: string;
  oauth2clientid: string;
  oauth2redirecturi?: string[];
  oauth2granttype?: string[];
  oauth2scope?: string[];
  oauth2clienttype?: string;
  oauth2tokenlifetime?: number;
  description?: string;
  version?: string;
}

export interface OAuth2ClientModPayload {
  clientName: string;
  oauth2clientid?: string;
  oauth2redirecturi?: string[];
  oauth2granttype?: string[];
  oauth2scope?: string[];
  oauth2clienttype?: string;
  oauth2tokenlifetime?: string;
  oauth2enabled?: string;
  description?: string;
}

export interface OAuth2ScopeAddPayload {
  cn: string;
  oauth2scope: string;
  oauth2scopedescription?: string;
  version?: string;
}

export interface OAuth2ScopeModPayload {
  scopeName: string;
  oauth2scope?: string;
  oauth2scopedescription?: string;
  oauth2enabled?: string;
}

export interface OAuth2WorkloadAddPayload {
  cn: string;
  oauth2workloadtype: string;
  oauth2spiffeid?: string;
  oauth2workloadowner?: string;
  oauth2workloadclient?: string;
  oauth2workloadserviceprincipal?: string;
  oauth2enabled?: string;
  oauth2maxtokenlifetime?: number;
  description?: string;
  version?: string;
}

export interface OAuth2WorkloadModPayload {
  workloadName: string;
  oauth2workloadtype?: string;
  oauth2spiffeid?: string;
  oauth2workloadowner?: string;
  oauth2workloadclient?: string;
  oauth2workloadserviceprincipal?: string;
  oauth2enabled?: string;
  oauth2maxtokenlifetime?: string;
  description?: string;
}

export interface OAuth2VendorAddPayload {
  cn: string;
  oauth2vendorcacert: string;
  oauth2vendorscope?: string[];
  oauth2vendornotafter?: string;
  oauth2vendorcontact?: string;
  oauth2vendorrekorurl?: string;
  description?: string;
  version?: string;
}

export interface OAuth2VendorModPayload {
  vendorName: string;
  oauth2vendorcacert?: string;
  oauth2vendorscope?: string[];
  oauth2vendornotafter?: string;
  oauth2vendorcontact?: string;
  oauth2vendorrekorurl?: string;
  oauth2enabled?: string;
  description?: string;
}

export interface OAuth2DelegationModPayload {
  delegationName: string;
  oauth2delegatesource?: string;
  oauth2delegatetarget?: string[];
  oauth2delegatescope?: string[];
  oauth2delegatehostgroup?: string[];
  oauth2delegateservice?: string[];
  oauth2delegatenotafter?: string;
  oauth2enabled?: string;
  description?: string;
}

export interface OAuth2DelegationAddPayload {
  cn: string;
  oauth2delegatesource: string;
  oauth2delegatetarget?: string[];
  oauth2delegatescope?: string[];
  oauth2delegatehostgroup?: string[];
  oauth2delegateservice?: string[];
  oauth2delegatenotafter?: string;
  description?: string;
  version?: string;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    // ====== OAuth2 Client endpoints ======

    getOAuth2ClientEntries: build.query<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2client_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2client_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    searchOAuth2ClientEntries: build.mutation<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2client_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2client_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    oauth2ClientAdd: build.mutation<FindRPCResponse, OAuth2ClientAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          oauth2clientid: payload.oauth2clientid,
          version: payload.version || API_VERSION_BACKUP,
        };

        if (payload.oauth2redirecturi) {
          params.oauth2redirecturi = payload.oauth2redirecturi;
        }
        if (payload.oauth2granttype) {
          params.oauth2granttype = payload.oauth2granttype;
        }
        if (payload.oauth2scope) {
          params.oauth2scope = payload.oauth2scope;
        }
        if (payload.oauth2clienttype) {
          params.oauth2clienttype = payload.oauth2clienttype;
        }
        if (payload.oauth2tokenlifetime !== undefined) {
          params.oauth2tokenlifetime = payload.oauth2tokenlifetime;
        }
        if (payload.description) {
          params.description = payload.description;
        }

        return getCommand({
          method: "oauth2client_add",
          params: [[payload.cn], params],
        });
      },
    }),

    oauth2ClientDelete: build.mutation<BatchRPCResponse, string[]>({
      query: (payload) => {
        const commands: Command[] = [];
        payload.forEach((name) => {
          commands.push({
            method: "oauth2client_del",
            params: [[name], {}],
          });
        });
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),

    oauth2ClientShow: build.query<Record<string, unknown>, string>({
      query: (clientName) => {
        return getCommand({
          method: "oauth2client_show",
          params: [
            [clientName],
            { all: true, rights: true, version: API_VERSION_BACKUP },
          ],
        });
      },
      transformResponse: (response: FindRPCResponse) => {
        return response.result.result as unknown as Record<string, unknown>;
      },
    }),

    oauth2ClientGenerateSecret: build.mutation<FindRPCResponse, string>({
      query: (clientName) => {
        return getCommand({
          method: "oauth2client_generate_secret",
          params: [[clientName], { version: API_VERSION_BACKUP }],
        });
      },
    }),

    oauth2ClientMod: build.mutation<FindRPCResponse, OAuth2ClientModPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          all: true,
          rights: true,
          version: API_VERSION_BACKUP,
        };

        const optionalKeys: Array<
          keyof Omit<OAuth2ClientModPayload, "clientName">
        > = [
          "oauth2clientid",
          "oauth2redirecturi",
          "oauth2granttype",
          "oauth2scope",
          "oauth2clienttype",
          "oauth2tokenlifetime",
          "oauth2enabled",
          "description",
        ];

        optionalKeys.forEach((key) => {
          const value = payload[key];
          if (value !== undefined) {
            params[key] = value;
          }
        });

        return getCommand({
          method: "oauth2client_mod",
          params: [[payload.clientName], params],
        });
      },
    }),

    // ====== OAuth2 Scope endpoints ======

    getOAuth2ScopeEntries: build.query<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2scope_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2scope_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    searchOAuth2ScopeEntries: build.mutation<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2scope_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2scope_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    oauth2ScopeAdd: build.mutation<FindRPCResponse, OAuth2ScopeAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          oauth2scope: payload.oauth2scope,
          version: payload.version || API_VERSION_BACKUP,
        };

        if (payload.oauth2scopedescription) {
          params.oauth2scopedescription = payload.oauth2scopedescription;
        }

        return getCommand({
          method: "oauth2scope_add",
          params: [[payload.cn], params],
        });
      },
    }),

    oauth2ScopeDelete: build.mutation<BatchRPCResponse, string[]>({
      query: (payload) => {
        const commands: Command[] = [];
        payload.forEach((name) => {
          commands.push({
            method: "oauth2scope_del",
            params: [[name], {}],
          });
        });
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),

    oauth2ScopeShow: build.query<Record<string, unknown>, string>({
      query: (scopeName) => {
        return getCommand({
          method: "oauth2scope_show",
          params: [
            [scopeName],
            { all: true, rights: true, version: API_VERSION_BACKUP },
          ],
        });
      },
      transformResponse: (response: FindRPCResponse) => {
        return response.result.result as unknown as Record<string, unknown>;
      },
    }),

    oauth2ScopeMod: build.mutation<FindRPCResponse, OAuth2ScopeModPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          all: true,
          rights: true,
          version: API_VERSION_BACKUP,
        };

        const optionalKeys: Array<
          keyof Omit<OAuth2ScopeModPayload, "scopeName">
        > = ["oauth2scope", "oauth2scopedescription", "oauth2enabled"];

        optionalKeys.forEach((key) => {
          const value = payload[key];
          if (value !== undefined) {
            params[key] = value;
          }
        });

        return getCommand({
          method: "oauth2scope_mod",
          params: [[payload.scopeName], params],
        });
      },
    }),
    // ====== OAuth2 Workload endpoints ======

    getOAuth2WorkloadEntries: build.query<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2workload_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2workload_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    searchOAuth2WorkloadEntries: build.mutation<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2workload_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2workload_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    oauth2WorkloadAdd: build.mutation<FindRPCResponse, OAuth2WorkloadAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          oauth2workloadtype: payload.oauth2workloadtype,
          version: payload.version || API_VERSION_BACKUP,
        };

        if (payload.oauth2spiffeid) {
          params.oauth2spiffeid = payload.oauth2spiffeid;
        }
        if (payload.oauth2workloadowner) {
          params.oauth2workloadowner = payload.oauth2workloadowner;
        }
        if (payload.oauth2workloadclient) {
          params.oauth2workloadclient = payload.oauth2workloadclient;
        }
        if (payload.oauth2workloadserviceprincipal) {
          params.oauth2workloadserviceprincipal = payload.oauth2workloadserviceprincipal;
        }
        if (payload.oauth2enabled) {
          params.oauth2enabled = payload.oauth2enabled;
        }
        if (payload.oauth2maxtokenlifetime !== undefined) {
          params.oauth2maxtokenlifetime = payload.oauth2maxtokenlifetime;
        }
        if (payload.description) {
          params.description = payload.description;
        }

        return getCommand({
          method: "oauth2workload_add",
          params: [[payload.cn], params],
        });
      },
    }),

    oauth2WorkloadDelete: build.mutation<BatchRPCResponse, string[]>({
      query: (payload) => {
        const commands: Command[] = [];
        payload.forEach((name) => {
          commands.push({
            method: "oauth2workload_del",
            params: [[name], {}],
          });
        });
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),

    oauth2WorkloadShow: build.query<Record<string, unknown>, string>({
      query: (workloadName) => {
        return getCommand({
          method: "oauth2workload_show",
          params: [
            [workloadName],
            { all: true, rights: true, version: API_VERSION_BACKUP },
          ],
        });
      },
      transformResponse: (response: FindRPCResponse) => {
        return response.result.result as unknown as Record<string, unknown>;
      },
    }),

    oauth2WorkloadMod: build.mutation<FindRPCResponse, OAuth2WorkloadModPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          all: true,
          rights: true,
          version: API_VERSION_BACKUP,
        };

        const optionalKeys: Array<
          keyof Omit<OAuth2WorkloadModPayload, "workloadName">
        > = [
          "oauth2workloadtype",
          "oauth2spiffeid",
          "oauth2workloadowner",
          "oauth2workloadclient",
          "oauth2workloadserviceprincipal",
          "oauth2enabled",
          "oauth2maxtokenlifetime",
          "description",
        ];

        optionalKeys.forEach((key) => {
          const value = payload[key];
          if (value !== undefined) {
            params[key] = value;
          }
        });

        return getCommand({
          method: "oauth2workload_mod",
          params: [[payload.workloadName], params],
        });
      },
    }),

    // ====== OAuth2 Delegation endpoints ======

    getOAuth2DelegationEntries: build.query<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2delegation_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2delegation_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    searchOAuth2DelegationEntries: build.mutation<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2delegation_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2delegation_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    oauth2DelegationAdd: build.mutation<FindRPCResponse, OAuth2DelegationAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          oauth2delegatesource: payload.oauth2delegatesource,
          version: payload.version || API_VERSION_BACKUP,
        };

        if (payload.oauth2delegatetarget) {
          params.oauth2delegatetarget = payload.oauth2delegatetarget;
        }
        if (payload.oauth2delegatescope) {
          params.oauth2delegatescope = payload.oauth2delegatescope;
        }
        if (payload.oauth2delegatehostgroup) {
          params.oauth2delegatehostgroup = payload.oauth2delegatehostgroup;
        }
        if (payload.oauth2delegateservice) {
          params.oauth2delegateservice = payload.oauth2delegateservice;
        }
        if (payload.oauth2delegatenotafter) {
          params.oauth2delegatenotafter = payload.oauth2delegatenotafter;
        }
        if (payload.description) {
          params.description = payload.description;
        }

        return getCommand({
          method: "oauth2delegation_add",
          params: [[payload.cn], params],
        });
      },
    }),

    oauth2DelegationDelete: build.mutation<BatchRPCResponse, string[]>({
      query: (payload) => {
        const commands: Command[] = [];
        payload.forEach((name) => {
          commands.push({
            method: "oauth2delegation_del",
            params: [[name], {}],
          });
        });
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),

    oauth2DelegationShow: build.query<Record<string, unknown>, string>({
      query: (delegationName) => {
        return getCommand({
          method: "oauth2delegation_show",
          params: [
            [delegationName],
            { all: true, rights: true, version: API_VERSION_BACKUP },
          ],
        });
      },
      transformResponse: (response: FindRPCResponse) => {
        return response.result.result as unknown as Record<string, unknown>;
      },
    }),

    oauth2DelegationMod: build.mutation<FindRPCResponse, OAuth2DelegationModPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          all: true,
          rights: true,
          version: API_VERSION_BACKUP,
        };

        const optionalKeys: Array<
          keyof Omit<OAuth2DelegationModPayload, "delegationName">
        > = [
          "oauth2delegatesource",
          "oauth2delegatetarget",
          "oauth2delegatescope",
          "oauth2delegatehostgroup",
          "oauth2delegateservice",
          "oauth2delegatenotafter",
          "oauth2enabled",
          "description",
        ];

        optionalKeys.forEach((key) => {
          const value = payload[key];
          if (value !== undefined) {
            params[key] = value;
          }
        });

        return getCommand({
          method: "oauth2delegation_mod",
          params: [[payload.delegationName], params],
        });
      },
    }),
    // ====== OAuth2 Vendor endpoints ======

    getOAuth2VendorEntries: build.query<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2vendor_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2vendor_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    searchOAuth2VendorEntries: build.mutation<
      BatchRPCResponse,
      OAuth2FullDataPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const { searchValue, apiVersion, sizelimit, startIdx, stopIdx } =
          payloadData;

        if (apiVersion === undefined) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "",
              error: "API version not available",
            } as FetchBaseQueryError,
          };
        }

        const findParams = {
          pkey_only: true,
          sizelimit: sizelimit,
          version: apiVersion,
        };

        const payloadFind: Command = {
          method: "oauth2vendor_find",
          params: [[searchValue], findParams],
        };

        const getResultFind = await fetchWithBQ(getCommand(payloadFind));
        if (getResultFind.error) {
          return { error: getResultFind.error as FetchBaseQueryError };
        }

        const responseDataFind = getResultFind.data as FindRPCResponse;
        const ids: string[] = [];
        const itemsCount = responseDataFind.result.result.length as number;

        for (let i = startIdx; i < itemsCount && i < stopIdx; i++) {
          const item = responseDataFind.result.result[i] as cnType;
          const { cn } = item;
          ids.push(cn[0] as string);
        }

        const commands: Command[] = [];
        ids.forEach((id) => {
          commands.push({
            method: "oauth2vendor_show",
            params: [[id], {}],
          });
        });

        const showResult = await fetchWithBQ(
          getBatchCommand(commands, apiVersion)
        );

        const response = showResult.data as BatchRPCResponse;
        if (response) {
          response.result.totalCount = itemsCount;
        }

        return { data: response };
      },
    }),

    oauth2VendorAdd: build.mutation<FindRPCResponse, OAuth2VendorAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          oauth2vendorcacert: payload.oauth2vendorcacert,
          version: payload.version || API_VERSION_BACKUP,
        };

        if (payload.oauth2vendorscope) {
          params.oauth2vendorscope = payload.oauth2vendorscope;
        }
        if (payload.oauth2vendornotafter) {
          params.oauth2vendornotafter = payload.oauth2vendornotafter;
        }
        if (payload.oauth2vendorcontact) {
          params.oauth2vendorcontact = payload.oauth2vendorcontact;
        }
        if (payload.oauth2vendorrekorurl) {
          params.oauth2vendorrekorurl = payload.oauth2vendorrekorurl;
        }
        if (payload.description) {
          params.description = payload.description;
        }

        return getCommand({
          method: "oauth2vendor_add",
          params: [[payload.cn], params],
        });
      },
    }),

    oauth2VendorDelete: build.mutation<BatchRPCResponse, string[]>({
      query: (payload) => {
        const commands: Command[] = [];
        payload.forEach((name) => {
          commands.push({
            method: "oauth2vendor_del",
            params: [[name], {}],
          });
        });
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),

    oauth2VendorShow: build.query<Record<string, unknown>, string>({
      query: (vendorName) => {
        return getCommand({
          method: "oauth2vendor_show",
          params: [
            [vendorName],
            { all: true, rights: true, version: API_VERSION_BACKUP },
          ],
        });
      },
      transformResponse: (response: FindRPCResponse) => {
        return response.result.result as unknown as Record<string, unknown>;
      },
    }),

    oauth2VendorMod: build.mutation<FindRPCResponse, OAuth2VendorModPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          all: true,
          rights: true,
          version: API_VERSION_BACKUP,
        };

        const optionalKeys: Array<
          keyof Omit<OAuth2VendorModPayload, "vendorName">
        > = [
          "oauth2vendorcacert",
          "oauth2vendorscope",
          "oauth2vendornotafter",
          "oauth2vendorcontact",
          "oauth2vendorrekorurl",
          "oauth2enabled",
          "description",
        ];

        optionalKeys.forEach((key) => {
          const value = payload[key];
          if (value !== undefined) {
            params[key] = value;
          }
        });

        return getCommand({
          method: "oauth2vendor_mod",
          params: [[payload.vendorName], params],
        });
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOAuth2ClientEntriesQuery,
  useSearchOAuth2ClientEntriesMutation,
  useOauth2ClientAddMutation,
  useOauth2ClientDeleteMutation,
  useOauth2ClientShowQuery,
  useOauth2ClientGenerateSecretMutation,
  useOauth2ClientModMutation,
  useGetOAuth2ScopeEntriesQuery,
  useSearchOAuth2ScopeEntriesMutation,
  useOauth2ScopeAddMutation,
  useOauth2ScopeDeleteMutation,
  useOauth2ScopeShowQuery,
  useOauth2ScopeModMutation,
  useGetOAuth2WorkloadEntriesQuery,
  useSearchOAuth2WorkloadEntriesMutation,
  useOauth2WorkloadAddMutation,
  useOauth2WorkloadDeleteMutation,
  useOauth2WorkloadShowQuery,
  useOauth2WorkloadModMutation,
  useGetOAuth2DelegationEntriesQuery,
  useSearchOAuth2DelegationEntriesMutation,
  useOauth2DelegationAddMutation,
  useOauth2DelegationDeleteMutation,
  useOauth2DelegationShowQuery,
  useOauth2DelegationModMutation,
  useGetOAuth2VendorEntriesQuery,
  useSearchOAuth2VendorEntriesMutation,
  useOauth2VendorAddMutation,
  useOauth2VendorDeleteMutation,
  useOauth2VendorShowQuery,
  useOauth2VendorModMutation,
} = extendedApi;
