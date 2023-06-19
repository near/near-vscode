import * as vscode from 'vscode';
import { APP_NAME } from '../config';
import { KeyPair } from 'near-api-js';
import { addToContext, getFromContext } from '../extension';

export const addKeyForContract = async (context: vscode.ExtensionContext, localWorkspace: string) => {
  const contractId = await vscode.window.showInputBox({ placeHolder: 'Which contract do you want to call?' });
  const accountId = getFromContext(localWorkspace, "accountId");
  
  if(!accountId){
    return vscode.window.showErrorMessage('Please login first');
  }

  if (contractId) {
    const publisher = context.extension.packageJSON.publisher;
    const name = context.extension.packageJSON.name;
    const callback = `${vscode.env.uriScheme}://${publisher}.${name}`;

    // Create a private key to interact with the social contract
    const keyPair = KeyPair.fromRandom("ED25519");
    const publicKey = keyPair.getPublicKey().toString();

    // Save the private access key in context.json 
    await addToContext(localWorkspace, 'accessKey', keyPair.toString());

    context.globalState.update('addKeyForContract', true);

    // Create the login URL and redirect the user to login
    const networkId = await getFromContext(localWorkspace, 'networkId') || "mainnet";

    let url = `https://wallet.${networkId}.near.org/login/?title=${APP_NAME}&success_url=${callback}&contract_id=${contractId}&public_key=${publicKey}&account_id=${accountId}`;
    vscode.env.openExternal(vscode.Uri.parse(url));
  } else {
    vscode.window.showErrorMessage('Invalid Contract ID');
  }
};