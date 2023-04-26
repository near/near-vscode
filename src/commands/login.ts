import * as vscode from 'vscode';
import { APP_NAME } from '../config';
import { KeyPair } from 'near-api-js';
import { SocialFS } from "../modules/file-system/fs";

export const loginAccount = async (context: vscode.ExtensionContext, network: string, fileSystem: SocialFS) => {
  const publisher = context.extension.packageJSON.publisher;
  const name = context.extension.packageJSON.name;
  const callback = `${vscode.env.uriScheme}://${publisher}.${name}`;

  const contractId = "social.near";
  const keyPair = KeyPair.fromRandom("ED25519");
  const publicKey = keyPair.getPublicKey().toString();

  await fileSystem.addToContext('accessKey', keyPair.toString());

  let url = `https://wallet.${network}.near.org/login/?title=${APP_NAME}&success_url=${callback}&contract_id=${contractId}&public_key=${publicKey}`;
  vscode.env.openExternal(vscode.Uri.parse(url));
};