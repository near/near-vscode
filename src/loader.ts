import { providers } from "near-api-js";
import { ProgressLocation, window } from "vscode";

const provider = new providers.JsonRpcProvider({ url: "https://rpc.near.org" });
const callsCache: any = {};

export const callRpc = async (
  accountId: string,
  loadKey: string,
  providerQuery: any
): Promise<any> => {
  if (callsCache[loadKey]) {
    return callsCache[loadKey];
  }
  console.log("%% calling rpc", loadKey);
  const callPromise = provider.query(providerQuery);
  callsCache[loadKey] = callPromise;
  return new Promise((resolve, reject) => {
    window.withProgress(
      {
        location: ProgressLocation.Window,
        title: `NEAR: updating account ${accountId}`,
        cancellable: false,
      },
      async (progress, token) => {
        try {
          const result = await callsCache[loadKey];
          resolve(result);
          console.log("** finished rpc", loadKey);
        } catch (e) {
          window.showErrorMessage(`Error loading: ${accountId}`);
          console.log("&& error rpc", loadKey);
          reject(e);
        } finally {
          callsCache[loadKey] = null;
        }
      }
    );
  });
};
