import * as vscode from "vscode";
import {
  FS_EXT,
  SOCIAL_FS_SCHEME
} from "../config";
import { getWidgetCode, getWidgetsNames } from "./social";

export class SocialFS implements vscode.FileSystemProvider {
  scheme = SOCIAL_FS_SCHEME;

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {

    const [root, accountId, widgetName] = uri.path.split('/');
    const type = widgetName? vscode.FileType.File : vscode.FileType.Directory;

    return {
      type: type,
      ctime: 0,
      mtime: 0,
      size: 0,
    };
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const result: [string, vscode.FileType][] = [];

    const accountId = uri.fsPath.split("/")[1];
    const widgetNames = await getWidgetsNames(accountId);
    for (const widgetName of widgetNames) {
      result.push([`${widgetName}${FS_EXT}`, vscode.FileType.File]);
    }
    return result;
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    let [root, accountId, widgetName] = uri.path.split("/");
    if(!widgetName.includes(FS_EXT)){return Buffer.from("")}
    const code = await getWidgetCode(accountId, widgetName.replace(FS_EXT, ''));
    return Buffer.from(code);
  }

  writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): void {
    console.warn("&& writeFile", uri, content, options);
  }

  // --- manage files/folders

  rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { overwrite: boolean }
  ): void {
    console.warn("&& rename", oldUri, newUri, options);
  }

  delete(uri: vscode.Uri): void {
    console.warn("&& delete", uri);
  }

  createDirectory(uri: vscode.Uri): void {
    console.warn("&& createDirectory", uri);
  }

  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

  watch(_resource: vscode.Uri): vscode.Disposable {
    // ignore, fires for all changes...
    return new vscode.Disposable(() => { });
  }
}
