import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';

export default function PasswordField({ label = 'Password', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      label={label}
      type={visible ? 'text' : 'password'}
      fullWidth
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
                aria-pressed={visible}
                onClick={() => setVisible((value) => !value)}
                onMouseDown={(event) => event.preventDefault()}
                edge="end"
                disabled={props.disabled}
              >
                {visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
