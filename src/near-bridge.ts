import {Near} from 'near-api-js';

const { providers } = require("near-api-js");
const provider = new providers.JsonRpcProvider("https://rpc.near.org");

export type AccountId = string;
export interface NearWidget {
  name: string;
  code: string;
}

let widgets: Record<AccountId, NearWidget[]> = {};


export const getWidgetsFromChain = async (accountId: string, forceRefresh = false): Promise<NearWidget[]> => {
  if (!forceRefresh && widgets[accountId]) {
    return widgets[accountId];
  }
  const args = Buffer.from(`{"keys":["${accountId}/widget/**"]}`).toString(
    "base64"
  );
  const rawResult = await provider.query({
    request_type: "call_function",
    account_id: "social.near",
    method_name: "get",
    args_base64: args,
    finality: "optimistic",
  });
  const res = JSON.parse(Buffer.from(rawResult.result).toString());
  const rawWidgets = res[accountId]?.widget || {};
  const w: NearWidget[] = Object.entries(rawWidgets).map(
    ([name, data]: [string, any]) => ({
      name,
      code: typeof data === "object" ? data[""] : "//",
    })
  );
  console.log(w);
  widgets[accountId] = w;
  return widgets[accountId];
};
