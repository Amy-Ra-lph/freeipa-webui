import {
  api,
  Command,
  getBatchCommand,
  getCommand,
  BatchRPCResponse,
  FindRPCResponse,
} from "./rpc";
import { apiToTopologySegment } from "src/utils/topologySegmentsUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import {
  TopologySegment,
  TopologyDirection,
  cnType,
} from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * TopologySegments-related endpoints
 *
 * API commands:
 * - topologysegment_find: https://freeipa.readthedocs.io/en/latest/api/topologysegment_find.html
 * - topologysegment_show: https://freeipa.readthedocs.io/en/latest/api/topologysegment_show.html
 * - topologysegment_add: https://freeipa.readthedocs.io/en/latest/api/topologysegment_add.html
 * - topologysegment_del: https://freeipa.readthedocs.io/en/latest/api/topologysegment_del.html
 * - topologysegment_mod: https://freeipa.readthedocs.io/en/latest/api/topologysegment_mod.html
 * - topologysegment_reinitialize: https://freeipa.readthedocs.io/en/latest/api/topologysegment_reinitialize.html
 *
 * NOTE: All commands take suffixCn as the first positional argument.
 */

interface SegmentShowPayload {
  suffixCn: string;
  segmentNamesList: string[];
  version: string;
}

interface SegmentAddPayload {
  suffixCn: string;
  cn: string;
  iparepltoposegmentleftnode: string;
  iparepltoposegmentrightnode: string;
  iparepltoposegmentdirection?: TopologyDirection;
}

interface SegmentsSearchPayload {
  suffixCn: string;
  searchValue: string;
  sizeLimit: number;
  apiVersion: string;
  startIdx: number;
  stopIdx: number;
}

interface SegmentSavePayload {
  suffixCn: string;
  segment: Partial<TopologySegment>;
}

interface SegmentDeletePayload {
  suffixCn: string;
  segments: TopologySegment[];
}

interface SegmentReinitializePayload {
  suffixCn: string;
  cn: string;
  left?: boolean;
  right?: boolean;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Given a list of segment names, show the full data of those segments
     * @param {SegmentShowPayload} - Payload with suffix cn, segment names, and options
     * @returns {TopologySegment[]} - Array of segments
     */
    getTopologySegmentsInfoByName: build.query<
      TopologySegment[],
      SegmentShowPayload
    >({
      query: (payload) => {
        const { suffixCn, segmentNamesList, version } = payload;
        const apiVersion = version || API_VERSION_BACKUP;
        const showCommands: Command[] = segmentNamesList.map(
          (segmentName) => ({
            method: "topologysegment_show",
            params: [[suffixCn, segmentName], {}],
          })
        );
        return getBatchCommand(showCommands, apiVersion);
      },
      transformResponse: (response: BatchRPCResponse): TopologySegment[] => {
        const segmentList: TopologySegment[] = [];
        const results = response.result.results;
        const count = response.result.count;
        for (let i = 0; i < count; i++) {
          const segmentData = apiToTopologySegment(results[i].result);
          segmentList.push(segmentData);
        }
        return segmentList;
      },
    }),
    /**
     * Add a new topology segment via `topologysegment_add`
     * @param {SegmentAddPayload} - Payload with suffix cn and segment data
     * @returns {FindRPCResponse} - Response from API
     */
    addTopologySegment: build.mutation<FindRPCResponse, SegmentAddPayload>({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
          iparepltoposegmentleftnode: payload.iparepltoposegmentleftnode,
          iparepltoposegmentrightnode: payload.iparepltoposegmentrightnode,
        };
        if (payload.iparepltoposegmentdirection) {
          params.iparepltoposegmentdirection =
            payload.iparepltoposegmentdirection;
        }
        return getCommand({
          method: "topologysegment_add",
          params: [[payload.suffixCn, payload.cn], params],
        });
      },
    }),
    /**
     * Delete topology segments via batch `topologysegment_del`
     * @param {SegmentDeletePayload} - Payload with suffix cn and segments to delete
     * @returns {BatchRPCResponse} - Batch response
     */
    deleteTopologySegments: build.mutation<
      BatchRPCResponse,
      SegmentDeletePayload
    >({
      query: (payload) => {
        const commands: Command[] = payload.segments.map((segment) => ({
          method: "topologysegment_del",
          params: [[payload.suffixCn, segment.cn], {}],
        }));
        return getBatchCommand(commands, API_VERSION_BACKUP);
      },
    }),
    /**
     * Modify an existing topology segment via `topologysegment_mod`
     * @param {SegmentSavePayload} - Payload with suffix cn and segment data
     * @returns {FindRPCResponse} - Response from API
     */
    saveTopologySegment: build.mutation<FindRPCResponse, SegmentSavePayload>({
      query: (payload) => {
        const params = {
          version: API_VERSION_BACKUP,
          ...payload.segment,
        };
        delete params.cn;
        delete params.suffixType;
        return getCommand({
          method: "topologysegment_mod",
          params: [[payload.suffixCn, payload.segment.cn], params],
        });
      },
    }),
    /**
     * Search topology segments via two-step find + show pattern
     * @param {SegmentsSearchPayload} - Search parameters
     * @returns {BatchRPCResponse} - Batch response with segment data
     */
    searchTopologySegmentsEntries: build.mutation<
      BatchRPCResponse,
      SegmentsSearchPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const {
          suffixCn,
          searchValue,
          sizeLimit,
          apiVersion,
          startIdx,
          stopIdx,
        } = payloadData;

        const params = {
          pkey_only: true,
          sizelimit: sizeLimit,
          version: apiVersion,
          all: true,
        };

        // Step 1: Find segment IDs
        const findCommand: Command = {
          method: "topologysegment_find",
          params: [[suffixCn, searchValue], params],
        };

        const findResult = await fetchWithBQ(getCommand(findCommand));
        if (findResult.error) {
          return { error: findResult.error as FetchBaseQueryError };
        }

        const findResponse = findResult.data as FindRPCResponse;
        const totalCount = findResponse.result.result.length as number;
        const ids: string[] = [];

        for (let i = startIdx; i < totalCount && i < stopIdx; i++) {
          const segmentId = findResponse.result.result[i] as cnType;
          ids.push(segmentId.cn[0] as string);
        }

        // Step 2: Batch show for each segment
        const showCommands: Command[] = ids.map((id) => ({
          method: "topologysegment_show",
          params: [[suffixCn, id], {}],
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
     * Get a single topology segment by cn
     * @param {{ suffixCn: string; cn: string }} - Suffix and segment cn
     * @returns {TopologySegment} - Segment data
     */
    getTopologySegmentById: build.query<
      TopologySegment,
      { suffixCn: string; cn: string }
    >({
      query: ({ suffixCn, cn }) => {
        return getCommand({
          method: "topologysegment_show",
          params: [[suffixCn, cn], { all: true, rights: true }],
        });
      },
      transformResponse: (response: FindRPCResponse): TopologySegment => {
        return apiToTopologySegment(response.result.result);
      },
    }),
    /**
     * Reinitialize a topology segment
     * @param {SegmentReinitializePayload} - Payload with suffix cn, segment cn, and direction
     * @returns {FindRPCResponse} - Response from API
     */
    reinitializeTopologySegment: build.mutation<
      FindRPCResponse,
      SegmentReinitializePayload
    >({
      query: (payload) => {
        const params: Record<string, unknown> = {
          version: API_VERSION_BACKUP,
        };
        if (payload.left) {
          params.left = true;
        }
        if (payload.right) {
          params.right = true;
        }
        return getCommand({
          method: "topologysegment_reinitialize",
          params: [[payload.suffixCn, payload.cn], params],
        });
      },
    }),
  }),
  overrideExisting: false,
});

export const useTopologySegmentShowQuery = (
  suffixCn: string,
  segmentId: string
) => {
  return useGetTopologySegmentsInfoByNameQuery(
    {
      suffixCn,
      segmentNamesList: [segmentId],
      version: API_VERSION_BACKUP,
    },
    { skip: !suffixCn || !segmentId }
  );
};

export const {
  useGetTopologySegmentsInfoByNameQuery,
  useAddTopologySegmentMutation,
  useDeleteTopologySegmentsMutation,
  useSaveTopologySegmentMutation,
  useSearchTopologySegmentsEntriesMutation,
  useGetTopologySegmentByIdQuery,
  useReinitializeTopologySegmentMutation,
} = extendedApi;
