// Data types
import { CertACL } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

export const asRecord = (
  element: Partial<CertACL>,
  onElementChange: (element: Partial<CertACL>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as CertACL);
  }

  return { ipaObject, recordOnChange };
};

const simpleValues = new Set([
  "cn",
  "description",
  "dn",
  "ipacacategory",
  "ipacertprofilecategory",
  "usercategory",
  "hostcategory",
  "servicecategory",
]);
const dateValues = new Set([]);

export function apiToCACL(apiRecord: Record<string, unknown>): CertACL {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<CertACL>;

  // Handle ipaenabledflag boolean conversion
  let enabledFlag = false;
  const rawFlag = apiRecord.ipaenabledflag;
  if (Array.isArray(rawFlag)) {
    if (typeof rawFlag[0] === "boolean") {
      enabledFlag = rawFlag[0];
    } else if (typeof rawFlag[0] === "string") {
      enabledFlag = rawFlag[0].toUpperCase() === "TRUE";
    }
  } else if (typeof rawFlag === "boolean") {
    enabledFlag = rawFlag;
  } else if (typeof rawFlag === "string") {
    enabledFlag = rawFlag.toUpperCase() === "TRUE";
  }

  return {
    ...createEmptyCACL(),
    ...converted,
    ipaenabledflag: enabledFlag,
    ipamemberca_ca: (apiRecord.ipamemberca_ca as string[]) || [],
    ipamembercertprofile_certprofile:
      (apiRecord.ipamembercertprofile_certprofile as string[]) || [],
    memberuser_user: (apiRecord.memberuser_user as string[]) || [],
    memberuser_group: (apiRecord.memberuser_group as string[]) || [],
    memberhost_host: (apiRecord.memberhost_host as string[]) || [],
    memberhost_hostgroup: (apiRecord.memberhost_hostgroup as string[]) || [],
    memberservice_service: (apiRecord.memberservice_service as string[]) || [],
  };
}

export function partialCACLToCACL(partialCACL: Partial<CertACL>): CertACL {
  return {
    ...createEmptyCACL(),
    ...partialCACL,
  };
}

export function createEmptyCACL(): CertACL {
  const cacl: CertACL = {
    cn: "",
    description: "",
    ipaenabledflag: false,
    ipacacategory: "",
    ipacertprofilecategory: "",
    usercategory: "",
    hostcategory: "",
    servicecategory: "",
    ipamemberca_ca: [],
    ipamembercertprofile_certprofile: [],
    memberuser_user: [],
    memberuser_group: [],
    memberhost_host: [],
    memberhost_hostgroup: [],
    memberservice_service: [],
    dn: "",
  };

  return cacl;
}
