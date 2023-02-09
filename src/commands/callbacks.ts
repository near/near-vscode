import * as vscode from 'vscode';
import { getTransactionResult } from '../modules/social';

export const handleTransactionCallback = async (uri: vscode.Uri) => {
  const queryParams = new URLSearchParams(uri.query);
  console.log("PARAMS", queryParams);

  // Transaction callback
  if (queryParams.has('transactionHashes')) {
    const tHash = queryParams.get('transactionHashes') as string;
    vscode.window.showInformationMessage(`Tx: ${tHash}`);
    const result = await getTransactionResult(tHash);
    vscode.window.showInformationMessage(`Result: ${result}`);
  }

  // Login callback
  if (queryParams.has('account_id')) {
    const accountId = queryParams.get('account_id') as string;
    vscode.commands.executeCommand("near.openWidgetsFromAccount", accountId);
  }
};