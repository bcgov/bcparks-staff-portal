import { OriginalTopBar } from "adminjs";

/**
 * AdminJS top bar with global style fixes for the admin UI.
 * @param {Object} props AdminJS TopBar props
 * @returns {JSX.Element} Original top bar plus style fixes
 */
function AdminTopBar(props) {
  return (
    <>
      <OriginalTopBar {...props} />

      {/* Reference links use AdminJS's button styles, which center text that wraps */}
      <style>{`td[data-property-name] a { text-align: left; }`}</style>
    </>
  );
}

export default AdminTopBar;
