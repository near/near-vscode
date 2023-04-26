import React, { useEffect, useState } from "react";
import "error-polyfill";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@near-wallet-selector/modal-ui/styles.css";
import "bootstrap/dist/js/bootstrap.bundle";
import "App.scss";
import { HashRouter as Router } from "react-router-dom";
import EmbedPage from "./pages/EmbedPage";
import { useAccount, useInitNear, useNear, utils } from "near-social-vm";
import Big from "big.js";
import { create_selector } from "./data/selector";

export const refreshAllowanceObj = {};

function App({code, wProps, config, vsContext}) {
  const [connected, setConnected] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [signedAccountId, setSignedAccountId] = useState(null);
  const [availableStorage, setAvailableStorage] = useState(null);
  const [widgetSrc, setWidgetSrc] = useState(null);

  const { initNear } = useInitNear();
  const near = useNear();
  const account = useAccount(vsContext.accountId);
  const accountId = account.accountId;

  const location = window.location;

  useEffect(() => {
    initNear &&
      initNear({
        networkId: vsContext.networkId,
        selector: create_selector(vsContext.networkId, vsContext.accountId, vsContext.accessKey),
      });
  }, [initNear, vsContext]);

  useEffect(() => {
    setSignedIn(!!accountId);
    setSignedAccountId(accountId);
    setConnected(true);
  }, [near, accountId]);

  useEffect(() => {
    setAvailableStorage(
      account.storageBalance
        ? Big(account.storageBalance.available).div(utils.StorageCostPerByte)
        : Big(0)
    );
  }, [account]);

  const viewerProps = {
    refreshAllowance: () => {},
    setWidgetSrc,
    signedAccountId,
    signedIn,
    connected,
    availableStorage,
    widgetSrc,
  };

  return (
    <div className="App">
      <Router basename={process.env.PUBLIC_URL}>
        <EmbedPage code={code} wProps={wProps} config={config} vsContext={vsContext} viewerProps={viewerProps} />
      </Router>
    </div>
  );
}

export default App;
