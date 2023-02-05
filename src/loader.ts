import { providers } from "near-api-js";

const provider = new providers.JsonRpcProvider({ url: "https://rpc.near.org" });
const callsCache: any = {};

export const callRpc = async (
  loadKey: string,
  providerQuery: any
): Promise<any> => {
  if (callsCache[loadKey]) {
    console.log("%% returning from cache", loadKey);
    return callsCache[loadKey];
  }
  console.log("%% calling rpc", loadKey);
  const callPromise = provider.query(providerQuery);
  callsCache[loadKey] = callPromise;
  callPromise.finally(() => (callsCache[loadKey] = null));
  return callsCache[loadKey];
};
