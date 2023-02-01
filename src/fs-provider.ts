import * as path from 'path';
import * as vscode from 'vscode';
import { getAccountWidgetsNames, readWidgetCode } from './near-bridge';

export class Widget implements vscode.FileStat {

	type: vscode.FileType;
	ctime: number;
	mtime: number;
	size: number;

	name: string;
	code?: string;

	constructor(name: string) {
		this.type = vscode.FileType.File;
		this.ctime = Date.now();
		this.mtime = Date.now();
		this.size = 0;
		this.name = name;
	}
}

export class WidgetAccount implements vscode.FileStat {

	type: vscode.FileType;
	ctime: number;
	mtime: number;
	size: number;

	name: string;
	entries: Map<string, Widget>;

	constructor(name: string) {
		this.type = vscode.FileType.Directory;
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
	entries: Map<string, WidgetAccount>;

	constructor() {
		this.ctime = Date.now();
		this.mtime = Date.now();
		this.size = 0;
		this.entries = new Map();
	}
}

export type Entry = Widget | WidgetAccount;

export class WidgetsFS implements vscode.FileSystemProvider {

	root = new FSRoot();
    

	constructor() {
        
    }

    // async init(): Promise<void> {
    //     console.log('init');
        
    // }

	stat(uri: vscode.Uri): vscode.FileStat {
        console.log('stat', uri);
		return this._lookup(uri, false);
	}

	async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        console.log('readDirectory', uri);
        if (uri.fsPath !== '/') {
            throw vscode.FileSystemError.FileNotFound();
        }
        const widgets = await getAccountWidgetsNames(this.accountId);
        console.log('widgets', widgets);
        for (const w of widgets) {
            const widget = new Widget(w);
            this.root.entries.set(w, widget);
        }
        console.log('this.root', this.root);
        const result: [string, vscode.FileType][] = [];
		for (const [name, child] of this.root.entries) {
			result.push([name, child.type]);
		}
		return result;
	}

	// --- manage file contents

	async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        console.warn('readFile', uri);
		const entry = this._lookupAsFile(uri, false);
		if (entry) {
            const code = await readWidgetCode(this.accountId, entry.name);
            if (!code) {
                throw vscode.FileSystemError.FileNotFound();
            }
			return Buffer.from(code);
		}
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
		// const parts = uri.path.split('/');
        if (uri.path === '/') {
            return this.root;
        }
        const parts = uri.path.split('/');
		const entry = this.root.entries.get(parts[1]);
        if (!entry) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }
        return entry;
	}

	private _lookupAsFile(uri: vscode.Uri, silent: boolean): Widget {
		const entry = this._lookup(uri, silent);
		if (entry instanceof Widget) {
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
}