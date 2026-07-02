// Data types
import {
  OAuth2Delegation,
  OAuth2Client,
  OAuth2Scope,
  OAuth2Workload,
} from "src/utils/datatypes/globalDataTypes";
// Utils
import { convertApiObj } from "./ipaObjectUtils";

// OAuth2Delegation utilities
const delegationSimpleValues = new Set([
  "cn",
  "description",
  "oauth2delegatesource",
  "oauth2enabled",
  "oauth2requireattestation",
  "oauth2delegatenotafter",
  "dn",
]);
const delegationDateValues = new Set([]);

export function apiToOAuth2Delegation(
  apiRecord: Record<string, unknown>
): OAuth2Delegation {
  const converted = convertApiObj(
    apiRecord,
    delegationSimpleValues,
    delegationDateValues
  ) as Partial<OAuth2Delegation>;
  return partialOAuth2DelegationToOAuth2Delegation(converted) as OAuth2Delegation;
}

export function partialOAuth2DelegationToOAuth2Delegation(
  partialDelegation: Partial<OAuth2Delegation>
): OAuth2Delegation {
  return {
    ...createEmptyOAuth2Delegation(),
    ...partialDelegation,
  };
}

export function createEmptyOAuth2Delegation(): OAuth2Delegation {
  const delegation: OAuth2Delegation = {
    cn: "",
    description: "",
    oauth2delegatesource: "",
    oauth2delegatetarget: [],
    oauth2delegatescope: [],
    oauth2delegatehostgroup: [],
    oauth2delegateservice: [],
    oauth2delegatenotafter: "",
    oauth2requireattestation: false,
    oauth2enabled: true,
    dn: "",
  };

  return delegation;
}

export const asOAuth2DelegationRecord = (
  element: Partial<OAuth2Delegation>,
  onElementChange: (element: Partial<OAuth2Delegation>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as OAuth2Delegation);
  }

  return { ipaObject, recordOnChange };
};

// OAuth2Client utilities
const clientSimpleValues = new Set([
  "cn",
  "description",
  "oauth2clientid",
  "oauth2clienttype",
  "oauth2tokenlifetime",
  "oauth2enabled",
  "dn",
]);
const clientDateValues = new Set([]);

export function apiToOAuth2Client(
  apiRecord: Record<string, unknown>
): OAuth2Client {
  const converted = convertApiObj(
    apiRecord,
    clientSimpleValues,
    clientDateValues
  ) as Partial<OAuth2Client>;
  return partialOAuth2ClientToOAuth2Client(converted) as OAuth2Client;
}

export function partialOAuth2ClientToOAuth2Client(
  partialClient: Partial<OAuth2Client>
): OAuth2Client {
  return {
    ...createEmptyOAuth2Client(),
    ...partialClient,
  };
}

export function createEmptyOAuth2Client(): OAuth2Client {
  const client: OAuth2Client = {
    cn: "",
    description: "",
    oauth2clientid: "",
    oauth2clienttype: "",
    oauth2granttype: [],
    oauth2redirecturi: [],
    oauth2scope: [],
    oauth2tokenlifetime: "",
    oauth2enabled: true,
    dn: "",
  };

  return client;
}

export const asOAuth2ClientRecord = (
  element: Partial<OAuth2Client>,
  onElementChange: (element: Partial<OAuth2Client>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as OAuth2Client);
  }

  return { ipaObject, recordOnChange };
};

// OAuth2Scope utilities
const scopeSimpleValues = new Set([
  "cn",
  "description",
  "oauth2scope",
  "oauth2enabled",
  "dn",
]);
const scopeDateValues = new Set([]);

export function apiToOAuth2Scope(
  apiRecord: Record<string, unknown>
): OAuth2Scope {
  const converted = convertApiObj(
    apiRecord,
    scopeSimpleValues,
    scopeDateValues
  ) as Partial<OAuth2Scope>;
  return partialOAuth2ScopeToOAuth2Scope(converted) as OAuth2Scope;
}

export function partialOAuth2ScopeToOAuth2Scope(
  partialScope: Partial<OAuth2Scope>
): OAuth2Scope {
  return {
    ...createEmptyOAuth2Scope(),
    ...partialScope,
  };
}

export function createEmptyOAuth2Scope(): OAuth2Scope {
  const scope: OAuth2Scope = {
    cn: "",
    description: "",
    oauth2scope: "",
    oauth2enabled: true,
    dn: "",
  };

  return scope;
}

export const asOAuth2ScopeRecord = (
  element: Partial<OAuth2Scope>,
  onElementChange: (element: Partial<OAuth2Scope>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as OAuth2Scope);
  }

  return { ipaObject, recordOnChange };
};

// OAuth2Workload utilities
const workloadSimpleValues = new Set([
  "cn",
  "description",
  "oauth2workloadtype",
  "oauth2spiffeid",
  "oauth2workloadowner",
  "oauth2workloadclient",
  "oauth2workloadserviceprincipal",
  "oauth2workloadmaxtokenlifetime",
  "oauth2workloadvendor",
  "oauth2workloadcardttl",
  "oauth2enabled",
  "dn",
]);
const workloadDateValues = new Set([]);

export function apiToOAuth2Workload(
  apiRecord: Record<string, unknown>
): OAuth2Workload {
  const converted = convertApiObj(
    apiRecord,
    workloadSimpleValues,
    workloadDateValues
  ) as Partial<OAuth2Workload>;
  return partialOAuth2WorkloadToOAuth2Workload(converted) as OAuth2Workload;
}

export function partialOAuth2WorkloadToOAuth2Workload(
  partialWorkload: Partial<OAuth2Workload>
): OAuth2Workload {
  return {
    ...createEmptyOAuth2Workload(),
    ...partialWorkload,
  };
}

export function createEmptyOAuth2Workload(): OAuth2Workload {
  const workload: OAuth2Workload = {
    cn: "",
    description: "",
    oauth2workloadtype: "",
    oauth2spiffeid: "",
    oauth2workloadowner: "",
    oauth2workloadclient: "",
    oauth2workloadserviceprincipal: "",
    oauth2workloadmaxtokenlifetime: "",
    oauth2workloadvendor: "",
    oauth2workloadskill: [],
    oauth2workloadcardttl: "",
    oauth2enabled: true,
    dn: "",
  };

  return workload;
}

export const asOAuth2WorkloadRecord = (
  element: Partial<OAuth2Workload>,
  onElementChange: (element: Partial<OAuth2Workload>) => void
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ipaObject = element as Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recordOnChange(ipaObject: Record<string, any>) {
    onElementChange(ipaObject as OAuth2Workload);
  }

  return { ipaObject, recordOnChange };
};
