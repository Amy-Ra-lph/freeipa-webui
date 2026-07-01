// Data types
import { CertProfile } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

export const asRecord = (
  element: Partial<CertProfile>,
  onElementChange: (element: Partial<CertProfile>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as CertProfile);
  }

  return { ipaObject, recordOnChange };
};

const simpleValues = new Set(["cn", "description", "dn"]);
const dateValues = new Set<string>([]);

export function apiToCertProfile(
  apiRecord: Record<string, unknown>
): CertProfile {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<CertProfile>;

  return {
    ...createEmptyCertProfile(),
    ...converted,
    ipacertprofilestoreissued:
      apiRecord.ipacertprofilestoreissued !== undefined
        ? Array.isArray(apiRecord.ipacertprofilestoreissued)
          ? apiRecord.ipacertprofilestoreissued[0] === true ||
            apiRecord.ipacertprofilestoreissued[0] === "TRUE"
          : apiRecord.ipacertprofilestoreissued === true
        : false,
  };
}

export function partialCertProfileToCertProfile(
  partial: Partial<CertProfile>
): CertProfile {
  return {
    ...createEmptyCertProfile(),
    ...partial,
  };
}

export function createEmptyCertProfile(): CertProfile {
  return {
    cn: "",
    description: "",
    ipacertprofilestoreissued: false,
    dn: "",
  };
}
