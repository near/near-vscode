import * as vscode from 'vscode';
import { WIDGET_EXT } from '../config';
import { transactionForPublishingCode } from '../modules/social';
import path from 'path';
import { getFromContext } from '../extension';

export const publishCode = async (context: vscode.ExtensionContext, localWorkspace: string) => {
  // This will be called from an active panel
  const code: string = vscode.window.activeTextEditor?.document?.getText() || "";
  const uri: string = vscode.window.activeTextEditor?.document?.uri.path.toString() || "";
  const networkId = await getFromContext(localWorkspace, 'networkId') || "mainnet";

  const [accountId, ...widgetName] = path.relative(localWorkspace, uri).split('/');
  let transaction = await transactionForPublishingCode(accountId, widgetName.join('.').replace(WIDGET_EXT, ''), code, networkId);

  const publisher = context.extension.packageJSON.publisher;
  const name = context.extension.packageJSON.name;
  const callback = `${vscode.env.uriScheme}://${publisher}.${name}`;

  const prefixUrl = networkId === 'testnet' ? 'testnet' : 'app';
  const publishUrl = new URL('sign', `https://${prefixUrl}.mynearwallet.com/`);
  publishUrl.searchParams.set('transactions', transaction);
  publishUrl.searchParams.set('callbackUrl', callback);
  
  // @ts-ignore
  vscode.env.openExternal(publishUrl.href);
};