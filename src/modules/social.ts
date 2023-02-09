import { providers } from "near-api-js";
import { window } from "vscode";
import { SOCIAL_CONTRACT_ACCOUNT } from "../config";

const provider = new providers.JsonRpcProvider({ url: "https://rpc.near.org" });

export const getWidgetsNames = async (accountId: AccountId): Promise<string[]> => {
  const args = { keys: [`${accountId}/widget/*`] };
  let result = await socialViewMethod('keys', args);
  let retObj = JSON.parse(Buffer.from(result.result).toString());
  try {
    return Object.keys(retObj[accountId]["widget"]);
  } catch (e) {
    window.showErrorMessage(`Error loading widgets for ${accountId}`);
    return [];
  };
};

export const getWidgetCode = async (accountId: AccountId, widgetName: string): Promise<String> => {
  const args = { keys: [`${accountId}/widget/${widgetName}`] };
  let result = await socialViewMethod('get', args);
  let retObj = JSON.parse(Buffer.from(result.result).toString());

  try {
    return retObj[accountId]["widget"][widgetName];
  } catch (e) {
    window.showErrorMessage(`Error loading the code for ${accountId}/widget/${widgetName}`);
    return "";
  };
};

// RPC Call
export const socialViewMethod = async (methodName: String, args: any): Promise<any> => {
  const promise = provider.query({
    request_type: 'call_function',
    account_id: SOCIAL_CONTRACT_ACCOUNT,
    method_name: methodName,
    args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
    finality: 'optimistic',
  });

  promise.catch(e => {
    window.showErrorMessage(`Error Querying NEAR Social: ${methodName}, ${args}`);
    return {};
  });
  return promise;
};