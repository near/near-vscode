import * as vscode from 'vscode';
import { SocialFS } from "../modules/file-system/fs";
import glob from 'glob';
import path from 'path';
import { openAccountWidgets } from './load';

export const refreshFS = async (context: vscode.ExtensionContext, fileSystem: SocialFS) => {
    const localStoragePath: string | undefined = fileSystem.localStoragePath;

    if (localStoragePath === undefined) { return; }

    // Add all local files and folders from the selected dir
    const allWidgets = glob.sync(`**/*.jsx`, { cwd: localStoragePath });

    for (const widget of allWidgets) {
        let [dir, ...files] = widget.split('/');
        const accountId = dir;

        // Populate local files first
        fileSystem.createDirectory(vscode.Uri.parse(`${fileSystem.scheme}:/${dir}`));

        while (files.length > 1) {
            dir = path.join(dir, files[0]);
            files = files.slice(1);
            fileSystem.createDirectory(vscode.Uri.parse(`${fileSystem.scheme}:/${dir}`));
        }

        fileSystem.addReference(vscode.Uri.parse(`${fileSystem.scheme}:/${dir}/${files[0]}`), path.join(localStoragePath, widget));

        // Get all online widgets from the account
        openAccountWidgets(fileSystem, accountId);
    }
};