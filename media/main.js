// @ts-nocheck
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
  const vscode = acquireVsCodeApi();

  const oldState = /** @type {{ code: string } | undefined} */ (vscode.getState());

  console.log("Initial state", oldState);

  if (oldState?.code) {
    document.getElementById("code-widget")?.setAttribute("src", oldState.code);
  }

  const widgetNameControl = document.getElementById("widget-name-input");
  const widgetTagControl = document.getElementById("widget-tag-input");

  document.getElementById("publish-button")?.addEventListener("click", (e) => {
    if (widgetNameControl.value) {
      vscode.postMessage({
        command: "publish",
        name: widgetNameControl.value,
        tag: widgetTagControl.value ?? "",
      });
    } else {
      vscode.postMessage({
        command: "alert",
        text: "Widget name is missing",
      });
    }
  });

  document.getElementById("login-button")?.addEventListener("click", (e) => {
    document.getElementById("login-button")?.classList.add("hidden");
    document.getElementById("confirm-login-button")?.classList.remove("hidden");
    vscode.postMessage({ command: "login" });
  });

  document.getElementById("confirm-login-button")?.addEventListener("click", (e) => {
    vscode.postMessage({ command: "confirm-login" });
  });

  document.getElementById("sign-out-button")?.addEventListener("click", (e) => {
    vscode.postMessage({ command: "sign-out" });
  });

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case "update-code":
        if (message.code) {
          vscode.setState({ code: message.code });
          document.getElementById("code-widget")?.setAttribute("src", message.code);
        }
        break;

      case "account-details": {
        setAccountDetails(message.network, message.accountId);
        break;
      }
    }
  });
})();

/**
 * @param {string} accountId
 * @param {string} network
 */
function setAccountDetails(network, accountId) {
  console.log("setAccountDetails", accountId);
  const accountControl = document.getElementById("account-details");
  const loginControl = document.getElementById("login");

  let widgetUrl = network === "testnet" ? "https://test.near.social/#/embed/test_alice.testnet/widget/Profile.InlineBlock" : "https://near.social/#/embed/mob.near/widget/Profile.InlineBlock";

  if (accountId) {
    document.getElementById("account-details-widget")?.setAttribute("src", `${widgetUrl}?accountId=${accountId}`);
    accountControl.classList.remove("hidden");
    loginControl.classList.add("hidden");
  } else {
    accountControl.classList.add("hidden");
    loginControl.classList.remove("hidden");
  }
}
