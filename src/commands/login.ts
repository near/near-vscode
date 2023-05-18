import * as vscode from 'vscode';
import { APP_NAME } from '../config';
import { KeyPair } from 'near-api-js';
import { addToContext } from '../extension';

export const loginAccount = async (context: vscode.ExtensionContext, network: string, localWorkspace: string) => {
  const publisher = context.extension.packageJSON.publisher;
  const name = context.extension.packageJSON.name;
  const callback = `${vscode.env.uriScheme}://${publisher}.${name}`;

  // Create a private key to interact with the social contract
  const contractId = "social.near";
  const keyPair = KeyPair.fromRandom("ED25519");
  const publicKey = keyPair.getPublicKey().toString();

  // Save the private access key in context.json 
  await addToContext(localWorkspace, 'accessKey', keyPair.toString());

  // Create the login URL and redirect the user to login
  let url = `https://wallet.${network}.near.org/login/?title=${APP_NAME}&success_url=${callback}&contract_id=${contractId}&public_key=${publicKey}`;
  vscode.env.openExternal(vscode.Uri.parse(url));
};