import { api, getCommand, FindRPCResponse } from "./rpc";
import { API_VERSION_BACKUP } from "../utils/utils";

/**
 * HBAC Test endpoint:
 * - hbactest: Simulate Host-based access control evaluation
 *
 * API command:
 * - hbactest: https://freeipa.readthedocs.io/en/latest/api/hbactest.html
 */

export interface HBACTestPayload {
  user: string;
  targethost: string;
  service: string;
  rules?: string[];
  nodetail?: boolean;
  enabled?: boolean;
  disabled?: boolean;
  version?: string;
}

export interface HBACTestResult {
  value: boolean;
  summary: string;
  matched: string[];
  notmatched: string[];
  error: string[] | null;
  warning: string | null;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    hbacTest: build.mutation<FindRPCResponse, HBACTestPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          user: payload.user,
          targethost: payload.targethost,
          service: payload.service,
          version: payload.version || API_VERSION_BACKUP,
        };

        if (payload.rules && payload.rules.length > 0) {
          params.rules = payload.rules;
        }
        if (payload.nodetail !== undefined) {
          params.nodetail = payload.nodetail;
        }
        if (payload.enabled !== undefined) {
          params.enabled = payload.enabled;
        }
        if (payload.disabled !== undefined) {
          params.disabled = payload.disabled;
        }

        return getCommand({
          method: "hbactest",
          params: [[], params],
        });
      },
    }),
  }),
  overrideExisting: false,
});

export const { useHbacTestMutation } = extendedApi;
