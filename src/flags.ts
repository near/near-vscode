import * as vscode from "vscode";
import * as path from "path";
import { WIDGET_EXT } from "./config";

const FS = vscode.workspace.fs;

export async function updateAllFlags(localWorkspace: string) {
  let flagsData: { components: any } = { components: {} };

  const widgetUris = await vscode.workspace.findFiles(`**/*${WIDGET_EXT}`);

  for (const uri of widgetUris) {
    const [accountId, ...widgetName] = path.relative(localWorkspace, uri.path).split('/');
    const socialPath = uriToSocialPath(accountId, widgetName);

    const code = (await FS.readFile(uri)).toString();
    flagsData.components[socialPath] = { code };
  }

  const flagsUri = vscode.Uri.parse(path.join(localWorkspace, `flags.json`));
  await FS.writeFile(flagsUri, Buffer.from(JSON.stringify(flagsData, null, 2)));
}

export async function updateFlags(localWorkspace: string, uri: vscode.Uri, del: boolean = false) {
  if (!uri.path.endsWith(WIDGET_EXT)) { return; }

  const flagsUri = vscode.Uri.parse(path.join(localWorkspace, `flags.json`));
  let data = await FS.readFile(flagsUri);
  let flagsData = JSON.parse(data?.toString() || `{"components": {}}`);

  const [accountId, ...widgetName] = path.relative(localWorkspace, uri.path).split('/');

  const socialPath = uriToSocialPath(accountId, widgetName);

  if (del) {
    if (socialPath in flagsData.components) {
      delete flagsData.components[socialPath];
    }
  } else {
    const code = (await FS.readFile(uri)).toString();
    flagsData.components[socialPath] = { code };
  }

  await FS.writeFile(flagsUri, Buffer.from(JSON.stringify(flagsData, null, 2)));
}

function uriToSocialPath(accountId: string, widgetName: string[]): string {
  return `${accountId}/widget/${widgetName.join('.').replace(WIDGET_EXT, '')}`;
}
