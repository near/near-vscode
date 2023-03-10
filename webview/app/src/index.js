import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// React
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);

// Handle messages sent from VSCode to the Webview
window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
        case "update-code":
            if (message.code) {
                reloadWith(message.code, message.props);
            }
            break;
    }
});

// @ts-ignore
const vscode = acquireVsCodeApi();

// TODO: Currently we reload the page each time the wants to
//       update the code. We need to update the code so we can
//       handle this through the local state instead of an URL
const origUrl = window.location.href;

function reloadWith(code, props) {
    let propsUri = ''
    for (const prop in props) {
        propsUri += `&${prop}=${encodeURIComponent(props[prop])}`;
    }

    const url = new URL(origUrl);
    const search = new URLSearchParams(url.search);
    let vsParams = "";
    for (const [key, value] of search) {
        if (key === "code" || key === "props"){ continue }
        vsParams += vsParams ? "&" : "";
        vsParams += `${key}=${value}`
    }
    window.location.href = window.location.protocol + '//' + window.location.host + window.location.pathname + "#/?" + vsParams + "&code=" + encodeURIComponent(code) + propsUri;
}

// Overwrite console.log, so we can capture it in vscode
const classicLog = console.log
console.log = (...data) => {
    vscode.postMessage({ command: "console.log", data });
    classicLog(data)
}