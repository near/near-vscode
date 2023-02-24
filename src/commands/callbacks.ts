import * as vscode from 'vscode';
import { getTransactionStatus } from '../modules/social';

export const handleTransactionCallback = async (uri: vscode.Uri) => {
  const queryParams = new URLSearchParams(uri.query);

  // Transaction callback
  if (queryParams.has('transactionHashes')) {
    const tHash = queryParams.get('transactionHashes') as string;

    const result = await getTransactionStatus(tHash);
    const explorerURL = `https://explorer.near.org/transactions/${tHash}`;
    const action = (selection?: string)=>{ selection? vscode.env.openExternal(vscode.Uri.parse(explorerURL)) : ""; };
    
    if(result.succeeded){
      vscode.window.showInformationMessage("Successfully Published", "View in Explorer")
      .then(action);
    }else{
      vscode.window.showErrorMessage(`Error: ${result.error}`, "View in Explorer")
      .then(action);
    }
  }

  // Login callback
  if (queryParams.has('account_id')) {
    const accountId = queryParams.get('account_id') as string;
    vscode.commands.executeCommand("near.openWidgetsFromAccount", accountId);
  }
};