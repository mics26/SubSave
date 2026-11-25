import { useRef, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogContent, DialogTitle, IconButton,
  Stack, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { ArrowBackRounded, CloseRounded, LockOutlined } from '@mui/icons-material';
import PasswordField from './PasswordField.jsx';

const TITLES = {
  login: 'Welcome back', register: 'Create your account',
  recover: 'Forgot your password?', reset: 'Set a new password',
};

export default function AccountDialog({ initialMode, service, onClose, onChanged, allowRecovery = true }) {
  const [mode, setMode] = useState(initialMode);
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '', code: '' });
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));

  function changeMode(next) {
    setMode(next);
    setValues((previous) => ({ name: '', email: previous.email, password: '', confirmPassword: '', code: '' }));
    setFields({});
    setError('');
    setNotice('');
    setDemoCode('');
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
    if ((mode === 'register' || mode === 'reset') && values.password !== values.confirmPassword) {
      setFields({ confirmPassword: 'Passwords do not match.' });
      setError('Please check the highlighted fields.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    setFields({});
    setNotice('');
    try {
      if (mode === 'register') {
        const user = await service.register(values);
        onChanged('Account created. You’re logged in.', user);
        onClose();
      } else if (mode === 'login') {
        const user = await service.login(values);
        onChanged('You’re logged in. Welcome back!', user);
        onClose();
      } else if (mode === 'recover') {
        const code = service.requestReset(values.email);
        changeMode('reset');
        setDemoCode(code);
      } else {
        await service.resetPassword(values);
        onChanged();
        changeMode('login');
        setNotice('Password reset. Log in with your new password.');
      }
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
          {mode === 'login' && 'Log in to manage your SubSave account.'}
          {mode === 'register' && 'Keep your account details ready whenever you return.'}
          {mode === 'recover' && 'Enter the email you registered with.'}
          {mode === 'reset' && `Use the code below to reset the password for ${values.email}.`}
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} aria-busy={busy}>
          <Stack spacing={2.5}>
            {notice && <Alert severity="success">{notice}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            {mode === 'reset' && (
              <Alert severity="info">
                Your recovery code is{' '}
                <Box component="strong" sx={{ letterSpacing: 2 }}>{demoCode}</Box>.
                {' '}It expires in 10 minutes. Closing this dialog ends this recovery flow.
              </Alert>
            )}
            {mode === 'register' && (
              <TextField {...input('name')} label="Full name" autoComplete="name" required fullWidth autoFocus />
            )}
            {mode !== 'reset' && (
              <TextField {...input('email')} label="Email address" type="email" autoComplete="email" required fullWidth autoFocus={mode !== 'register'} />
            )}
            {mode === 'reset' && (
              <TextField {...input('code')} label="Recovery code" autoComplete="one-time-code" required fullWidth autoFocus
                slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }} />
            )}
            {mode !== 'recover' && (
              <PasswordField {...input('password')} label={mode === 'reset' ? 'New password' : 'Password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required
                helperText={fields.password || (mode !== 'login' ? 'Use 8–128 characters.' : undefined)} />
            )}
            {(mode === 'register' || mode === 'reset') && (
              <PasswordField {...input('confirmPassword')} label="Confirm password" autoComplete="new-password" required />
            )}
            {mode === 'login' && allowRecovery && (
              <Button onClick={() => changeMode('recover')} disabled={busy} sx={{ alignSelf: 'flex-end', mt: '-8px !important' }}>Forgot password?</Button>
            )}
            <Button type="submit" variant="contained" size="large" disableElevation disabled={busy}>
              {busy ? 'Please wait…' : { login: 'Log in', register: 'Create account', recover: 'Get recovery code', reset: 'Reset password' }[mode]}
            </Button>
            {mode === 'login' || mode === 'register' ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography component="span" variant="body2" color="text.secondary">
                  {mode === 'login' ? 'New to SubSave?' : 'Already have an account?'}
                </Typography>{' '}
                <Button disabled={busy} onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>
                  {mode === 'login' ? 'Create account' : 'Log in'}
                </Button>
              </Box>
            ) : (
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Button startIcon={<ArrowBackRounded />} disabled={busy} onClick={() => changeMode('login')}>Back to login</Button>
                {mode === 'reset' && <Button disabled={busy} onClick={() => changeMode('recover')}>Request new code</Button>}
              </Stack>
            )}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
