import * as vscode from 'vscode';
import { FS_EXT } from '../config';
import { transactionForPublishingCode } from '../modules/social';

export const publishCode = async (context: vscode.ExtensionContext, network:string) => {
  // This will be called from an active panel
  const code: string = vscode.window.activeTextEditor?.document?.getText() || "";
  const uri: string = vscode.window.activeTextEditor?.document?.uri.toString() || "";

  const [root, accountId, widgetName] = uri.split('/');

  let transaction = await transactionForPublishingCode(accountId, widgetName.replace(FS_EXT, ''), code);

  const publisher = context.extension.packageJSON.publisher;
  const name = context.extension.packageJSON.name;
  const callback = `${vscode.env.uriScheme}://${publisher}.${name}`;

  const publishUrl = new URL('sign', 'https://wallet.' + network + '.near.org/');
  publishUrl.searchParams.set('transactions', transaction);
  publishUrl.searchParams.set('callbackUrl', callback);
  
  // @ts-ignore
  vscode.env.openExternal(publishUrl.href);
};