import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Pagination } from "react-bootstrap";
import "./PaginationBar.css";

// Responsive wrapper around react-bootstrap Pagination component.
// Adapted from the DOOT pagination control (PaginationBar.jsx) for legacy material-table usage.
export default function PaginationBar({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
  ...paginationProps
}) {
  const [surroundingPages, setSurroundingPages] = useState(5);

  useEffect(() => {
    function updateSurroundingPages() {
      const width = document.documentElement.clientWidth;

      if (width < 576) {
        setSurroundingPages(2);
      } else if (width < 768) {
        setSurroundingPages(3);
      } else {
        setSurroundingPages(4);
      }
    }

    updateSurroundingPages();
    window.addEventListener("resize", updateSurroundingPages);

    return () => window.removeEventListener("resize", updateSurroundingPages);
  }, []);

  if (
    !totalItems ||
    totalItems <= 0 ||
    !itemsPerPage ||
    itemsPerPage <= 0 ||
    !isFinite(itemsPerPage)
  ) {
    return null;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  let page = currentPage;

  if (currentPage < 1) {
    page = 1;
  } else if (currentPage > totalPages) {
    page = totalPages;
  }

  const buttonsBetweenArrows = surroundingPages * 2 + 1;
  const overflow = totalPages > buttonsBetweenArrows;

  // Derive the start/end page indices (0-based) for the visible middle range,
  // without allocating an array of size `totalPages`.
  let rangeStart, rangeEnd;
  if (!overflow) {
    rangeStart = 0;
    rangeEnd = totalPages - 1;
  } else if (page - 1 <= surroundingPages) {
    rangeStart = 0;
    rangeEnd = buttonsBetweenArrows - 3;
  } else if (page + surroundingPages >= totalPages) {
    rangeStart = totalPages - buttonsBetweenArrows + 2;
    rangeEnd = totalPages - 1;
  } else {
    rangeStart = page - surroundingPages + 1;
    rangeEnd = page + surroundingPages - 3;
  }

  const range = Array.from(
    { length: rangeEnd - rangeStart + 1 },
    (_, i) => rangeStart + i,
  );

  const showFirst = overflow && page - 1 > surroundingPages;
  const showLast = overflow && page < totalPages - surroundingPages;

  const pageButton = (value) => (
    <Pagination.Item
      key={value}
      active={value === page - 1}
      onClick={() => (value !== page - 1 ? onPageChange(value + 1) : void 0)}
      aria-label={`Page ${value + 1}`}
    >
      {value + 1}
    </Pagination.Item>
  );

  return (
    <Pagination
      className={["pagination-bar", className].filter(Boolean).join(" ")}
      {...paginationProps}
    >
      <Pagination.Prev
        onClick={() => (page > 1 ? onPageChange(page - 1) : void 0)}
        disabled={page <= 1}
        aria-label="Previous page"
      />

      {showFirst && pageButton(0)}
      {showFirst && <Pagination.Ellipsis disabled />}

      {range.map(pageButton)}

      {showLast && <Pagination.Ellipsis disabled />}
      {showLast && pageButton(totalPages - 1)}

      <Pagination.Next
        onClick={() => (page < totalPages ? onPageChange(page + 1) : void 0)}
        disabled={page >= totalPages}
        aria-label="Next"
      />
    </Pagination>
  );
}

PaginationBar.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};
