import * as vscode from 'vscode';

export class File implements vscode.FileStat {
    type = vscode.FileType.File;
    ctime = 0;
    mtime = 0;
    size = 0;

    localPath: string | undefined;
    name: string;

    constructor(name: string, localPath?: string) {
        this.name = name;
        this.localPath = localPath;
    }
}

export class Directory implements vscode.FileStat {

    type: vscode.FileType = vscode.FileType.Directory;
    ctime: number = 0;
    mtime: number = 0;
    size: number = 0;

    name: string;
    entries: Map<string, File | Directory>;

    constructor(name: string, entries: Map<string, File | Directory> = new Map()) {
        this.name = name;
        this.entries = entries;
    }
}

export type Entry = File | Directory;