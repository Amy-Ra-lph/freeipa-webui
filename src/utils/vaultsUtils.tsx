// Data types
import { Vault } from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

export const asRecord = (
  element: Partial<Vault>,
  onElementChange: (element: Partial<Vault>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as Vault);
  }

  return { ipaObject, recordOnChange };
};

const simpleValues = new Set([
  "cn",
  "description",
  "ipavaulttype",
  "ipavaultsalt",
  "ipavaultpublickey",
  "dn",
]);
const dateValues = new Set([]);

export function apiToVault(apiRecord: Record<string, unknown>): Vault {
  const converted = convertApiObj(
    apiRecord,
    simpleValues,
    dateValues
  ) as Partial<Vault>;

  return {
    ...createEmptyVault(),
    ...converted,
    owner_user: (apiRecord.owner_user as string[]) || [],
    owner_group: (apiRecord.owner_group as string[]) || [],
    owner_service: (apiRecord.owner_service as string[]) || [],
    member_user: (apiRecord.member_user as string[]) || [],
    member_group: (apiRecord.member_group as string[]) || [],
    member_service: (apiRecord.member_service as string[]) || [],
  };
}

export function partialVaultToVault(partialVault: Partial<Vault>): Vault {
  return {
    ...createEmptyVault(),
    ...partialVault,
  };
}

export function createEmptyVault(): Vault {
  const vault: Vault = {
    cn: "",
    description: "",
    ipavaulttype: "standard",
    ipavaultsalt: "",
    ipavaultpublickey: "",
    owner_user: [],
    owner_group: [],
    owner_service: [],
    member_user: [],
    member_group: [],
    member_service: [],
    dn: "",
  };

  return vault;
}
