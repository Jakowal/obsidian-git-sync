import { Notice } from 'obsidian';
import { FileSystemAdapter } from 'obsidian';
import { ExecException, exec } from 'child_process';

function setupCallbackFn(commands: string[], currentIndex: number): (() => void) | undefined {
    if (currentIndex < commands.length) {
        return () => execAndLog(commands[currentIndex], setupCallbackFn(commands, currentIndex + 1));
    }
    return undefined;
}

export async function runAllCommands(commands: string[]) {
    if (commands.length > 1) {
        const baseFunction = () => execAndLog(commands[0], setupCallbackFn(commands, 1));
        baseFunction();
    }
    else {
        execAndLog(commands[0]);
    }
}

export async function execAndLog(command: string, callbackFn?: () => void, onSuccessMessage?: string, logResult?: boolean) {
    return exec(command, { cwd: getBasePath() }, (error, result) => {
        logNotice(onSuccessMessage || logResult ? result : undefined, error);
        if (callbackFn) {
            callbackFn();
        }
    });
}

export function getBasePath() {
    let adapter = app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
        console.log('file adapter', adapter.getBasePath());
        return adapter.getBasePath();
    }
    console.error('oopsie', adapter)
    return '';
}

export function logNotice(updateText?: string, error?: ExecException | null | string) {
    if (error) {
        console.error(error);
        new Notice(`${error}`);
    }
    else if (updateText) {
        console.log(updateText);
        new Notice(updateText);
    }
}