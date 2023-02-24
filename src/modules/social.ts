import { providers, transactions } from "near-api-js";
import { window } from "vscode";
import { COST_PER_BYTE, SOCIAL_CONTRACT_ACCOUNT, TGAS30 } from "../config";
import BN from "bn.js";
import * as naj from "near-api-js";
import { FinalExecutionOutcome } from "near-api-js/lib/providers";

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

export const getWidgetCode = async (accountId: AccountId, widgetName: string): Promise<string> => {
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

export const  transactionForPublishingCode = async (accountId: AccountId, widgetName: string, code: string): Promise<string> => {
  // Data to store
  const update = `{"${accountId}": {"widget": {"${widgetName}": {"": ${JSON.stringify(code)}}}}}`;
  const data = {data: JSON.parse(update)};

  // To create a transaction, we need to fill the `publicKey` field, but that field is not used later
  const keyPair =  naj.utils.KeyPairEd25519.fromRandom();
  const publicKey = keyPair.getPublicKey();

  // To create a transaction we need a recent block
  const block = await provider.block({ finality: 'final' });
  const blockHash = naj.utils.serialize.base_decode(block.header.hash);

  // Amount to pay, based on the size of the data we are storing
  // TODO: Improve this
  const amount = new BN(JSON.stringify(data).length).mul(COST_PER_BYTE);

  // Create the transaction
  const actions = [transactions.functionCall('set', data, TGAS30, amount)];
  const transaction = transactions.createTransaction(accountId, publicKey, SOCIAL_CONTRACT_ACCOUNT, 0, actions, blockHash);
  
  //@ts-ignore
  return transaction.encode().toString('base64');
};

// RPC Call
export const socialViewMethod = async (methodName: String, args: any): Promise<any> => {
  console.log("RPC", args);

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

export const getTransactionStatus = async (txhash: string): Promise<FinalExecutionOutcome["status"]> => {

    // Retrieve transaction result from the network
    const transaction = await provider.txStatus(txhash, 'unnused');
    return transaction.status;
}