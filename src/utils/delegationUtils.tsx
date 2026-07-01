// Data types
import { DelegationPermission } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

export const asRecord = (
  element: Partial<DelegationPermission>,
  onElementChange: (element: Partial<DelegationPermission>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as DelegationPermission);
  }

  return { ipaObject, recordOnChange };
};

const simpleValues = new Set(["aciname", "group", "memberof", "dn"]);
const dateValues = new Set([]);

export function apiToDelegation(
  apiRecord: Record<string, unknown>
): DelegationPermission {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<DelegationPermission>;

  return {
    ...createEmptyDelegation(),
    ...converted,
    attrs: (apiRecord.attrs as string[]) || [],
    permissions: (apiRecord.permissions as string[]) || [],
  };
}

export function partialDelegationToDelegation(
  partialDelegation: Partial<DelegationPermission>
): DelegationPermission {
  return {
    ...createEmptyDelegation(),
    ...partialDelegation,
  };
}

export function createEmptyDelegation(): DelegationPermission {
  const delegation: DelegationPermission = {
    aciname: "",
    attrs: [],
    group: "",
    memberof: "",
    permissions: [],
    dn: "",
  };

  return delegation;
}
