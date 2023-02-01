import * as path from 'path';
import * as vscode from 'vscode';
import {AccountId, getWidgetsFromChain, NearWidget} from './near-bridge';

export class WidgetFile implements vscode.FileStat {
  type = vscode.FileType.File;
  ctime: number;
  mtime: number;
  size: number;
  name: string;
  widget: NearWidget;

  constructor(widget: NearWidget) {
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = widget.name;
    this.widget = widget;
  }
}

export class WidgetAccountDir implements vscode.FileStat {

  type = vscode.FileType.Directory;
  ctime: number;
  mtime: number;
  size: number;

  name: string;
  entries: Map<string, WidgetFile>;

  constructor(name: string) {
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = name;
    this.entries = new Map();
  }
}

export class FSRoot implements vscode.FileStat {
  type = vscode.FileType.Directory;
  ctime: number;
  mtime: number;
  size: number;

  name = 'mainnet';
  entries: Map<string, WidgetAccountDir>;

  constructor() {
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.entries = new Map();
  }
}

export type Entry = WidgetFile | WidgetAccountDir | FSRoot;

export class NearFS implements vscode.FileSystemProvider {

  root = new FSRoot();

  constructor() {

  }

  async loadAccount(accountId: string) {
    const accountWidgets: NearWidget[] = await getWidgetsFromChain(accountId, true);
    const accountDir = new WidgetAccountDir(accountId);
    for (const w of accountWidgets) {
      accountDir.entries.set(w.name, new WidgetFile(w));
    }
    this.root.entries.set(accountId, accountDir);
  }

  stat(uri: vscode.Uri): vscode.FileStat {
    console.log('stat', uri);
    return this._lookup(uri, false);
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    console.log('readDirectory', uri);
    const result: [string, vscode.FileType][] = [];
    if (uri.fsPath === '/') {
      for (const [name, child] of this.root.entries) {
        result.push([name, child.type]);
      }
    } else {
      const accountName = uri.fsPath.split('/')[1];
      const accountDir = this.root.entries.get(accountName);
      if (accountDir) {
        for (const [name, child] of accountDir.entries) {
          result.push([name, child.type]);
        }
      }
    }
    return result;
  }

  // --- manage file contents

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    console.warn('readFile', uri);
    const entry = this._lookupAsFile(uri, false);
    if (entry) {
      return Buffer.from(entry.widget.code);
    }
    // if (entry) {
    //         const code = await readWidgetCode(this.accountId, entry.name);
    //         if (!code) {
    //             throw vscode.FileSystemError.FileNotFound();
    //         }
    // 	return Buffer.from(code);
    // }
    throw vscode.FileSystemError.FileNotFound();
  }

  writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): void {
    console.warn('writeFile', uri, content, options);
  }

  // --- manage files/folders

  rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {
    console.warn('rename', oldUri, newUri, options);
  }

  delete(uri: vscode.Uri): void {
    console.warn('delete', uri);
  }

  createDirectory(uri: vscode.Uri): void {
    console.warn('createDirectory', uri);
  }

  // --- lookup

  private _lookup(uri: vscode.Uri, silent: false): Entry;
  private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined;
  private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined {
    const [root, accountName, widgetName] = uri.path.split('/');
    if (!widgetName) {
      return this.root;
    }
    const accountDir = this.root.entries.get(accountName);
    const entry  = accountDir?.entries.get(widgetName);
    if (!entry) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    return entry;
  }

  private _lookupAsFile(uri: vscode.Uri, silent: boolean): WidgetFile {
    const entry = this._lookup(uri, silent);
    if (entry instanceof WidgetFile) {
      return entry;
    }
    throw vscode.FileSystemError.FileIsADirectory(uri);
  }

  // --- manage file events

  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  private _bufferedEvents: vscode.FileChangeEvent[] = [];
  private _fireSoonHandle?: NodeJS.Timer;

  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

  watch(_resource: vscode.Uri): vscode.Disposable {
    // ignore, fires for all changes...
    return new vscode.Disposable(() => {
    });
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
