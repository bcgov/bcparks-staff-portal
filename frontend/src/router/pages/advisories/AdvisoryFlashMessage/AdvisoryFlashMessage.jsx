import PropTypes from "prop-types";
import FlashMessage from "@/components/FlashMessage";

export default function AdvisoryFlashMessage({
  unpublishFlashMessage,
  closeUnpublishFlashMessage,
}) {
  return (
    <FlashMessage
      title={unpublishFlashMessage.title}
      message={unpublishFlashMessage.message}
      isVisible={unpublishFlashMessage.isVisible}
      onClose={closeUnpublishFlashMessage}
      variant={unpublishFlashMessage.variant}
    />
  );
}

AdvisoryFlashMessage.propTypes = {
  unpublishFlashMessage: PropTypes.shape({
    isVisible: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string,
    variant: PropTypes.oneOf(["success", "error"]),
  }).isRequired,
  closeUnpublishFlashMessage: PropTypes.func.isRequired,
};
