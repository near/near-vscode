import * as vscode from "vscode";
import * as glob from "glob";
import * as path from "path";
import { SocialFS } from "../modules/file-system/fs";

export const chooseLocalPath = async (context: vscode.ExtensionContext, fileSystem: SocialFS) => {
  const localWorkspace = await vscode.window.showOpenDialog({title: "Choose a working directory", canSelectMany: false, canSelectFolders: true, canSelectFiles: false }) || [];
  context.workspaceState.update('localStoragePath', localWorkspace[0].path);
  vscode.workspace.updateWorkspaceFolders(0, 0, { uri: vscode.Uri.parse(`${fileSystem.scheme}:/`), name: `⛓ mainnet` });
};

export const populateFS = (fileSystem: SocialFS, localWorkspace: string) => {

  if (localWorkspace) {
    // Add all existing files and folders from the selected dir
    // TODO: Check their correctness, right now we simply assume they are users/widgets
    const allWidgets = glob.sync(`**/*.jsx`, { cwd: localWorkspace});

    for (const widget of allWidgets) {
      const [dir, file] = widget.split('/');
      fileSystem.createDirectory(vscode.Uri.parse(`${fileSystem.scheme}:/${dir}`));
      fileSystem.addReference(vscode.Uri.parse(`${fileSystem.scheme}:/${dir}/${file}`), path.join(localWorkspace, widget));
    }

    if (allWidgets.length > 0) {
      // TODO: Handle the case where props.json does not exist
      fileSystem.addReference(vscode.Uri.parse(`${fileSystem.scheme}:/props.json`), path.join(localWorkspace, 'props.json'));
    }
  } else {
    vscode.window.showErrorMessage('Please select a local folder');
  }
};

