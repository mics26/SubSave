import { useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { ArrowBackRounded, SaveOutlined } from '@mui/icons-material';
import PasswordField from './PasswordField.jsx';

export default function AccountPage({ user, service, onChanged, onBack }) {
  const [values, setValues] = useState({ name: user.name, email: user.email, currentPassword: '', password: '', confirmPassword: '' });
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const dirty = values.name !== user.name || values.email !== user.email || Boolean(values.password || values.currentPassword || values.confirmPassword);

  function input(name) {
    return {
      name, value: values[name], disabled: busy,
      onChange: (event) => {
        setValues((previous) => ({ ...previous, [name]: event.target.value }));
        setFields((previous) => ({ ...previous, [name]: undefined }));
        setError('');
      },
      error: Boolean(fields[name]), helperText: fields[name],
    };
  }

  async function save(event) {
    event.preventDefault();
    if (submitting.current) return;
    if (values.password !== values.confirmPassword) {
      setFields({ confirmPassword: 'Passwords do not match.' });
      setError('Please check the highlighted fields.');
      return;
    }
    submitting.current = true;
    setBusy(true);
    setFields({});
    setError('');
    try {
      const updated = await service.updateAccount(user.id, values);
      setValues({ name: updated.name, email: updated.email, currentPassword: '', password: '', confirmPassword: '' });
      onChanged('Your account details have been saved.');
    } catch (failure) {
      setError(failure.message || 'Could not save your account. Please try again.');
      setFields(failure.fields || {});
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto' }}>
      <Button startIcon={<ArrowBackRounded />} onClick={onBack} disabled={busy} sx={{ mb: 2 }}>Back to dashboard</Button>
      <Typography variant="h5" component="h1" fontWeight={700}>Your account</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>Manage your profile and login details.</Typography>
      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3, minWidth: 0 }}>
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 52, height: 52 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
            <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              <Typography fontWeight={700}>{user.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
            </Box>
          </Stack>
          <Box component="form" noValidate onSubmit={save} aria-busy={busy}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField {...input('name')} label="Full name" required autoComplete="name" fullWidth />
              <TextField {...input('email')} label="Email address" type="email" required autoComplete="email" fullWidth />
              <Divider />
              <Box>
                <Typography fontWeight={600}>Login details</Typography>
                <Typography variant="body2" color="text.secondary">To change your email or password, confirm your current password. Leave the new password blank to keep it.</Typography>
              </Box>
              <PasswordField {...input('currentPassword')} label="Current password" autoComplete="current-password" />
              <PasswordField {...input('password')} label="New password" autoComplete="new-password" helperText={fields.password || 'Optional. Use 8–128 characters.'} />
              <PasswordField {...input('confirmPassword')} label="Confirm new password" autoComplete="new-password" />
              <Button type="submit" variant="contained" startIcon={<SaveOutlined />} disableElevation disabled={busy || !dirty} size="large">
                {busy ? 'Saving…' : 'Save changes'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
