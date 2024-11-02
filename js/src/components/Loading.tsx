import React from "react";
import { __ } from "@wordpress/i18n";

import { Spinner } from "@wordpress/components";

const Loading = () => {
  return (
    <>
      <Spinner />
      &nbsp;{__("Loading...", "regi-fair")}
    </>
  );
};

export default Loading;
