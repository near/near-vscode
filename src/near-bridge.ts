const { providers } = require("near-api-js");
const provider = new providers.JsonRpcProvider("https://rpc.near.org");

let widgets: NearWidget[] | null = null;

export interface NearWidget {
  name: string;
  code: string;
}

export const getWidgetsFromChain = async (accountId: string): Promise<any> => {
  if (widgets !== null) {
    return;
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
      code: typeof data === "object" ? data[""] : "ERROR_GETTING_WIDGET_CODE",
    })
  );
  console.log(w);
  widgets = w;
};

export const getAccountWidgetsNames = async (
  accountId: string
): Promise<string[]> => {
  await getWidgetsFromChain(accountId);
  if (widgets !== null) {
    return widgets.map((w) => w.name);
  } else {
    return [];
  }
};

export const readWidgetCode = async (
  accountId: string,
  widgetName: string
): Promise<string | null> => {
  await getWidgetsFromChain(accountId);
  if (widgets !== null) {
    return widgets.find((w) => w.name === widgetName)?.code || null;
  } else {
    return null;
  }
};
