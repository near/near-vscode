function getWidgetUrl(network) {
  return network === "testnet"
    ? "https://test.near.social/#/embed/test_alice.testnet/widget/remote-code?code="
    // : "https://near.social/#/embed/zavodil.near/widget/remote-code?code=";
    : "https://widget-config.viewer-xlt.pages.dev/#embed/maxdev.near/widget/ide-preview?idePreview=";
}

function setIframeSrc(iframeQs, forceUpdate) {
  const iframeSrc = getWidgetUrl() + encodeURIComponent(iframeQs);
  const iframeEl = document.getElementById("code-widget");
  if (iframeEl) {
    const existingSrc = iframeEl.getAttribute('src');
    if (forceUpdate || existingSrc !== iframeSrc) {
      console.log('updating code', iframeSrc.slice(0, 100), "...truncated");
      document.getElementById("code-widget")?.setAttribute("src", "");
      setTimeout(() => {
        document.getElementById("code-widget")?.setAttribute("src", iframeSrc);
      }, 50);
    } else {
      console.log('NOT updating code', existingSrc.slice(0, 100));
    }
  }
}

(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();
  const oldState = vscode.getState();

  console.log("Initial state", oldState);

  if (oldState?.code) {
    setIframeSrc(oldState.code, true);
  }

  const requestUpdateCode = () => {
    const state = vscode.getState();
    vscode.postMessage({ command: "request-update-code", widgetUri: state?.widgetUri });
  };

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case "update-code":
        if (message.iframeQs) {
          vscode.setState({ iframeQs: message.iframeQs, widgetUri: message.widgetUri });
          setIframeSrc(message.iframeQs, message.forceUpdate);
        }
        break;
    }
  });
  requestUpdateCode();
})();
