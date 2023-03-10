import React, { useEffect, useState } from "react";
import { Widget } from "near-social-vm";
import { useParams } from "react-router-dom";
import { useQuery } from "../hooks/useQuery";

export default function EmbedPage(props) {
  const query = useQuery();
  const [widgetProps, setWidgetProps] = useState({});
  const code = query.get("code");

  useEffect(() => {
    setWidgetProps(
      [...query.entries()].reduce((props, [key, value]) => {
        props[key] = value;
        return props;
      }, {})
    );
  }, [query]);

  /* For debugging
    <h1> EmbedPage </h1>
    <button onClick={() => {reloadWith('console.log(0); return 0;')}}> Reload </button>
  */

  return (
    <>
      <div className="position-relative overflow-hidden mt-3">
        <Widget code={code} props={widgetProps} />
      </div>
    </>
  )
}
