import * as vscode from 'vscode';
import { APP_NAME, contractAccountForNetwork } from '../config';
import { KeyPair } from 'near-api-js';
import { addToContext, getFromContext } from '../extension';

export const loginAccount = async (context: vscode.ExtensionContext, localWorkspace: string) => {
  const publisher = context.extension.packageJSON.publisher;
  const name = context.extension.packageJSON.name;
  const callback = `${vscode.env.uriScheme}://${publisher}.${name}`;

  // Create a private key to interact with the social contract
  const keyPair = KeyPair.fromRandom("ED25519");
  const publicKey = keyPair.getPublicKey().toString();

  // Save the private access key in context.json 
  await addToContext(localWorkspace, 'accessKey', keyPair.toString());

  const networkId = await getFromContext(localWorkspace, 'networkId') || "mainnet";
  const contractId = contractAccountForNetwork(networkId);

  // Create the login URL and redirect the user to login
  let url = `https://wallet.${networkId}.near.org/login/?title=${APP_NAME}&success_url=${callback}&contract_id=${contractId}&public_key=${publicKey}&methodNames=set`;
  vscode.env.openExternal(vscode.Uri.parse(url));
};