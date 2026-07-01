// Data types
import { Certificate } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

const simpleValues = new Set([
  "serial_number",
  "certificate",
  "subject",
  "issuer",
  "serial_number_hex",
  "sha1_fingerprint",
  "sha256_fingerprint",
  "status",
]);
const dateValues = new Set(["valid_not_before", "valid_not_after"]);

export function apiToCertificate(
  apiRecord: Record<string, unknown>
): Certificate {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<Certificate>;

  return {
    ...createEmptyCertificate(),
    ...converted,
    cacn: (apiRecord.cacn as string) || undefined,
    certificate_chain: (apiRecord.certificate_chain as string[]) || undefined,
    san_rfc822name: (apiRecord.san_rfc822name as string[]) || undefined,
    owner_user: (apiRecord.owner_user as string[]) || [],
    revocation_reason: apiRecord.revocation_reason as number | undefined,
    revoked: apiRecord.revoked as boolean | undefined,
  };
}

export function createEmptyCertificate(): Certificate {
  const certificate: Certificate = {
    serial_number: "",
    certificate: "",
    subject: "",
    issuer: "",
    serial_number_hex: "",
    valid_not_before: "",
    valid_not_after: "",
    sha1_fingerprint: "",
    sha256_fingerprint: "",
    owner_user: [],
  };

  return certificate;
}
