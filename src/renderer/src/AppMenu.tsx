import * as React from 'react';
import { Button, Menu, MenuItem } from '@material-ui/core';
import { apiClient } from './client';
import { PlatformInfo } from '../../common/api';

export interface MenuProps {
  platformInfo: PlatformInfo
}

export const AppMenu = (props: MenuProps) => {
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
        style={{zIndex: 150}}
      >
        { props.platformInfo.platform === "win32" &&
          [
            <MenuItem onClick={async () => {
              handleClose();
              await apiClient.installShellExtension();          
            }}>Install Shell Extension</MenuItem>,
            <MenuItem onClick={async () => {
              handleClose();
              await apiClient.uninstallShellExtension();          
            }}>Uninstall Shell Extension</MenuItem>,
            <MenuItem onClick={async () => {       
              handleClose();
              await apiClient.alert(`
Left Arrow - backward 1 image
Right Arrow - forward 1 image
Page Up - backward 100 images
Page Down - forward 100 images
Space - include current image in sorted
Delete - remove current image from sorted
Up Arrow - skip to previous sorted image
Down Arrow - skip to next sorted image
              `);
            }}>Keyboard Shortcuts</MenuItem>
          ]
        }
      </Menu>
    </div>
  );
}

export default AppMenu;
