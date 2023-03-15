import * as vscode from "vscode";
import { SocialFS } from "../modules/file-system/fs";

export const chooseLocalPath = async (context: vscode.ExtensionContext, fileSystem: SocialFS) => {
  const localWorkspace = await vscode.window.showOpenDialog({title: "Choose a working directory", canSelectMany: false, canSelectFolders: true, canSelectFiles: false }) || [];
  context.workspaceState.update('localStoragePath', localWorkspace[0].path);
  vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse(`${fileSystem.scheme}:/`), name: `⛓ mainnet` });
};