import { api, getCommand, FindRPCResponse } from "./rpc";
import { apiToCertificate } from "src/utils/certificatesUtils";
import { API_VERSION_BACKUP } from "../utils/utils";
import { Certificate } from "../utils/datatypes/globalDataTypes";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/**
 * Certificate search endpoints: certFind, certShow
 *
 * API commands:
 * - cert_find: https://freeipa.readthedocs.io/en/latest/api/cert_find.html
 * - cert_show: https://freeipa.readthedocs.io/en/latest/api/cert_show.html
 */

export interface CertFindPayload {
  subject?: string;
  issuer?: string;
  serial_number?: string;
  min_serial_number?: string;
  max_serial_number?: string;
  validnotafter_from?: string;
  validnotafter_to?: string;
  validnotbefore_from?: string;
  validnotbefore_to?: string;
  status?: string;
  ca?: string;
  sizeLimit?: number;
  startIdx?: number;
  stopIdx?: number;
}

const extendedApi = api.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Search certificates via cert_find
     * @param {CertFindPayload} - Search parameters
     * @returns {Certificate[]} - List of matching certificates
     */
    certFind: build.mutation<
      { certificates: Certificate[]; totalCount: number },
      CertFindPayload
    >({
      async queryFn(payloadData, _queryApi, _extraOptions, fetchWithBQ) {
        const {
          subject,
          issuer,
          serial_number,
          min_serial_number,
          max_serial_number,
          validnotafter_from,
          validnotafter_to,
          validnotbefore_from,
          validnotbefore_to,
          status,
          ca,
          sizeLimit,
          startIdx = 0,
          stopIdx,
        } = payloadData;

        // Build params, only including non-empty values
        const params: Record<string, unknown> = {
          all: true,
          version: API_VERSION_BACKUP,
        };

        if (sizeLimit !== undefined) {
          params.sizelimit = sizeLimit;
        }
        if (subject) params.subject = subject;
        if (issuer) params.issuer = issuer;
        if (serial_number) params.serial_number = serial_number;
        if (min_serial_number) params.min_serial_number = min_serial_number;
        if (max_serial_number) params.max_serial_number = max_serial_number;
        if (validnotafter_from) params.validnotafter_from = validnotafter_from;
        if (validnotafter_to) params.validnotafter_to = validnotafter_to;
        if (validnotbefore_from)
          params.validnotbefore_from = validnotbefore_from;
        if (validnotbefore_to) params.validnotbefore_to = validnotbefore_to;
        if (status) params.status = status;
        if (ca) params.ca = ca;

        const findResult = await fetchWithBQ(
          getCommand({
            method: "cert_find",
            params: [[], params],
          })
        );

        if (findResult.error) {
          return { error: findResult.error as FetchBaseQueryError };
        }

        const findResponse = findResult.data as FindRPCResponse;
        const allResults = findResponse.result.result as unknown as Record<
          string,
          unknown
        >[];
        const totalCount = allResults.length;

        // Apply pagination
        const end = stopIdx !== undefined ? stopIdx : totalCount;
        const paginatedResults = allResults.slice(startIdx, end);

        const certificates: Certificate[] = paginatedResults.map((record) =>
          apiToCertificate(record)
        );

        return {
          data: { certificates, totalCount },
        };
      },
    }),
    /**
     * Get a single certificate by serial number via cert_show
     * @param {number} serialNumber - Certificate serial number
     * @returns {Certificate} - Certificate data
     */
    certShow: build.query<Certificate, number>({
      query: (serialNumber) => {
        return getCommand({
          method: "cert_show",
          params: [[serialNumber], { all: true, version: API_VERSION_BACKUP }],
        });
      },
      transformResponse: (response: FindRPCResponse): Certificate => {
        return apiToCertificate(
          response.result.result as unknown as Record<string, unknown>
        );
      },
    }),
  }),
  overrideExisting: false,
});

export const { useCertFindMutation, useCertShowQuery } = extendedApi;
