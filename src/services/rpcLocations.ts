import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
  useGettingGenericQuery,
} from "./rpc";
import { apiToLocation } from "src/utils/locationsUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { Location } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Locations-related endpoints: getLocationsInfoByName, addLocation, deleteLocations,
 * saveLocation, searchLocationsEntries, getLocationById
 *
 * API commands:
 * - location_find: https://freeipa.readthedocs.io/en/latest/api/location_find.html
 * - location_show: https://freeipa.readthedocs.io/en/latest/api/location_show.html
 * - location_add: https://freeipa.readthedocs.io/en/latest/api/location_add.html
 * - location_del: https://freeipa.readthedocs.io/en/latest/api/location_del.html
 * - location_mod: https://freeipa.readthedocs.io/en/latest/api/location_mod.html
 */

interface LocationShowPayload {
  locationNamesList: string[];
  no_members?: boolean;
  version: string;
}

interface LocationAddPayload {
  idnsname: string;
  description?: string;
}

interface LocationsSearchPayload {
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

type LocationIdType = {
  idnsname: string[];
};

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of location names, show the full data of those locations
     * @param {LocationShowPayload} - Payload with location names and options
     * @returns {BatchRPCResponse} - Batch response
     */
    getLocationsInfoByName: build.query<Location[], LocationShowPayload>({
      query: (payload) => {
        const locationNames = payload.locationNamesList;
        const noMembers = payload.no_members || false;
        const apiVersion = payload.version || API_VERSION_BACKUP;
        const locationShowCommands: Command[] = locationNames.map(
          (locationName) => ({
            method: "location_show",
            params: [[locationName], { no_members: noMembers }],
          })
        );
        return getBatchCommand(locationShowCommands, apiVersion);
      },
      transformResponse: (response: BatchRPCResponse): Location[] => {
        const locationList: Location[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const locationData = apiToLocation(results[i].result);
          locationList.push(locationData);
        }
        return locationList;
      },
    }),
    /**
     * Add a new location via `location_add`
     * @param {LocationAddPayload} - Payload with location idnsname and optional description
     * @returns {FindRPCResponse} - Response from API
     */
    addLocation: build.mutation<FindRPCResponse, LocationAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
        };
        if (payload.description) {
          params.description = payload.description;
        }
        return getCommand({
          method: "location_add",
          params: [[payload.idnsname], params],
        });
      },
    }),
    /**
     * Delete locations via batch `location_del`
     * @param {Location[]} - Array of locations to delete
     * @returns {BatchRPCResponse} - Batch response
     */
    deleteLocations: build.mutation<BatchRPCResponse, Location[]>({
      query: (locations) => {
        const commands: Command[] = locations.map((location) => ({
          method: "location_del",
          params: [[location.idnsname], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    /**
     * Modify an existing location via `location_mod`
     * @param {Partial<Location>} - Location data to modify (must include idnsname)
     * @returns {FindRPCResponse} - Response from API
     */
    saveLocation: build.mutation<FindRPCResponse, Partial<Location>>({
      query: (location) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...location,
        };
        delete params.idnsname;
        return getCommand({
          method: "location_mod",
          params: [[location.idnsname], params],
        });
      },
    }),
    /**
     * Search locations via two-step location_find + location_show pattern
     * @param {LocationsSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with location data
     */
    searchLocationsEntries: build.mutation<
      BatchRPCResponse,
      LocationsSearchPayload
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

        // Step 1: Find location IDs
        const findCommand: Command = {
          method: "location_find",
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
          const locationId = findResponse.result.result[i] as LocationIdType;
          ids.push(locationId.idnsname[0] as string);
        }

        // Step 2: Batch show for each location
        const showCommands: Command[] = ids.map((id) => ({
          method: "location_show",
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
     * Get a single location by idnsname
     * @param {string} idnsname - Location idnsname
     * @returns {Location} - Location data
     */
    getLocationById: build.query<Location, string>({
      query: (idnsname) => {
        return getCommand({
          method: "location_show",
          params: [[idnsname], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): Location => {
        return apiToLocation(response.result.result);
      },
    }),
  }),
  overrideExisting: false,
});

export const useGettingLocationsQuery = (payloadData, options?) => {
  payloadData["objName"] = "location";
  payloadData["objAttr"] = "idnsname";
  return useGettingGenericQuery(payloadData, options);
};

export const useLocationShowQuery = (locationId: string) => {
  return useGetLocationsInfoByNameQuery(
    {
      locationNamesList: [locationId],
      no_members: true,
      version: API_VERSION_BACKUP,
    },
    { skip: !locationId }
  );
};

export const {
  useGetLocationsInfoByNameQuery,
  useAddLocationMutation,
  useDeleteLocationsMutation,
  useSearchLocationsEntriesMutation,
  useSaveLocationMutation,
  useGetLocationByIdQuery,
} = extendedApi;
