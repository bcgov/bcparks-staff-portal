import React, { useState } from 'react';
import AccountInfo from '../accountInfo/AccountInfo';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Drawer from '@material-ui/core/Drawer';
import MenuIcon from '@material-ui/icons/Menu';
import PrivateElement from "../../../auth/PrivateElement";
import CloseIcon from "@material-ui/icons/Close";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import './responsiveDrawer.css';

const ResponsiveDrawer = ({ handleTabChange }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

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
          .filter((item) => PrivateElement(item.allowedRoles))
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
}

export default ResponsiveDrawer;
