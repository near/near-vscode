// @ts-nocheck
// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

function getWidgetUrl(network) {
  return network === "testnet"
    ? "https://test.near.social/#/embed/test_alice.testnet/widget/remote-code?code="
    : "https://near.social/#/embed/zavodil.near/widget/remote-code?code=";
}

function setIframeSrc(code) {
  const iframeSrc = getWidgetUrl() + encodeURIComponent(code);
  const iframeEl = document.getElementById("code-widget");
  if (iframeEl) {
    const existingSrc = iframeEl.getAttribute('src');
    if (existingSrc !== iframeSrc) {
      console.log('updating code', iframeSrc.slice(0, 100));
      document.getElementById("code-widget")?.setAttribute("src", iframeSrc);
    } else {
      console.log('NOT updating code', existingSrc.slice(0, 100));
    }
  }
  
};

(function () {
  const vscode = acquireVsCodeApi();
  const oldState = vscode.getState();

  console.log("Initial state", oldState);

  if (oldState?.code) {
    setIframeSrc(oldState.code);
  }

  // document.querySelector(".btn-reload")?.addEventListener("click", (e) => {
  //   requestUpdateCode();
  // });

  const requestUpdateCode = () => {
    vscode.postMessage({ command: "request-update-code" });
  };

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.command) {
      case "update-code":
        if (message.code) {
          vscode.setState({ code: message.code });
          setIframeSrc(message.code);
        }
        break;
      // case "account-details": {
      //   setAccountDetails(message.network, message.accountId);
      //   break;
      // }
    }
  });
  requestUpdateCode();
})();

// /**
//  * @param {string} accountId
//  * @param {string} network
//  */
// function setAccountDetails(network, accountId) {
//   console.log("setAccountDetails", accountId);
//   const accountControl = document.getElementById("account-details");
//   const loginControl = document.getElementById("login");

//   let widgetUrl = network === "testnet" ? "https://test.near.social/#/embed/test_alice.testnet/widget/Profile.InlineBlock" : "https://near.social/#/embed/mob.near/widget/Profile.InlineBlock";

//   if (accountId) {
//     document.getElementById("account-details-widget")?.setAttribute("src", `${widgetUrl}?accountId=${accountId}`);
//     accountControl.classList.remove("hidden");
//     loginControl.classList.add("hidden");
//   } else {
//     accountControl.classList.add("hidden");
//     loginControl.classList.remove("hidden");
//   }
// }
