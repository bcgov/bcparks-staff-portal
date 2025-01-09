import classNames from "classnames";
import range from "lodash/range";
import PropTypes from "prop-types";

export default function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
}) {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;
  const pageRange = range(1, totalPages + 1);

  function nextPage() {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  }

  function prevPage() {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  }

  return (
    <div
      className="btn-toolbar pagination-bar"
      role="toolbar"
      aria-label="Toolbar with button groups"
    >
      <div
        className="btn-group flex-wrap"
        role="group"
        aria-label="First group"
      >
        <button
          disabled={isFirstPage}
          type="button"
          className="btn btn-outline-primary flex-grow-0"
          onClick={prevPage}
        >
          Previous
        </button>

        {pageRange.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={classNames("btn flex-grow-0", {
              "pe-none": pageNumber === currentPage,
              "btn-primary": pageNumber === currentPage,
              "btn-outline-primary": pageNumber !== currentPage,
            })}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}

        <button
          disabled={isLastPage}
          type="button"
          className="btn btn-outline-primary flex-grow-0"
          onClick={nextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// Prop validation
PaginationBar.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};
