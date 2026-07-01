// Data types
import { Permission } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

export const asRecord = (
  element: Partial<Permission>,
  onElementChange: (element: Partial<Permission>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as Permission);
  }

  return { ipaObject, recordOnChange };
};

const simpleValues = new Set([
  "cn",
  "description",
  "dn",
  "ipapermbindruletype",
  "ipapermlocation",
  "ipapermtarget",
  "ipapermtargetfilter",
  "ipapermtargetto",
  "ipapermtargetfrom",
  "type",
  "memberof",
]);
const dateValues = new Set([]);

export function apiToPermission(
  apiRecord: Record<string, unknown>
): Permission {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<Permission>;

  return {
    ...createEmptyPermission(),
    ...converted,
    ipapermright: (apiRecord.ipapermright as string[]) || [],
    extratargetfilter: (apiRecord.extratargetfilter as string[]) || [],
    attrs: (apiRecord.attrs as string[]) || [],
    member_privilege: (apiRecord.member_privilege as string[]) || [],
  };
}

export function partialPermissionToPermission(
  partialPermission: Partial<Permission>
): Permission {
  return {
    ...createEmptyPermission(),
    ...partialPermission,
  };
}

export function createEmptyPermission(): Permission {
  const permission: Permission = {
    cn: "",
    description: "",
    dn: "",
    ipapermright: [],
    ipapermbindruletype: "",
    ipapermlocation: "",
    ipapermtarget: "",
    ipapermtargetfilter: "",
    ipapermtargetto: "",
    ipapermtargetfrom: "",
    extratargetfilter: [],
    attrs: [],
    type: "",
    memberof: "",
    member_privilege: [],
  };

  return permission;
}
