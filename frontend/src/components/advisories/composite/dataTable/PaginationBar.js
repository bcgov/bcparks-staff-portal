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

  if (!totalItems || totalItems <= 0) {
    return null;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  let page = currentPage;

  if (currentPage < 1) {
    page = 1;
  } else if (currentPage > totalPages) {
    page = totalPages;
  }

  const positions = Array.from({ length: totalPages }, (_, i) => i);
  const buttonsBetweenArrows = surroundingPages * 2 + 1;

  let range;

  if (totalPages <= buttonsBetweenArrows) {
    range = positions;
  } else if (page - 1 <= surroundingPages) {
    range = positions.slice(0, buttonsBetweenArrows - 2);
  } else if (page + surroundingPages >= totalPages) {
    range = positions.slice(totalPages - buttonsBetweenArrows + 2, totalPages);
  } else {
    range = positions.slice(
      page - surroundingPages + 1,
      page + surroundingPages - 2,
    );
  }

  return (
    <Pagination {...paginationProps}>
      <Pagination.Prev
        onClick={() => (page > 1 ? onPageChange(page - 1) : void 0)}
        disabled={page <= 1}
        aria-label="Back"
      />

      {totalPages > buttonsBetweenArrows &&
        positions
          .slice(0, page - 1 <= surroundingPages ? 0 : 1)
          .map((value) => (
            <Pagination.Item
              key={value}
              onClick={() =>
                value !== page - 1 ? onPageChange(value + 1) : void 0
              }
              aria-label={`Page ${value + 1}`}
            >
              {value + 1}
            </Pagination.Item>
          ))}

      {totalPages > buttonsBetweenArrows && page - 1 > surroundingPages && (
        <Pagination.Ellipsis disabled />
      )}

      {range.map((value) => (
        <Pagination.Item
          active={value === page - 1}
          key={value}
          onClick={() =>
            value !== page - 1 ? onPageChange(value + 1) : void 0
          }
          aria-label={`Page ${value + 1}`}
        >
          {value + 1}
        </Pagination.Item>
      ))}

      {totalPages > buttonsBetweenArrows &&
        page < totalPages - surroundingPages && <Pagination.Ellipsis disabled />}

      {totalPages > buttonsBetweenArrows &&
        positions
          .slice(
            page >= totalPages - surroundingPages ? totalPages : totalPages - 1,
            totalPages,
          )
          .map((value) => (
            <Pagination.Item
              key={value}
              onClick={() =>
                value !== page - 1 ? onPageChange(value + 1) : void 0
              }
              aria-label={`Page ${value + 1}`}
            >
              {value + 1}
            </Pagination.Item>
          ))}

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
};
