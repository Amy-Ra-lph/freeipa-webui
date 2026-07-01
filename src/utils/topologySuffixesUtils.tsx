// Data types
import { TopologySuffix } from "src/utils/datatypes/globalDataTypes";
// Utils - re-export from topologyUtils
export {
  apiToTopologySuffix,
  partialTopologySuffixToTopologySuffix,
} from "./topologyUtils";

export const asRecord = (
  element: Partial<TopologySuffix>,
  onElementChange: (element: Partial<TopologySuffix>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as TopologySuffix);
  }

  return { ipaObject, recordOnChange };
};

// createEmptyTopologySuffix is not exported from topologyUtils, so define here
export function createEmptyTopologySuffix(): TopologySuffix {
  return {
    cn: "",
    iparepltopoconfroot: "",
    dn: "",
  };
}
