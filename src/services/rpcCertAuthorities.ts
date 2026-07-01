import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToCertAuthority } from "src/utils/certAuthoritiesUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import {
  CertificateAuthority,
  cnType,
} from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Certificate Authority endpoints:
 *   getCertAuthoritiesInfoByName, addCertAuthority, deleteCertAuthorities,
 *   saveCertAuthority, searchCertAuthoritiesEntries, getCertAuthorityById,
 *   enableCertAuthority, disableCertAuthority
 *
 * API commands:
 * - ca_find: https://freeipa.readthedocs.io/en/latest/api/ca_find.html
 * - ca_show: https://freeipa.readthedocs.io/en/latest/api/ca_show.html
 * - ca_add: https://freeipa.readthedocs.io/en/latest/api/ca_add.html
 * - ca_del: https://freeipa.readthedocs.io/en/latest/api/ca_del.html
 * - ca_mod: https://freeipa.readthedocs.io/en/latest/api/ca_mod.html
 * - ca_enable: https://freeipa.readthedocs.io/en/latest/api/ca_enable.html
 * - ca_disable: https://freeipa.readthedocs.io/en/latest/api/ca_disable.html
 */

interface CertAuthorityShowPayload {
  certAuthorityNamesList: string[];
  no_members?: boolean;
  version: string;
}

interface CertAuthorityAddPayload {
  cn: string;
  description?: string;
  ipacasubjectdn: string;
}

interface CertAuthoritiesSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of CA names, show the full data of those CAs
     * @param {CertAuthorityShowPayload} - Payload with CA names and options
     * @returns {BatchRPCResponse} - Batch response
     */
    getCertAuthoritiesInfoByName: build.query<
      CertificateAuthority[],
      CertAuthorityShowPayload
    >({
      query: (payload) => {
        const caNames = payload.certAuthorityNamesList;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const caShowCommands: Command[] = caNames.map((caName) => ({
          method: "ca_show",
          params: [[caName], {}],
        }));
        return getBatchCommand(caShowCommands, apiVersion);
      },
      transformResponse: (
        response: BatchRPCResponse
      ): CertificateAuthority[] => {
        const caList: CertificateAuthority[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const caData = apiToCertAuthority(results[i].result);
          caList.push(caData);
        }
        return caList;
      },
    }),
    /**
     * Add a new certificate authority via `ca_add`
     * @param {CertAuthorityAddPayload} - Payload with CA cn, subject DN, and optional description
     * @returns {FindRPCResponse} - Response from API
     */
    addCertAuthority: build.mutation<FindRPCResponse, CertAuthorityAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          ipacasubjectdn: payload.ipacasubjectdn,
        };
        if (payload.description) {
          params.description = payload.description;
        }
        return getCommand({
          method: "ca_add",
          params: [[payload.cn], params],
        });
      },
    }),
    /**
     * Delete certificate authorities via batch `ca_del`
     * @param {CertificateAuthority[]} - Array of CAs to delete
     * @returns {BatchRPCResponse} - Batch response
     */
    deleteCertAuthorities: build.mutation<
      BatchRPCResponse,
      CertificateAuthority[]
    >({
      query: (cas) => {
        const commands: Command[] = cas.map((ca) => ({
          method: "ca_del",
          params: [[ca.cn[0]], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    /**
     * Modify an existing certificate authority via `ca_mod`
     * @param {Partial<CertificateAuthority>} - CA data to modify (must include cn)
     * @returns {FindRPCResponse} - Response from API
     */
    saveCertAuthority: build.mutation<
      FindRPCResponse,
      Partial<CertificateAuthority>
    >({
      query: (ca) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          ...ca,
        };
        const cn = Array.isArray(ca.cn) ? ca.cn[0] : ca.cn;
        delete params.cn;
        return getCommand({
          method: "ca_mod",
          params: [[cn], params],
        });
      },
    }),
    /**
     * Search certificate authorities via two-step ca_find + ca_show pattern
     * @param {CertAuthoritiesSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with CA data
     */
    searchCertAuthoritiesEntries: build.mutation<
      BatchRPCResponse,
      CertAuthoritiesSearchPayload
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

        // Step 1: Find CA IDs
        const findCommand: Command = {
          method: "ca_find",
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
          const caId = findResponse.result.result[i] as cnType;
          ids.push(caId.cn[0] as string);
        }

        // Step 2: Batch show for each CA
        const showCommands: Command[] = ids.map((id) => ({
          method: "ca_show",
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
     * Get a single certificate authority by cn
     * @param {string} cn - CA cn
     * @returns {CertificateAuthority} - CA data
     */
    getCertAuthorityById: build.query<CertificateAuthority, string>({
      query: (cn) => {
        return getCommand({
          method: "ca_show",
          params: [[cn], { all: true, rights: true }],
        });
      },
      transformResponse: (
        response: FindRPCResponse
      ): CertificateAuthority => {
        return apiToCertAuthority(response.result.result);
      },
    }),
    /**
     * Enable a certificate authority via `ca_enable`
     * @param {string} cn - CA cn
     * @returns {FindRPCResponse} - Response from API
     */
    enableCertAuthority: build.mutation<FindRPCResponse, string>({
      query: (cn) => {
        return getCommand({
          method: "ca_enable",
          params: [[cn], { version: API_VERSION_BACKUP }],
        });
      },
    }),
    /**
     * Disable a certificate authority via `ca_disable`
     * @param {string} cn - CA cn
     * @returns {FindRPCResponse} - Response from API
     */
    disableCertAuthority: build.mutation<FindRPCResponse, string>({
      query: (cn) => {
        return getCommand({
          method: "ca_disable",
          params: [[cn], { version: API_VERSION_BACKUP }],
        });
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingCertAuthoritiesQuery = (payloadData, options?) => {
  payloadData["objName"] = "ca";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData, options);
};

export const useCertAuthorityShowQuery = (caId: string) => {
  return useGetCertAuthoritiesInfoByNameQuery(
    {
      certAuthorityNamesList: [caId],
      version: API_VERSION_BACKUP,
    },
    { skip: !caId }
  );
};

export const {
  useGetCertAuthoritiesInfoByNameQuery,
  useAddCertAuthorityMutation,
  useDeleteCertAuthoritiesMutation,
  useSaveCertAuthorityMutation,
  useSearchCertAuthoritiesEntriesMutation,
  useGetCertAuthorityByIdQuery,
  useEnableCertAuthorityMutation,
  useDisableCertAuthorityMutation,
} = extendedApi;
