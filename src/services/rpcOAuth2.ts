import { useGettingGenericQuery } from "./rpc";

export const useGettingOAuth2ClientsQuery = (payloadData) => {
  payloadData["objName"] = "oauth2client";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData);
};

export const useGettingOAuth2ScopesQuery = (payloadData) => {
  payloadData["objName"] = "oauth2scope";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData);
};

export const useGettingOAuth2WorkloadsQuery = (payloadData) => {
  payloadData["objName"] = "oauth2workload";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData);
};

export const useGettingOAuth2DelegationsQuery = (payloadData) => {
  payloadData["objName"] = "oauth2delegation";
  payloadData["objAttr"] = "cn";
  return useGettingGenericQuery(payloadData);
};
