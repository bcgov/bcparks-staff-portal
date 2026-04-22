import PropTypes from "prop-types";

export default function HTMLArea({ children }) {
  return <div dangerouslySetInnerHTML={{ __html: children }} />;
}

HTMLArea.propTypes = {
  children: PropTypes.string.isRequired,
};
