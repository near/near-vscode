import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Overwrite logging behavior, to capture it in vscode
const classicLog = console.log
console.log = (...data) => {
    vscode.postMessage({ command: "console.log", data: JSON.parse(JSON.stringify(data)) });
    classicLog(data)
}

const classicError = console.error
console.error = (...data) => {
    vscode.postMessage({ command: "console.log", data: JSON.parse(JSON.stringify(data)) });
    classicError(data)
}

// React
const container = document.getElementById("root");
const root = createRoot(container);

// Handle messages sent from VSCode to the Webview
window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent

    switch (message.command) {
        case "update-code":
            if (message.code) {
                root.render(<App code={message.code} wProps={message.props} flags={message.flags} vsContext={message.context} />);
            }
            break;
        default:
            break;
    }
});

// @ts-ignore
// eslint-disable-next-line no-undef
const vscode = acquireVsCodeApi();