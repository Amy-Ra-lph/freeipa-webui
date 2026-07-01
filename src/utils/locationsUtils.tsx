// Data types
import { Location } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

export const asRecord = (
  element: Partial<Location>,
  onElementChange: (element: Partial<Location>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as Location);
  }

  return { ipaObject, recordOnChange };
};

const simpleValues = new Set(["idnsname", "description", "dn"]);
const dateValues = new Set([]);

export function apiToLocation(
  apiRecord: Record<string, unknown>
): Location {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<Location>;

  return {
    ...createEmptyLocation(),
    ...converted,
    servers_server: (apiRecord.servers_server as string[]) || [],
  };
}

export function partialLocationToLocation(
  partialLocation: Partial<Location>
): Location {
  return {
    ...createEmptyLocation(),
    ...partialLocation,
  };
}

export function createEmptyLocation(): Location {
  const location: Location = {
    idnsname: "",
    description: "",
    servers_server: [],
    dn: "",
  };

  return location;
}
