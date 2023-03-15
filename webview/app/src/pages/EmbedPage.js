import React from "react";
import { Widget } from "near-social-vm";

export default function EmbedPage({code, wProps, config}) {

  return (
    <>
      <div className="position-relative overflow-hidden mt-3">
        <Widget code={code} props={wProps} config={config}/>
      </div>
    </>
  )
}
