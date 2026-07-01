// Data types
import { SelfServicePermission } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

export const asRecord = (
  element: Partial<SelfServicePermission>,
  onElementChange: (element: Partial<SelfServicePermission>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as SelfServicePermission);
  }

  return { ipaObject, recordOnChange };
};

const simpleValues = new Set(["aciname", "dn"]);
const dateValues = new Set([]);

export function apiToSelfService(
  apiRecord: Record<string, unknown>
): SelfServicePermission {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<SelfServicePermission>;

  return {
    ...createEmptySelfService(),
    ...converted,
    attrs: (apiRecord.attrs as string[]) || [],
  };
}

export function partialSelfServiceToSelfService(
  partialSelfService: Partial<SelfServicePermission>
): SelfServicePermission {
  return {
    ...createEmptySelfService(),
    ...partialSelfService,
  };
}

export function createEmptySelfService(): SelfServicePermission {
  const selfService: SelfServicePermission = {
    aciname: "",
    attrs: [],
    dn: "",
  };

  return selfService;
}
