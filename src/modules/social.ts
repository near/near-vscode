import { providers, transactions } from "near-api-js";
import { window } from "vscode";
import { COST_PER_BYTE, DATA_OVERHEAD, SOCIAL_CONTRACT_ACCOUNT, TGAS30, contractAccountForNetwork, networkRPC } from "../config";
import BN from "bn.js";
import * as naj from "near-api-js";


export const getWidgetsNames = async (accountId: AccountId, networkId: string): Promise<string[]> => {
  const args = { keys: [`${accountId}/widget/*`] };
  let result = await socialViewMethod('keys', args, networkId);
  let retObj = JSON.parse(Buffer.from(result.result).toString());
  try {
    return Object.keys(retObj[accountId]["widget"]);
  } catch (e) {
    window.showErrorMessage(`Error loading widgets for ${accountId}`);
    return [];
  };
};

export const getWidgetCode = async (accountId: AccountId, widgetName: string, networkId: string): Promise<string> => {
  const args = { keys: [`${accountId}/widget/${widgetName}`] };
  let result = await socialViewMethod('get', args, networkId);
  let retObj = JSON.parse(Buffer.from(result.result).toString());

  try {
    return retObj[accountId]["widget"][widgetName];
  } catch (e) {
    window.showErrorMessage(`Error loading the code for ${accountId}/widget/${widgetName}`);
    return "";
  };
};

export const transactionForPublishingCode = async (accountId: AccountId, widgetName: string, code: string, networkId: string): Promise<string> => {
  // Data to store
  const update = `{"${accountId}": {"widget": {"${widgetName}": {"": ${JSON.stringify(code)}}}}}`;
  const data = { data: JSON.parse(update) };
  const contractId = contractAccountForNetwork(networkId);

  // To create a transaction, we need to fill the `publicKey` field, but that field is not used later
  const keyPair = naj.utils.KeyPairEd25519.fromRandom();
  const publicKey = keyPair.getPublicKey();

  // To create a transaction we need a recent block
  const provider = new providers.JsonRpcProvider({ url: networkRPC(networkId) });
  const block = await provider.block({ finality: 'final' });
  const blockHash = naj.utils.serialize.base_decode(block.header.hash);

  // Amount to pay, based on the size of the data we are storing
  const widgetCode = await getWidgetCode(accountId, widgetName, networkId);

  let amount;

  if (widgetCode.length > 0) {
    const diff = JSON.stringify(code).length - JSON.stringify(widgetCode).length;
    amount = diff > 0 ? new BN(diff).mul(COST_PER_BYTE) : new BN(0);
  } else {
    amount = new BN(JSON.stringify(data).length + DATA_OVERHEAD).mul(COST_PER_BYTE);
  }

  // Create the transaction
  const actions = [transactions.functionCall('set', data, TGAS30, amount)];
  const transaction = transactions.createTransaction(accountId, publicKey, contractId, 0, actions, blockHash);

  //@ts-ignore
  return transaction.encode().toString('base64');
};

// RPC Call
export const socialViewMethod = async (methodName: String, args: any, networkId: string): Promise<any> => {

  const contractId = contractAccountForNetwork(networkId);
  const provider = new providers.JsonRpcProvider({ url: networkRPC(networkId) });

  const promise = provider.query({
    request_type: 'call_function',
    account_id: contractId,
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

export const getTransactionStatus = async (txhash: string, networkId: string): Promise<TxStatus> => {

  // Retrieve transaction result from the network
  const provider = new providers.JsonRpcProvider({ url: networkRPC(networkId) });
  const transaction = await provider.txStatus(txhash, 'unnused');

  let status = new TxStatus();
  status.succeeded = Object.hasOwn(transaction.status as object, "SuccessValue");

  if (!status.succeeded) {
    //@ts-ignore
    const { Failure: { ActionError: { kind: { FunctionCallError: { ExecutionError: errorMessage } } } } } = transaction.status;
    status.error = errorMessage;
  }
  return status;
};

class TxStatus {
  succeeded: boolean = false;
  error: string = "";
}