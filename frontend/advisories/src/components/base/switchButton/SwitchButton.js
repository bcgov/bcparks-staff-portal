import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";

const SwitchButton = styled(Switch)(({ theme }) => ({
  width: 38,
  height: 22,
  padding: 0,
  margin: "1px",
  "& .MuiSwitch-switchBase": {
    padding: "2px !important",
    "&.Mui-checked": {
      transform: "translateX(16px)",
      color: "#036",
      "& + .MuiSwitch-track": {
        backgroundColor: "#036",
        opacity: 1,
        border: "none",
      },
    },
    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: "#036",
      border: "6px solid #036",
    },
  },
  "& .MuiSwitch-thumb": {
    width: 18,
    height: 18,
    color: "#fff",
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    border: `1px solid #00000033`,
    backgroundColor: "#00000033",
    opacity: 1,
  },
}));

SwitchButton.defaultProps = {
  disableRipple: true,
};

export default SwitchButton;
