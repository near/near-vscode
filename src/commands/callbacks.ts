import * as vscode from 'vscode';
import { getTransactionStatus } from '../modules/social';
import { addToContext } from '../extension';

export const handleTransactionCallback = async (uri: vscode.Uri, context: vscode.ExtensionContext, localWorkspace: string | undefined) => {
  const queryParams = new URLSearchParams(uri.query);

  // Transaction callback
  if (queryParams.has('transactionHashes')) {
    const tHash = queryParams.get('transactionHashes') as string;

    const result = await getTransactionStatus(tHash);
    const explorerURL = `https://explorer.near.org/transactions/${tHash}`;
    const action = (selection?: string) => { selection ? vscode.env.openExternal(vscode.Uri.parse(explorerURL)) : ""; };

    if (result.succeeded) {
      vscode.window.showInformationMessage("Successfully Published", "View in Explorer")
        .then(action);
    } else {
      vscode.window.showErrorMessage(`Error: ${result.error}`, "View in Explorer")
        .then(action);
    }

    return;
  }

  // Passing an AccountID
  if (queryParams.has('account_id')) {
    const accountId = queryParams.get('account_id') as string;

    await addToContext(localWorkspace, 'accountId', accountId);
    await addToContext(localWorkspace, 'networkId', "mainnet");

    if(context.globalState.get('addKeyForContract') === true){
      context.globalState.update('addKeyForContract', false);
      vscode.window.showInformationMessage(`Successfully added key for account ${accountId}`);
      return;
    }

    if (localWorkspace) {
      vscode.commands.executeCommand("near.openWidgetsFromAccount", accountId);
    }
  }
};