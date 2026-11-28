import { useCallback, useEffect, useState, useRef } from 'react';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
  AutorenewRounded,
  CalendarMonthOutlined,
  CheckRounded,
  LogoutRounded,
  PersonOutlineRounded,
} from '@mui/icons-material';
import Dashboard from './dashboard/Dashboard.jsx';
import AccountDialog from './accounts/AccountDialog.jsx';
import AccountPage from './accounts/AccountPage.jsx';
import Welcome from './accounts/Welcome.jsx';
import { serverAccountService as accountService } from './accounts/serverAccountService.js';
import { serverSubscriptionService } from './subscriptions/serverSubscriptionService.js';
import SubscriptionEditor from './subscriptions/SubscriptionEditor.jsx';

const greenTheme = createTheme({
  palette: {
    primary: {
      main: '#10b981',
      dark: '#047857',
      light: '#ecfdf5',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f4f7f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
});

function App() {
  const [{ user, error: accountError, loading }, setAccount] = useState({ user: null, error: '', loading: true });
  const [dialog, setDialog] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [demoDate, setDemoDate] = useState(null);
  const [notification, setNotification] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionLoad, setSubscriptionLoad] = useState({ loading: false, error: null });
  const [subscriptionWrite, setSubscriptionWrite] = useState({ saving: false, error: '' });
  const [subscriptionAction, setSubscriptionAction] = useState(null);
  const accountRequestRef = useRef(0);
  const serverAccountIdRef = useRef(null);
  const subscriptionReadRef = useRef(0);
  const subscriptionWriteRef = useRef(null);
  const showAccountPage = Boolean(user && page === 'account');
  const isDeleting = subscriptionAction?.type === 'delete';

  const loadServerSubscriptions = useCallback((accountId) => {
    const readId = ++subscriptionReadRef.current;
    setSubscriptionLoad({ loading: true, error: null });
    serverSubscriptionService.list(accountId).then(
      (records) => {
        if (readId !== subscriptionReadRef.current) return;
        setSubscriptions(records);
        setSubscriptionLoad({ loading: false, error: null });
      },
      (error) => {
        if (readId === subscriptionReadRef.current) setSubscriptionLoad({ loading: false, error });
      },
    );
  }, []);

  const applyAccount = useCallback((nextAccount) => {
    const accountId = nextAccount.user?.id ?? null;
    if (serverAccountIdRef.current !== accountId) {
      serverAccountIdRef.current = accountId;
      subscriptionReadRef.current += 1;
      subscriptionWriteRef.current = null;
      setSubscriptions([]);
      setDemoDate(null);
      setSubscriptionWrite({ saving: false, error: '' });
      setSubscriptionAction(null);
      setMenuAnchor(null);
      setPage('dashboard');
      if (accountId) loadServerSubscriptions(accountId);
      else setSubscriptionLoad({ loading: false, error: null });
    }
    setAccount(nextAccount);
  }, [loadServerSubscriptions]);

  const refreshAccount = useCallback(() => {
    const requestId = ++accountRequestRef.current;
    accountService.currentAccount().then(
      (nextUser) => {
        if (requestId === accountRequestRef.current) applyAccount({ user: nextUser, error: '' });
      },
      (error) => {
        if (requestId === accountRequestRef.current) applyAccount({ user: null, error: error.message });
      },
    );
  }, [applyAccount]);

  useEffect(() => {
    refreshAccount();
    window.addEventListener('focus', refreshAccount);
    return () => {
      accountRequestRef.current += 1;
      window.removeEventListener('focus', refreshAccount);
    };
  }, [refreshAccount]);

  function accountChanged(message, nextUser) {
    if (nextUser === undefined) {
      refreshAccount();
    } else {
      accountRequestRef.current += 1;
      applyAccount({ user: nextUser, error: '' });
    }
    if (message) setNotification({ severity: 'success', message });
  }

  function closeDialog() {
    setDialog(null);
  }

  async function logout() {
    setMenuAnchor(null);
    try {
      await accountService.logout();
      accountChanged('You’re logged out.', null);
    } catch (error) {
      setNotification({ severity: 'error', message: error.message });
    }
  }

  function showDashboard() {
    setPage('dashboard');
    window.scrollTo(0, 0);
  }

  function openSubscriptionAction(action) {
    setSubscriptionWrite({ saving: false, error: '' });
    setSubscriptionAction(action);
  }

  function closeSubscriptionAction() {
    setSubscriptionAction(null);
  }

  async function persistSubscription(request, updateRecords) {
    const accountId = serverAccountIdRef.current;
    if (!accountId || subscriptionWriteRef.current) return;
    const writeId = Symbol();
    subscriptionWriteRef.current = writeId;
    setSubscriptionWrite({ saving: true, error: '' });
    let message = '';
    try {
      const record = await request(accountId);
      if (subscriptionWriteRef.current !== writeId) return;
      setSubscriptions((records) => updateRecords(records, record));
      closeSubscriptionAction();
    } catch (error) {
      if (subscriptionWriteRef.current !== writeId) return;
      message = error.message;
      if (error.status === 401) refreshAccount();
      if (error.status === 404) loadServerSubscriptions(accountId);
    } finally {
      if (subscriptionWriteRef.current === writeId) {
        subscriptionWriteRef.current = null;
        setSubscriptionWrite({ saving: false, error: message });
      }
    }
  }

  function handleSaveSubscription(fields) {
    const subscription = subscriptionAction.subscription;
    if (subscription) {
      void persistSubscription(
        (accountId) => serverSubscriptionService.edit(accountId, subscription.id, fields),
        (records, saved) => records.map((record) => record.id === saved.id ? { ...record, ...saved } : record),
      );
    } else {
      void persistSubscription(
        (accountId) => serverSubscriptionService.add(accountId, fields),
        (records, saved) => [...records, saved],
      );
    }
  }

  const handleDeleteSubscription = () => {
    if (!isDeleting) return;
    const { id } = subscriptionAction;
    const removeRecord = (records) => records.filter((subscription) => subscription.id !== id);
    void persistSubscription((accountId) => serverSubscriptionService.delete(accountId, id), removeRecord);
  };

  return (
    <ThemeProvider theme={greenTheme}>
      <CssBaseline />

      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid #e5e7eb', bgcolor: 'rgba(255,255,255,.88)', backdropFilter: 'blur(12px)' }}
      >
        <Container maxWidth={false} sx={{ maxWidth: 1180 }}>
          <Toolbar disableGutters className="app-toolbar">
            <Box component="button" className="app-logo" onClick={showDashboard} aria-label={user ? 'SubSave dashboard' : 'SubSave home'}>
              <Box className="app-logo-mark"><AutorenewRounded sx={{ fontSize: 22 }} /></Box>
              <Typography
                variant="h6"
                component="span"
                sx={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, color: 'primary.dark', fontSize: 22, letterSpacing: '-.02em' }}
              >
                SubSave
              </Typography>
            </Box>

            {user && (
              <Button
                id="account-menu-button" aria-label="Open account menu" aria-controls={menuAnchor ? 'account-menu' : undefined}
                aria-haspopup="true" aria-expanded={Boolean(menuAnchor)} onClick={(event) => setMenuAnchor(event.currentTarget)}
                sx={{ color: 'text.primary', gap: 1, minWidth: 0 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark', fontSize: 15 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</Box>
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Menu id="account-menu" anchorEl={menuAnchor} open={Boolean(menuAnchor) && Boolean(user)} onClose={() => setMenuAnchor(null)}
        slotProps={{ list: { 'aria-labelledby': 'account-menu-button' } }}>
        <MenuItem onClick={() => { setPage('account'); setMenuAnchor(null); }}>
          <ListItemIcon><PersonOutlineRounded fontSize="small" /></ListItemIcon>Your account
        </MenuItem>
        <MenuItem role="menuitemcheckbox" aria-checked={demoDate !== null} onClick={() => {
          setDemoDate((date) => date === null ? '' : null);
          setMenuAnchor(null);
          showDashboard();
        }}>
          <ListItemIcon>
            {demoDate === null ? <CalendarMonthOutlined fontSize="small" /> : <CheckRounded fontSize="small" />}
          </ListItemIcon>
          Demo Mode
        </MenuItem>
        <MenuItem onClick={logout}><ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Log out</MenuItem>
      </Menu>

      {/* Main Content */}
      <Container component="main" maxWidth={false} sx={{ maxWidth: 1180, pt: { xs: 3, sm: 4.5 }, pb: 8 }}>
        {accountError && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" onClick={refreshAccount}>Retry</Button>}>{accountError}</Alert>}
        {loading && <Typography role="status">Checking your session…</Typography>}
        {!loading && !user && <Welcome onLogin={() => setDialog('login')} onRegister={() => setDialog('register')} />}
        {showAccountPage && (
          <AccountPage key={`${user.id}:${user.name}:${user.email}`} user={user} service={accountService} onChanged={accountChanged} onBack={showDashboard} />
        )}
        {user && !showAccountPage && (
          <>
            {subscriptionLoad.loading && <Typography role="status">Loading subscriptions…</Typography>}
            {subscriptionLoad.error && (
              <Alert severity="error" action={<Button color="inherit" onClick={() => {
                if (subscriptionLoad.error.status === 401) refreshAccount();
                else loadServerSubscriptions(user.id);
              }}>Retry</Button>}>
                {subscriptionLoad.error.message}
              </Alert>
            )}
            {!subscriptionLoad.loading && !subscriptionLoad.error && (
              <Dashboard
                subscriptions={subscriptions}
                demoDate={demoDate}
                onDemoDateChange={setDemoDate}
                onAddSubscription={() => openSubscriptionAction({ type: 'editor' })}
                onEditSubscription={(subscription) => openSubscriptionAction({ type: 'editor', subscription })}
                onDeleteSubscription={({ id, name }) => openSubscriptionAction({ type: 'delete', id, name })}
              />
            )}
          </>
        )}
      </Container>
      {dialog && <AccountDialog initialMode={dialog} service={accountService} onClose={closeDialog} onChanged={accountChanged} />}
      <Snackbar open={Boolean(notification)} autoHideDuration={6000} onClose={(_, reason) => { if (reason !== 'clickaway') setNotification(null); }}>
        {notification ? <Alert severity={notification.severity} variant="filled" onClose={() => setNotification(null)} sx={{ width: '100%' }}>{notification.message}</Alert> : undefined}
      </Snackbar>

      {subscriptionAction?.type === 'editor' && (
        <SubscriptionEditor
          key={subscriptionAction.subscription?.id ?? 'new'}
          subscription={subscriptionAction.subscription}
          saving={subscriptionWrite.saving}
          saveError={subscriptionWrite.error}
          onClose={closeSubscriptionAction}
          onSave={handleSaveSubscription}
        />
      )}

      <Dialog
        open={isDeleting}
        onClose={subscriptionWrite.saving ? undefined : closeSubscriptionAction}
        aria-labelledby="delete-subscription-title"
        aria-describedby="delete-subscription-description"
      >
        <DialogTitle id="delete-subscription-title">Delete subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-subscription-description" sx={{ overflowWrap: 'anywhere' }}>
            Remove <strong>{subscriptionAction?.name}</strong> from your subscriptions?
          </DialogContentText>
          {subscriptionWrite.error && <Alert severity="error" sx={{ mt: 2 }}>{subscriptionWrite.error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={closeSubscriptionAction} disabled={subscriptionWrite.saving}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteSubscription} disabled={subscriptionWrite.saving}>
            {subscriptionWrite.saving ? 'Deleting…' : 'Delete Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
