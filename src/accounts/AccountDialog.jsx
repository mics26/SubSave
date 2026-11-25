import { useRef, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton,
  Stack, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { CloseRounded, LockOutlined } from '@mui/icons-material';
import PasswordField from './PasswordField.jsx';

const TITLES = {
  login: 'Welcome back', register: 'Create your account',
};

export default function AccountDialog({ initialMode, service, onClose, onChanged }) {
  const [mode, setMode] = useState(initialMode);
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const registering = mode === 'register';

  function changeMode(next) {
    setMode(next);
    setValues((previous) => ({ name: '', email: previous.email, password: '', confirmPassword: '' }));
    setFields({});
    setError('');
  }

  function input(name) {
    return {
      name,
      value: values[name],
      onChange: (event) => {
        setValues((previous) => ({ ...previous, [name]: event.target.value }));
        setFields((previous) => ({ ...previous, [name]: undefined }));
        setError('');
      },
      error: Boolean(fields[name]),
      helperText: fields[name],
      disabled: busy,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;
    if (registering && values.password !== values.confirmPassword) {
      setFields({ confirmPassword: 'Passwords do not match.' });
      setError('Please check the highlighted fields.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    setFields({});
    try {
      if (registering) {
        const user = await service.register(values);
        onChanged('Account created. You’re logged in.', user);
      } else {
        const user = await service.login(values);
        onChanged('You’re logged in. Welcome back!', user);
      }
      onClose();
    } catch (failure) {
      setError(failure.message || 'Something went wrong. Please try again.');
      setFields(failure.fields || {});
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog
      open onClose={busy ? undefined : onClose} fullWidth maxWidth="xs" fullScreen={fullScreen}
      aria-labelledby="account-dialog-title" aria-describedby="account-dialog-description"
    >
      <DialogTitle sx={{ pt: 3, pr: 7 }} id="account-dialog-title">
        <Box sx={{ color: 'primary.dark', mb: 1 }}><LockOutlined /></Box>
        <Typography component="span" variant="h5" fontWeight={700}>{TITLES[mode]}</Typography>
        <IconButton aria-label="Close account dialog" onClick={onClose} disabled={busy} sx={{ position: 'absolute', right: 12, top: 12 }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography id="account-dialog-description" variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {registering ? 'Keep your account details ready whenever you return.' : 'Log in to manage your SubSave account.'}
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} aria-busy={busy}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}
            {registering && (
              <TextField {...input('name')} label="Full name" autoComplete="name" required fullWidth autoFocus />
            )}
            <TextField {...input('email')} label="Email address" type="email" autoComplete="email" required fullWidth autoFocus={!registering} />
            <PasswordField {...input('password')} label="Password" autoComplete={registering ? 'new-password' : 'current-password'}
              required helperText={fields.password || (registering ? 'Use 8–128 characters.' : undefined)} />
            {registering && (
              <PasswordField {...input('confirmPassword')} label="Confirm password" autoComplete="new-password" required />
            )}
            <Button type="submit" variant="contained" size="large" disableElevation disabled={busy}>
              {busy ? 'Please wait…' : registering ? 'Create account' : 'Log in'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Typography component="span" variant="body2" color="text.secondary">
                {registering ? 'Already have an account?' : 'New to SubSave?'}
              </Typography>{' '}
              <Button disabled={busy} onClick={() => changeMode(registering ? 'login' : 'register')}>
                {registering ? 'Log in' : 'Create account'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
