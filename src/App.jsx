import { useEffect, useState } from 'react';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Snackbar,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined,
  AddRounded,
  AutorenewRounded,
  EventRepeatOutlined,
  LogoutRounded,
  PersonOutlineRounded,
  SubscriptionsOutlined,
} from '@mui/icons-material';
import AccountDialog from './accounts/AccountDialog.jsx';
import AccountPage from './accounts/AccountPage.jsx';
import { ACCOUNT_STORAGE_KEY, createAccountService } from './accounts/accountService.js';

const accountService = createAccountService();

function readAccount() {
  try {
    return { user: accountService.currentAccount(), error: '' };
  } catch (error) {
    return { user: null, error: error.message };
  }
}

const greenTheme = createTheme({
  palette: {
    primary: {
      main: '#10b981',
      dark: '#047857',
      light: '#ecfdf5',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f7f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
});

const SAMPLE_SUBSCRIPTIONS = [
  {
    id: 'sub-1',
    name: 'Spotify Premium',
    category: 'Music & Audio',
    cost: 149.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 05, 2026',
  },
  {
    id: 'sub-2',
    name: 'Netflix Standard',
    category: 'Entertainment',
    cost: 399.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 12, 2026',
  },
  {
    id: 'sub-3',
    name: 'GitHub Pro',
    category: 'Developer Tools',
    cost: 230.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 18, 2026',
  },
  {
    id: 'sub-4',
    name: 'Google One (100GB)',
    category: 'Cloud Storage',
    cost: 89.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 24, 2026',
  },
];

function App() {
  const [{ user, error: storageError }, setAccount] = useState(readAccount);
  const [dialog, setDialog] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    function syncStorage(event) {
      if (event.key === ACCOUNT_STORAGE_KEY || event.key === null) {
        setAccount(readAccount());
        setMenuAnchor(null);
      }
    }
    window.addEventListener('storage', syncStorage);
    return () => window.removeEventListener('storage', syncStorage);
  }, []);

  function accountChanged(message) {
    setAccount(readAccount());
    if (message) setNotification({ severity: 'success', message });
  }

  function closeDialog() {
    accountService.cancelRecovery();
    setDialog(null);
  }

  function logout() {
    setMenuAnchor(null);
    try {
      accountService.logout();
      accountChanged('You’re logged out.');
      setPage('dashboard');
    } catch (error) {
      setNotification({ severity: 'error', message: error.message });
    }
  }

  const totalMonthly = SAMPLE_SUBSCRIPTIONS.reduce(
    (sum, item) => sum + item.cost,
    0
  );

  const nextUpcoming = SAMPLE_SUBSCRIPTIONS[0];

  return (
    <ThemeProvider theme={greenTheme}>
      <CssBaseline />

      {/* Top Navigation Bar */}
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'background.paper' }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 1, rowGap: 0.5, py: { xs: 1, sm: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutorenewRounded sx={{ color: 'primary.main', fontSize: 26 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: 'primary.dark' }}
              >
                SubSave
              </Typography>
            </Box>

            <Box component="nav" aria-label="Main navigation" sx={{ display: 'flex', gap: { xs: 0, sm: 1 }, order: { xs: 3, md: 0 }, width: { xs: '100%', md: 'auto' }, justifyContent: 'center' }}>
              <Button color="primary" sx={{ fontWeight: 700 }} onClick={() => setPage('dashboard')} aria-current={page === 'dashboard' || !user ? 'page' : undefined}>
                Dashboard
              </Button>
              <Button sx={{ color: 'text.secondary' }}>Subscriptions</Button>
              <Button sx={{ color: 'text.secondary' }}>Reports</Button>
            </Box>
            {user ? (
              <Button
                id="account-menu-button" aria-label="Open account menu" aria-controls={menuAnchor ? 'account-menu' : undefined}
                aria-haspopup="true" aria-expanded={Boolean(menuAnchor)} onClick={(event) => setMenuAnchor(event.currentTarget)}
                sx={{ color: 'text.primary', gap: 1, minWidth: 0 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark', fontSize: 15 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</Box>
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button onClick={() => setDialog('login')}>Log in</Button>
                <Button variant="contained" disableElevation onClick={() => setDialog('register')}>Create account</Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Menu id="account-menu" anchorEl={menuAnchor} open={Boolean(menuAnchor) && Boolean(user)} onClose={() => setMenuAnchor(null)}
        slotProps={{ list: { 'aria-labelledby': 'account-menu-button' } }}>
        <MenuItem onClick={() => { setPage('account'); setMenuAnchor(null); }}>
          <ListItemIcon><PersonOutlineRounded fontSize="small" /></ListItemIcon>Your account
        </MenuItem>
        <MenuItem onClick={logout}><ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Log out</MenuItem>
      </Menu>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {storageError && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" onClick={() => setAccount(readAccount())}>Retry</Button>}>{storageError}</Alert>}
        {page === 'account' && user ? (
          <AccountPage key={`${user.id}:${user.name}:${user.email}`} user={user} service={accountService} onChanged={accountChanged} onBack={() => setPage('dashboard')} />
        ) : (
          <>
        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3.5,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Dashboard Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your active subscriptions, monthly costs, and upcoming renewals.
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRounded />}
            disableElevation
          >
            Add Subscription
          </Button>
        </Box>

        {/* Monthly Expense & Summary Overview */}
        <div className="overview-grid">
          <Card
            variant="outlined"
            sx={{
              bgcolor: 'primary.light',
              borderColor: '#a7f3d0',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Total Monthly Expense
                </Typography>
                <AccountBalanceWalletOutlined sx={{ color: 'primary.dark', fontSize: 20 }} />
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: 'primary.dark', my: 0.5 }}
              >
                ₱{totalMonthly.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Estimated recurring monthly spend
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Active Subscriptions
                </Typography>
                <SubscriptionsOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, my: 0.5 }}>
                {SAMPLE_SUBSCRIPTIONS.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All services currently active
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Next Renewal
                </Typography>
                <EventRepeatOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, my: 0.8 }}>
                {nextUpcoming.nextRenewal}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {nextUpcoming.name} (₱{nextUpcoming.cost.toFixed(2)})
              </Typography>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions List Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Your Subscriptions
          </Typography>
          <Chip
            label={`${SAMPLE_SUBSCRIPTIONS.length} Active`}
            size="small"
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.dark',
              fontWeight: 600,
            }}
          />
        </Box>

        <div className="subscription-grid">
          {SAMPLE_SUBSCRIPTIONS.map((sub) => (
            <Card
              key={sub.id}
              variant="outlined"
              sx={{
                transition: 'border-color 0.15s ease',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        fontWeight: 700,
                      }}
                    >
                      {sub.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {sub.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sub.category}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                      ₱{sub.cost.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sub.billingCycle}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Upcoming Renewal
                  </Typography>
                  <Chip
                    label={sub.nextRenewal}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: '#a7f3d0',
                      color: 'primary.dark',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </div>
          </>
        )}
      </Container>
      {dialog && <AccountDialog initialMode={dialog} service={accountService} onClose={closeDialog} onChanged={accountChanged} />}
      <Snackbar open={Boolean(notification)} autoHideDuration={6000} onClose={(_, reason) => { if (reason !== 'clickaway') setNotification(null); }}>
        {notification ? <Alert severity={notification.severity} variant="filled" onClose={() => setNotification(null)} sx={{ width: '100%' }}>{notification.message}</Alert> : undefined}
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
