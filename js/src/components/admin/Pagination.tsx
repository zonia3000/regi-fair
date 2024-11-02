import { Button, SelectControl } from "@wordpress/components";
import { __, sprintf } from "@wordpress/i18n";
import React, { useEffect, useState } from "react";

const Pagination = (props: {
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (s: number) => void;
  total: number;
}) => {
  const [pageNumbers, setPageNumbers] = useState([] as Array<string | number>);

  const maxVisibleNumbersPerSide = 3;
  const separator = "...";
  const pageSizes = [10, 20, 50, 100];

  useEffect(() => {
    const pageNumbers = [] as Array<string | number>;
    const numberOfPages = Math.ceil(props.total / props.pageSize);
    if (props.page - maxVisibleNumbersPerSide <= 1) {
      for (let i = 1; i <= props.page; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (props.page - maxVisibleNumbersPerSide !== 2) {
        pageNumbers.push(separator);
      }
      for (
        let i = props.page - maxVisibleNumbersPerSide;
        i <= props.page;
        i++
      ) {
        pageNumbers.push(i);
      }
    }
    if (props.page + maxVisibleNumbersPerSide >= numberOfPages) {
      for (let i = props.page + 1; i <= numberOfPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let i: number;
      for (
        i = props.page + 1;
        i <= props.page + maxVisibleNumbersPerSide;
        i++
      ) {
        pageNumbers.push(i);
      }
      if (i !== numberOfPages) {
        pageNumbers.push(separator);
      }
      pageNumbers.push(numberOfPages);
    }
    setPageNumbers(pageNumbers);
  }, [props.page, props.pageSize, props.total]);

  function setPage(n: number) {
    props.setPage(n);
  }

  function setPageSize(size: string) {
    const pageSize = Number(size);
    props.setPage(1);
    props.setPageSize(pageSize);
  }

  return (
    <div className="flex">
      <div className="mr-2">
        <p>
          <strong>{__("Total", "regi-fair")}</strong>: {props.total}
        </p>
      </div>

      <div className="mr-2 mt">
        {pageNumbers.length > 1 &&
          pageNumbers.map((n, i) => (
            <span key={`p_${i}`}>
              {n === separator && <span>&nbsp;{n}&nbsp;</span>}
              {n !== separator && (
                <Button
                  variant={n === props.page ? "primary" : "secondary"}
                  onClick={() => setPage(n as number)}
                  aria-label={sprintf(
                    /* translators: %d is replaced with the page number */
                    __("Go to page %d", "regi-fair"),
                    n,
                  )}
                >
                  {n}
                </Button>
              )}
            </span>
          ))}
      </div>

      <div className="flex-row mt">
        <SelectControl
          label={__("Page size", "regi-fair")}
          value={props.pageSize.toString()}
          options={pageSizes.map((s) => ({
            label: s.toString(),
            value: s.toString(),
          }))}
          onChange={setPageSize}
          __nextHasNoMarginBottom={true}
        />
      </div>
    </div>
  );
};

export default Pagination;
