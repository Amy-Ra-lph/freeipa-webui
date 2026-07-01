import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToCertProfile } from "src/utils/certProfilesUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { CertProfile, cnType } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * CertProfile-related endpoints: getCertProfilesInfoByName, addCertProfile,
 * deleteCertProfiles, saveCertProfile, searchCertProfilesEntries, getCertProfileById
 *
 * API commands:
 * - certprofile_find: https://freeipa.readthedocs.io/en/latest/api/certprofile_find.html
 * - certprofile_show: https://freeipa.readthedocs.io/en/latest/api/certprofile_show.html
 * - certprofile_add: https://freeipa.readthedocs.io/en/latest/api/certprofile_add.html
 * - certprofile_del: https://freeipa.readthedocs.io/en/latest/api/certprofile_del.html
 * - certprofile_mod: https://freeipa.readthedocs.io/en/latest/api/certprofile_mod.html
 */

interface CertProfileInfoPayload {
  certProfileNamesList: string[];
  no_members?: boolean;
  version?: string;
}

interface CertProfileAddPayload {
  cn: string;
  description?: string;
  ipacertprofilestoreissued?: boolean;
}

interface CertProfilesSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCertProfilesInfoByName: build.query<
      CertProfile[],
      CertProfileInfoPayload
    >({
      query: (payload) => {
        const certProfileNames = payload.certProfileNamesList;
        const noMembers = payload.no_members || false;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const certProfileShowCommands: Command[] = certProfileNames.map(
          (profileName) => ({
            method: "certprofile_show",
            params: [[profileName], { no_members: noMembers }],
          })
        );
        return getBatchCommand(certProfileShowCommands, apiVersion);
      },
      transformResponse: (response: BatchRPCResponse): CertProfile[] => {
        const certProfileList: CertProfile[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const certProfileData = apiToCertProfile(results[i].result);
          certProfileList.push(certProfileData);
        }
        return certProfileList;
      },
    }),
    addCertProfile: build.mutation<FindRPCResponse, CertProfileAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
        };
        if (payload.description) {
          params.description = payload.description;
        }
        if (payload.ipacertprofilestoreissued !== undefined) {
          params.ipacertprofilestoreissued = payload.ipacertprofilestoreissued;
        }
        return getCommand({
          method: "certprofile_add",
          params: [[payload.cn], params],
        });
      },
    }),
    deleteCertProfiles: build.mutation<BatchRPCResponse, CertProfile[]>({
      query: (certProfiles) => {
        const commands: Command[] = certProfiles.map((profile) => ({
          method: "certprofile_del",
          params: [[profile.cn], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    saveCertProfile: build.mutation<FindRPCResponse, Partial<CertProfile>>({
      query: (certProfile) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...certProfile,
        };
        delete params.cn;
        return getCommand({
          method: "certprofile_mod",
          params: [[certProfile.cn], params],
        });
      },
    }),
    searchCertProfilesEntries: build.mutation<
      BatchRPCResponse,
      CertProfilesSearchPayload
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

        // Step 1: Find cert profile IDs
        const findCommand: Command = {
          method: "certprofile_find",
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
          const profileId = findResponse.result.result[i] as cnType;
          ids.push(profileId.cn[0] as string);
        }

        // Step 2: Batch show for each cert profile
        const showCommands: Command[] = ids.map((id) => ({
          method: "certprofile_show",
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
    getCertProfileById: build.query<CertProfile, string>({
      query: (cn) => {
        return getCommand({
          method: "certprofile_show",
          params: [[cn], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): CertProfile => {
        return apiToCertProfile(response.result.result);
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingCertProfilesQuery = (payloadData, options?) => {
  payloadData["objName"] = "certprofile";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData, options);
};

export const useCertProfileShowQuery = (profileId: string) => {
  return useGetCertProfilesInfoByNameQuery(
    {
      certProfileNamesList: [profileId],
      no_members: true,
      version: API_VERSION_BACKUP,
    },
    { skip: !profileId }
  );
};

export const {
  useGetCertProfilesInfoByNameQuery,
  useAddCertProfileMutation,
  useDeleteCertProfilesMutation,
  useSaveCertProfileMutation,
  useSearchCertProfilesEntriesMutation,
  useGetCertProfileByIdQuery,
} = extendedApi;
