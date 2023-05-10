import * as fs from 'fs';
import * as glob from "glob";
import * as path from 'path';
import * as vscode from "vscode";

import * as social from "../social";
import { Directory, File, Entry } from "./model";
import { SOCIAL_FS_SCHEME, WIDGET_EXT, defaultContext } from "../../config";

export class SocialFS implements vscode.FileSystemProvider {
  scheme = SOCIAL_FS_SCHEME;
  root = new Directory(`${this.scheme}:/`);
  localStoragePath: string | undefined;

  constructor(localStoragePath?: string) {
    this.localStoragePath = localStoragePath;

    if (localStoragePath === undefined) { return; }

    // Add all local files and folders from the selected dir
    const allWidgets = glob.sync(`**/*.jsx`, { cwd: localStoragePath });

    for (const widget of allWidgets) {
      let [dir, ...file] = widget.split('/');
      this.createDirectory(vscode.Uri.parse(`${this.scheme}:/${dir}`));

      while (file.length > 1) {
        dir = path.join(dir, file[0]);
        file = file.slice(1);
        this.createDirectory(vscode.Uri.parse(`${this.scheme}:/${dir}`));
      }

      this.addReference(vscode.Uri.parse(`${this.scheme}:/${dir}/${file}`), path.join(localStoragePath, widget));
    }

    const jsonFiles = ["props.json", "context.json"];
    const defaultValue = ["{}", JSON.stringify(defaultContext)];

    for (const idx in jsonFiles) {
      if (fs.existsSync(path.join(localStoragePath, jsonFiles[idx]))) {
        this.addReference(
          vscode.Uri.parse(`${this.scheme}:/${jsonFiles[idx]}`),
          path.join(localStoragePath, jsonFiles[idx])
        );
      } else {
        this.writeFile(
          vscode.Uri.parse(`${this.scheme}:/${jsonFiles[idx]}`),
          Buffer.from(defaultValue[idx]),
          { overwrite: false, create: true });
      }
    }
  }

  localFiles(): vscode.Uri[] {
    // Get all local files
    let files: vscode.Uri[] = [];

    for (const [name, child] of this.root.entries) {
      if (child instanceof Directory) {
        // get all files from this directory
        const allWidgets = glob.sync(`**/*.jsx`, { cwd: path.join(this.localStoragePath!, name) });

        for (const widget of allWidgets) {
          files.push(vscode.Uri.parse(`${this.scheme}:/${name}/${widget}`));
        }
      }
    }

    return files;
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    return this._lookup(uri, false);
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const entry = this._lookupAsDirectory(uri, false);
    const result: [string, vscode.FileType][] = [];
    for (const [name, child] of entry.entries) {
      result.push([name, child.type]);
    }
    return result;
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const file = this._lookupAsFile(uri, false);
    let code: string = "";

    if (file.localPath) {
      // read the local file
      code = fs.readFileSync(file.localPath, 'utf8');
    } else {
      const [_, accountId, ...wPath] = uri.path.split('/');
      code = await social.getWidgetCode(accountId, wPath.join('.').replace(WIDGET_EXT, ''));
    }
    return Buffer.from(code);
  }

  createDirectory(uri: vscode.Uri): void {
    const basename = path.posix.basename(uri.path);
    const dirname = uri.with({ path: path.posix.dirname(uri.path) });
    const parent = this._lookupAsDirectory(dirname, false);

    // By default, if the folder exists we do nothing
    if (parent.entries.has(basename)) { return; }

    const entry = new Directory(basename);
    parent.entries.set(entry.name, entry);
    parent.mtime = Date.now();
    parent.size += 1;
    this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { type: vscode.FileChangeType.Created, uri });
  }

  writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): void {
    if (!this.localStoragePath) {
      throw new Error("No local storage path");
    }

    const basename = path.posix.basename(uri.path);
    const parent = this._lookupParentDirectory(uri);
    let entry = parent.entries.get(basename);

    if (entry instanceof Directory) {
      throw vscode.FileSystemError.FileIsADirectory(uri);
    }
    if (!entry && !options.create) {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    if (entry && options.create && !options.overwrite) {
      throw vscode.FileSystemError.FileExists(uri);
    }

    if (!entry) {
      entry = new File(basename);
      parent.entries = parent.entries.set(basename, entry);
      this._fireSoon({ type: vscode.FileChangeType.Created, uri });
    }

    const fPath = path.join(this.localStoragePath, uri.path);

    entry.mtime = Date.now();
    entry.size = content.byteLength;
    entry.localPath = fPath;

    // save file creating folders if needed
    const dir = path.dirname(fPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fd = fs.openSync(fPath, 'w');
    fs.writeFileSync(fd, content);
    fs.closeSync(fd);

    this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
  }

  addReference(
    uri: vscode.Uri,
    localPath?: string
  ): void {
    // Add reference to a local file
    const basename = path.posix.basename(uri.path);
    const parent = this._lookupParentDirectory(uri);
    let entry = parent.entries.get(basename);

    if (entry instanceof Directory) {
      throw vscode.FileSystemError.FileIsADirectory(uri);
    }

    // By default, if a reference exists we do nothing
    if (entry) { return; }

    entry = new File(basename, localPath);
    parent.entries.set(basename, entry);
    this._fireSoon({ type: vscode.FileChangeType.Created, uri });
  }

  // --- manage files/folders

  rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { overwrite: boolean }
  ): void {
    // cannot rename props.json or context.json
    if (oldUri.path === '/props.json' || oldUri.path === '/context.json') {
      throw vscode.FileSystemError.NoPermissions("Cannot rename props.json or context.json");
    }

    const file = this._lookupAsFile(oldUri, false);

    if (file.localPath) {
      // we need to move the physical file
      const newLocalPath = path.join(this.localStoragePath!, newUri.path);
      fs.renameSync(file.localPath, newLocalPath);

      // replace file's local information
      file.localPath = newLocalPath;
    }

    file.name = path.posix.basename(newUri.path);
    const oldParent = this._lookupParentDirectory(oldUri);
    const newParent = this._lookupParentDirectory(newUri);
    oldParent.entries.delete(path.posix.basename(oldUri.path));
    newParent.entries.set(file.name, file);

    this._fireSoon({ type: vscode.FileChangeType.Deleted, uri: oldUri });
    this._fireSoon({ type: vscode.FileChangeType.Created, uri: newUri });
  }

  delete(uri: vscode.Uri): void {
    // cannot delete props.json or context.json
    if (uri.path === '/props.json' || uri.path === '/context.json') {
      throw vscode.FileSystemError.NoPermissions("Cannot delete props.json or context.json");
    }

    // cannot delete root
    if (uri.path === '/') { return; }

    const lookup = this._lookup(uri, false);

    // if is a File, we need to delete the physical file
    if (lookup instanceof File) {
      if (lookup.localPath) {
        fs.unlinkSync(lookup.localPath);
      }
    }

    if (lookup instanceof Directory) {
      if (fs.existsSync(path.join(this.localStoragePath!, lookup.name))) {
        fs.rmdirSync(path.join(this.localStoragePath!, lookup.name), { recursive: true });
      }
    }

    const parent = this._lookupParentDirectory(uri);
    parent.entries.delete(path.posix.basename(uri.path));
    this._fireSoon({ type: vscode.FileChangeType.Deleted, uri });
  }

  // --- lookup
  private _lookup(uri: vscode.Uri, silent: false): Entry;
  private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined;
  private _lookup(uri: vscode.Uri, silent: boolean): Entry | undefined {
    const parts = uri.path.split('/');
    let entry: Entry = this.root;
    for (const part of parts) {
      if (!part) {
        continue;
      }
      let child: Entry | undefined;
      if (entry instanceof Directory) {
        child = entry.entries.get(part);
      }
      if (!child) {
        if (!silent) {
          throw vscode.FileSystemError.FileNotFound(uri);
        } else {
          return undefined;
        }
      }
      entry = child;
    }
    return entry;
  }

  private _lookupAsDirectory(uri: vscode.Uri, silent: boolean): Directory {
    const entry = this._lookup(uri, silent);
    if (entry instanceof Directory) {
      return entry;
    }
    throw vscode.FileSystemError.FileNotADirectory(uri);
  }

  private _lookupAsFile(uri: vscode.Uri, silent: boolean): File {
    const entry = this._lookup(uri, silent);
    if (entry instanceof File) {
      return entry;
    }
    throw vscode.FileSystemError.FileIsADirectory(`Invalid action on ${uri}`);
  }

  private _lookupParentDirectory(uri: vscode.Uri): Directory {
    const dirname = uri.with({ path: path.posix.dirname(uri.path) });
    return this._lookupAsDirectory(dirname, false);
  }

  // --- manage file events

  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  private _bufferedEvents: vscode.FileChangeEvent[] = [];
  private _fireSoonHandle?: NodeJS.Timer;

  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

  watch(_resource: vscode.Uri): vscode.Disposable {
    // ignore, fires for all changes...
    return new vscode.Disposable(() => { });
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

  // Aux
  async addToContext(key: string, value: string) {
    // add key to context
    let data = await this.readFile(vscode.Uri.parse(`${this.scheme}:/context.json`));
    let contextData = JSON.parse(data?.toString() || "{}");
    contextData[key] = value;
    await this.writeFile(vscode.Uri.parse(`${this.scheme}:/context.json`), Buffer.from(JSON.stringify(contextData, null, 2)), { create: true, overwrite: true });
  }
}