import { useState } from "react";
import AccountInfo from "@/components/advisories/composite/accountInfo/AccountInfo";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import useAccess from "@/hooks/useAccess";
import CloseIcon from "@mui/icons-material/Close";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import "./responsiveDrawer.css";

const ResponsiveDrawer = ({ handleTabChange }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { hasAnyRole } = useAccess();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleClick = (item) => {
    // If the item has a href, navigate to that URL
    if (item.href) {
      window.location.href = item.href;
      return;
    }

    handleTabChange(null, item.value);
    setMobileOpen(false);
  };

  const navItems = [
    { value: 0, text: "Advisories", allowedRoles: ["submitter", "approver"] },
    {
      value: 1,
      text: "Park Access Status",
      allowedRoles: ["submitter", "approver"],
    },
    { value: 2, text: "Activities & Facilities", allowedRoles: ["approver"] },
    {
      value: 3,
      text: "Dates of Operation",
      href: "/dates/",
      allowedRoles: ["doot-user"],
    },
  ];

  const drawer = (
    <div>
      <List>
        {navItems
          .filter((item) => hasAnyRole(item.allowedRoles))
          .map((item, index) => (
            <ListItem key={index} button onClick={() => handleClick(item)}>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        <ListItem>
          <AccountInfo />
        </ListItem>
      </List>
    </div>
  );

  return (
    <div className="responsive-drawer-container">
      <AppBar position="static" className="appbar">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          anchor="right"
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          className="responsive-drawer"
        >
          {drawer}
        </Drawer>
      </nav>
    </div>
  );
};

export default ResponsiveDrawer;
