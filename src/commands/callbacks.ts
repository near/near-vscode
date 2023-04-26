import * as vscode from 'vscode';
import { getTransactionStatus } from '../modules/social';
import { SocialFS } from '../modules/file-system/fs';

export const handleTransactionCallback = async (uri: vscode.Uri, context: vscode.ExtensionContext, localWorkspace: string | undefined, fileSystem: SocialFS) => {
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
  }

  // Passing an AccountID
  if (queryParams.has('account_id')) {
    const accountId = queryParams.get('account_id') as string;

    await fileSystem.addToContext('accountId', accountId);
    await fileSystem.addToContext('networkId', "mainnet");

    if (localWorkspace) {
      vscode.commands.executeCommand("near.openWidgetsFromAccount", accountId);
    } else {
      context.workspaceState.update('openAccount', accountId);
      vscode.commands.executeCommand("near.chooseLocalPath");
    }
  }
};