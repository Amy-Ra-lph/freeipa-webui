// Data types
import { CertificateAuthority } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

export const asRecord = (
  element: Partial<CertificateAuthority>,
  onElementChange: (element: Partial<CertificateAuthority>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as CertificateAuthority);
  }

  return { ipaObject, recordOnChange };
};

// dn is the only simple (string) value; all others are string arrays
const simpleValues = new Set(["dn"]);
const dateValues = new Set<string>([]);

export function apiToCertAuthority(
  apiRecord: Record<string, unknown>
): CertificateAuthority {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<CertificateAuthority>;

  return {
    ...createEmptyCertAuthority(),
    ...converted,
    cn: (apiRecord.cn as string[]) || [],
    description: (apiRecord.description as string[]) || [],
    ipacaid: (apiRecord.ipacaid as string[]) || [],
    ipacaissuerdn: (apiRecord.ipacaissuerdn as string[]) || [],
    ipacarandomserialnumberversion:
      (apiRecord.ipacarandomserialnumberversion as string[]) || [],
    ipacasubjectdn: (apiRecord.ipacasubjectdn as string[]) || [],
  };
}

export function partialCertAuthorityToCertAuthority(
  partial: Partial<CertificateAuthority>
): CertificateAuthority {
  return {
    ...createEmptyCertAuthority(),
    ...partial,
  };
}

export function createEmptyCertAuthority(): CertificateAuthority {
  const ca: CertificateAuthority = {
    cn: [],
    description: [],
    dn: "",
    ipacaid: [],
    ipacaissuerdn: [],
    ipacarandomserialnumberversion: [],
    ipacasubjectdn: [],
  };

  return ca;
}
