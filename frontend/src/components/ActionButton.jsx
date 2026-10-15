import PropTypes from "prop-types";
import classNames from "classnames";
import { Button } from "@bcgov/design-system-react-components";
import { Loader } from "@/components/Loader";

export function ActionButton({
  label,
  variant = "primary",
  onClick,
  disabled = false,
  hasLoader = false,
  className = "",
  testId,
}) {
  return (
    <Button
      type="button"
      size="medium"
      variant={variant}
      className={classNames(
        "bcds-react-aria-Button",
        "medium",
        variant,
        className,
      )}
      onPress={() => onClick?.()}
      isDisabled={disabled}
      aria-busy={hasLoader}
      data-test-id={testId}
    >
      {label}
      {hasLoader && (
        <span aria-hidden="true">
          <Loader />
        </span>
      )}
    </Button>
  );
}

ActionButton.propTypes = {
  label: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary"]),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  hasLoader: PropTypes.bool,
  className: PropTypes.string,
  testId: PropTypes.string,
};
