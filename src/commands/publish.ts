import * as vscode from 'vscode';
import { WIDGET_EXT } from '../config';
import { transactionForPublishingCode } from '../modules/social';
import path from 'path';

export const publishCode = async (context: vscode.ExtensionContext, network:string, localWorkspace: string) => {
  // This will be called from an active panel
  const code: string = vscode.window.activeTextEditor?.document?.getText() || "";
  const uri: string = vscode.window.activeTextEditor?.document?.uri.path.toString() || "";

  const [accountId, ...widgetName] = path.relative(localWorkspace, uri).split('/');
  let transaction = await transactionForPublishingCode(accountId, widgetName.join('.').replace(WIDGET_EXT, ''), code);

  const publisher = context.extension.packageJSON.publisher;
  const name = context.extension.packageJSON.name;
  const callback = `${vscode.env.uriScheme}://${publisher}.${name}`;

  const publishUrl = new URL('sign', 'https://wallet.' + network + '.near.org/');
  publishUrl.searchParams.set('transactions', transaction);
  publishUrl.searchParams.set('callbackUrl', callback);
  
  // @ts-ignore
  vscode.env.openExternal(publishUrl.href);
};