import "./SlideToggle.scss";

function SlidingToggleButton({ value, setValue, label }) {
  return (
    <div className="switch-container">
      <label className="switch">
        <input
          type="checkbox"
          checked={value}
          onChange={(ev) => setValue(ev.target.checked)}
        />
        <span className="slider round"></span>
      </label>
      <span className="switch-label">{label}</span>
    </div>
  );
}

export default SlidingToggleButton;
