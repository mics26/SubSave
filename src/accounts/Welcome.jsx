import { Button, Paper, Stack, Typography } from '@mui/material';

export default function Welcome({ onLogin, onRegister }) {
  return (
    <Paper component="section" variant="outlined" aria-labelledby="welcome-heading"
      sx={{
        maxWidth: 560, mx: 'auto', mt: { xs: 2, sm: 5 },
        px: { xs: 2.5, sm: 5 }, py: { xs: 4, sm: 6 }, textAlign: 'center',
        borderColor: '#e5e7eb', boxShadow: '0 8px 24px rgb(15 23 42 / 5%)',
      }}>
      <Typography component="h1" id="welcome-heading"
        sx={{
          fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
          fontWeight: 700, fontSize: { xs: 30, sm: 40 }, lineHeight: 1.15, letterSpacing: '-.03em',
        }}>
        Welcome to SubSave
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1.5 }}>
        Track your subscriptions, spending, and renewal dates in one place.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3, justifyContent: 'center' }}>
        <Button variant="contained" size="large" disableElevation onClick={onRegister}
          sx={{ bgcolor: 'primary.dark', '&:hover': { bgcolor: '#065f46' } }}>
          Create account
        </Button>
        <Button variant="outlined" size="large" onClick={onLogin}
          sx={{ color: 'primary.dark', borderColor: 'primary.dark' }}>
          Log in
        </Button>
      </Stack>
    </Paper>
  );
}
