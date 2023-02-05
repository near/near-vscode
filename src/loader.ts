import { providers } from "near-api-js";
import { window } from "vscode";

const provider = new providers.JsonRpcProvider({ url: "https://rpc.near.org" });
const callsCache: any = {};

export const callRpc = async (
  title: string,
  loadKey: string,
  providerQuery: any
): Promise<any> => {
  if (callsCache[loadKey]) {
    return callsCache[loadKey];
  }
  console.log("%% calling rpc", loadKey);
  const callPromise = provider.query(providerQuery);
  callsCache[loadKey] = callPromise;
  callPromise.catch(e => {
    const result = window.showErrorMessage(`Error loading: ${title}`);
  });
  callPromise.finally(() => (callsCache[loadKey] = null));
  return callsCache[loadKey];
};
