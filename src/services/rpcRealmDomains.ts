import { api, getCommand, FindRPCResponse } from "./rpc";
import { API_VERSION_BACKUP } from "../utils/utils";

/**
 * RealmDomains-related endpoints
 *
 * API commands:
 * - realmdomains_show: https://freeipa.readthedocs.io/en/latest/api/realmdomains_show.html
 * - realmdomains_mod: https://freeipa.readthedocs.io/en/latest/api/realmdomains_mod.html
 */

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Get realm domains
     * @returns {string[]} - Array of associated domains
     */
    getRealmDomains: build.query<string[], void>({
      query: () =>
        getCommand({
          method: "realmdomains_show",
          params: [[], { version: API_VERSION_BACKUP, all: true, rights: true }],
        }),
      transformResponse: (response: FindRPCResponse): string[] => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = response.result.result as any;
        return result.associateddomain || [];
      },
    }),
    /**
     * Save realm domains via `realmdomains_mod`
     * @param {string[]} domains - Array of domain strings
     * @returns {FindRPCResponse} - Response from API
     */
    saveRealmDomains: build.mutation<FindRPCResponse, string[]>({
      query: (domains) =>
        getCommand({
          method: "realmdomains_mod",
          params: [
            [],
            {
              associateddomain: domains,
              version: API_VERSION_BACKUP,
            },
          ],
        }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetRealmDomainsQuery, useSaveRealmDomainsMutation } =
  extendedApi;
