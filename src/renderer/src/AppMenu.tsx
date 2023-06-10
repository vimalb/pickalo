import * as React from 'react';
import { Button, Menu, MenuItem } from '@material-ui/core';
import { apiClient } from './client';

export const AppMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <span
          className="fa-solid fa-bars"
          style={{ 
            color: "white",
            verticalAlign: "middle",
            fontSize: "30px"
          }}
        ></span>
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        style={{zIndex: 10000}}
      >
        <MenuItem onClick={async () => {
          await apiClient.installShellExtension();          
          handleClose();
        }}>Install Shell Extension</MenuItem>
        <MenuItem onClick={async () => {
          await apiClient.uninstallShellExtension();          
          handleClose();
        }}>Uninstall Shell Extension</MenuItem>
      </Menu>
    </div>
  );
}

export default AppMenu;
