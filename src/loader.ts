import { providers } from "near-api-js";
import { window } from "vscode";
import * as naj from 'near-api-js';
import BN from 'bn.js';
import { COST_PER_BYTE, SOCIAL_CONTRACT_ACCOUNT, TGAS30 } from "./util";

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
  const actions = [naj.transactions.functionCall('set', data, TGAS30, amount)];
  const transaction = naj.transactions.createTransaction(accountId, publicKey, SOCIAL_CONTRACT_ACCOUNT, 0, actions, blockHash);
  
  //@ts-ignore
  return transaction.encode().toString('base64');
};

export const getTransactionResult = async (txhash: string): Promise<any> => {

    // Retrieve transaction result from the network
    const transaction = await provider.txStatus(txhash, 'unnused');
    return providers.getTransactionLastResult(transaction);
}