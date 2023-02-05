import * as vscode from "vscode";
import { NearAccount, NearAccountDir } from "./NearAccount";
import { NearWidget, WidgetFile } from "./NearWidget";

export class FSRoot implements vscode.FileStat {
  type = vscode.FileType.Directory;
  ctime: number;
  mtime: number;
  size: number;
  name = "mainnet";
  accountDirs: Map<AccountId, NearAccountDir>;

  constructor() {
    this.ctime = 0;
    this.mtime = 0;
    this.size = 0;
    this.accountDirs = new Map();
  }
}

export type Entry = WidgetFile | NearAccountDir | FSRoot;

export class NearFS implements vscode.FileSystemProvider {
  root = new FSRoot();

  constructor() {}

  async loadAccount(accountId: AccountId) {
    const account = NearAccount.byId(accountId);
    const accountDir = account.getAccountDir();
    this.root.accountDirs.set(accountId, accountDir);
  }

  stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    return this._lookup(uri, false);
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const result: [string, vscode.FileType][] = [];
    if (uri.fsPath === "/") {
      for (const [accountId] of this.root.accountDirs) {
        result.push([accountId, vscode.FileType.Directory]);
      }
    } else {
      const accountName = uri.fsPath.split("/")[1];
      const accountDir = this.root.accountDirs.get(accountName);
      if (accountDir) {
        const widgetFiles = await accountDir.account.getAllWidgetFiles();
        for (const w of widgetFiles) {
          result.push([w.name, w.type]);
        }
      }
    }
    return result;
  }

  // --- manage file contents

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const entry = await this._lookupAsFile(uri, false);
    if (entry) {
      if (entry.widget.code === null) {
        throw new vscode.FileSystemError(`Error loading this file content from chain.`);
      }
      return Buffer.from(entry.widget.code);
    } else {
      throw vscode.FileSystemError.FileNotFound();
    }
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

  // --- lookup

  private async _lookup(uri: vscode.Uri, silent: false): Promise<Entry>;
  private async _lookup(uri: vscode.Uri, silent: boolean): Promise<Entry | undefined>;
  private async _lookup(uri: vscode.Uri, silent: boolean): Promise<Entry | undefined> {
    const [root, accountId, widgetFsName] = uri.path.split("/");
    if (!accountId && !widgetFsName) {
      return this.root;
    }
    let accountDir: NearAccountDir | undefined;
    if (accountId) {
      accountDir = this.root.accountDirs.get(accountId);
      if (!accountDir) {
        await this.loadAccount(accountId);
        accountDir = this.root.accountDirs.get(accountId);
      }
    }
    if (!widgetFsName) {
      return accountDir;
    }
    const widgetName = NearWidget.nameFromFsName(widgetFsName as WidgetFSName);
    const widgetFileEntry = await accountDir?.account.getOneWidgetFile(widgetName);
    if (!widgetFileEntry) {
      if (!silent) {
        throw vscode.FileSystemError.FileNotFound(uri);
      } else {
        return undefined;
      }
    }
    return widgetFileEntry;
  }

  private async _lookupAsFile(
    uri: vscode.Uri,
    silent: boolean
  ): Promise<WidgetFile> {
    const entry = await this._lookup(uri, silent);
    if (typeof entry === 'undefined') {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    if (entry.type === vscode.FileType.Directory) {
      throw vscode.FileSystemError.FileIsADirectory(uri);
    }
    if (entry instanceof FSRoot) {
      throw vscode.FileSystemError.FileIsADirectory(uri);
    }
    return entry;
  }

  // --- manage file events

  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  private _bufferedEvents: vscode.FileChangeEvent[] = [];
  private _fireSoonHandle?: NodeJS.Timer;

  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> =
    this._emitter.event;

  watch(_resource: vscode.Uri): vscode.Disposable {
    // ignore, fires for all changes...
    return new vscode.Disposable(() => {});
  }

  private _fireSoon(...events: vscode.FileChangeEvent[]): void {
    this._bufferedEvents.push(...events);

    if (this._fireSoonHandle) {
      clearTimeout(this._fireSoonHandle);
    }

    this._fireSoonHandle = setTimeout(() => {
      this._emitter.fire(this._bufferedEvents);
      this._bufferedEvents.length = 0;
    }, 5);
  }
}
