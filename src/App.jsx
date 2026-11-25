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
  FormHelperText,
  ListItemIcon,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';
import {
  AutorenewRounded,
  CloudUploadOutlined,
  DeleteOutlineRounded,
  LogoutRounded,
  PersonOutlineRounded,
} from '@mui/icons-material';
import Dashboard from './dashboard/Dashboard.jsx';
import { formatCalendarDate } from './dashboard/dashboardModel.js';
import AccountDialog from './accounts/AccountDialog.jsx';
import AccountPage from './accounts/AccountPage.jsx';
import { ACCOUNT_STORAGE_KEY, createAccountService } from './accounts/accountService.js';
import { serverAccountService } from './accounts/serverAccountService.js';
import { getSubscriptionIcon, PRESET_ICONS } from './subscriptions/presetIcons.js';
import { DEMO_OWNER_ID, SAMPLE_SUBSCRIPTIONS } from './subscriptions/sampleSubscriptions.js';
import {
  BILLING_CYCLES,
  MAX_SUBSCRIPTION_ICON_BYTES,
  SUBSCRIPTION_CATEGORIES,
  validateSubscriptionFields,
} from './subscriptions/subscriptionRecord.js';

const useServerAccounts = import.meta.env.VITE_SUBSAVE_AUTH_MODE === 'server';
const accountService = useServerAccounts ? serverAccountService : createAccountService();

function readDemoAccount() {
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

const INITIAL_FORM_STATE = {
  name: '',
  category: 'General',
  cost: '',
  billingCycle: 'Monthly',
  nextRenewal: '',
  icon: null,
  iconName: '',
  iconPreset: 'auto',
};
const CUSTOM_ICON_TYPES = ['image/png', 'image/jpeg'];

function App() {
  const [{ user, error: accountError, loading }, setAccount] = useState(() =>
    useServerAccounts ? { user: null, error: '', loading: true } : readDemoAccount());
  const [dialog, setDialog] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [notification, setNotification] = useState(null);
  const [subscriptions, setSubscriptions] = useState(() => useServerAccounts ? [] : SAMPLE_SUBSCRIPTIONS);
  const [subscriptionAction, setSubscriptionAction] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isReadingIcon, setIsReadingIcon] = useState(false);
  const fileInputRef = useRef(null);
  const iconReadRef = useRef(0);
  const accountRequestRef = useRef(0);
  const serverAccountIdRef = useRef(null);
  const canShowDashboard = !useServerAccounts || Boolean(user);
  const isEditing = subscriptionAction?.type === 'edit';
  const isDeleting = subscriptionAction?.type === 'delete';

  const resetForm = useCallback((values = INITIAL_FORM_STATE) => {
    iconReadRef.current += 1;
    setIsReadingIcon(false);
    setFormData(values);
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const applyAccount = useCallback((nextAccount) => {
    const accountId = nextAccount.user?.id ?? null;
    if (useServerAccounts && serverAccountIdRef.current !== accountId) {
      serverAccountIdRef.current = accountId;
      setSubscriptions([]);
      setSubscriptionAction(null);
      resetForm();
      setMenuAnchor(null);
      setPage('dashboard');
    }
    setAccount(nextAccount);
  }, [resetForm]);

  const refreshServerAccount = useCallback(() => {
    const requestId = ++accountRequestRef.current;
    serverAccountService.currentAccount().then(
      (nextUser) => {
        if (requestId === accountRequestRef.current) applyAccount({ user: nextUser, error: '' });
      },
      (error) => {
        if (requestId === accountRequestRef.current) applyAccount({ user: null, error: error.message });
      },
    );
  }, [applyAccount]);

  useEffect(() => {
    if (useServerAccounts) {
      refreshServerAccount();
      window.addEventListener('focus', refreshServerAccount);
      return () => {
        accountRequestRef.current += 1;
        window.removeEventListener('focus', refreshServerAccount);
      };
    }
    function syncStorage(event) {
      if (event.key === ACCOUNT_STORAGE_KEY || event.key === null) {
        applyAccount(readDemoAccount());
        setMenuAnchor(null);
      }
    }
    window.addEventListener('storage', syncStorage);
    return () => window.removeEventListener('storage', syncStorage);
  }, [applyAccount, refreshServerAccount]);

  function refreshAccount() {
    if (useServerAccounts) refreshServerAccount();
    else applyAccount(readDemoAccount());
  }

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
    accountService.cancelRecovery?.();
    setDialog(null);
  }

  async function logout() {
    setMenuAnchor(null);
    try {
      await accountService.logout();
      accountChanged('You’re logged out.', null);
      setPage('dashboard');
    } catch (error) {
      setNotification({ severity: 'error', message: error.message });
    }
  }

  function showDashboardSection(section) {
    setPage('dashboard');
    window.requestAnimationFrame(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }

  const handleOpenModal = (subscription) => {
    if (!subscription) {
      resetForm();
      setSubscriptionAction({ type: 'add' });
      return;
    }

    const { id, name, category, cost, billingCycle, date, icon, iconPreset } = subscription;
    resetForm({
      ...INITIAL_FORM_STATE, name, category, cost: String(cost), billingCycle,
      nextRenewal: date ? formatCalendarDate(date) : '',
      icon: icon ?? null, iconPreset: iconPreset ?? (icon ? 'custom' : 'auto'),
    });
    setSubscriptionAction({ type: 'edit', id });
  };

  const handleCloseModal = () => {
    resetForm();
    setSubscriptionAction(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const readId = ++iconReadRef.current;

    let uploadError = '';
    if (!file.size || !CUSTOM_ICON_TYPES.includes(file.type)) {
      uploadError = 'Choose a non-empty PNG or JPEG image.';
    } else if (file.size > MAX_SUBSCRIPTION_ICON_BYTES) {
      uploadError = 'Choose an image that is 1 MiB or smaller.';
    }
    setErrors((prev) => ({ ...prev, icon: uploadError }));
    setIsReadingIcon(!uploadError);
    if (uploadError) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (readId !== iconReadRef.current) return;
      setIsReadingIcon(false);
      setFormData((prev) => ({
        ...prev,
        icon: reader.result,
        iconName: file.name,
        iconPreset: 'custom',
      }));
    };
    reader.onerror = () => {
      if (readId === iconReadRef.current) {
        setIsReadingIcon(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setErrors((prev) => ({ ...prev, icon: 'This image could not be read. Choose another file.' }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetIcon = (iconPreset) => {
    iconReadRef.current += 1;
    setIsReadingIcon(false);
    setFormData((prev) => ({ ...prev, iconPreset, icon: null, iconName: '' }));
    setErrors((prev) => ({ ...prev, icon: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isReadingIcon) return;

    const fields = {
      name: formData.name.trim(),
      category: formData.category,
      cost: Number(formData.cost),
      billingCycle: formData.billingCycle,
      nextRenewal: formData.nextRenewal,
      icon: formData.icon || null,
      iconPreset: formData.iconPreset,
    };
    const validationErrors = validateSubscriptionFields(fields);
    if (errors.icon) validationErrors.icon = errors.icon;
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    if (isEditing) {
      const { id } = subscriptionAction;
      setSubscriptions((prev) => prev.map((subscription) => (
        subscription.id === id ? { ...subscription, ...fields } : subscription
      )));
    } else {
      const ownerId = useServerAccounts ? user.id : DEMO_OWNER_ID;
      const newSubscription = { ...fields, id: crypto.randomUUID(), ownerId };
      setSubscriptions((prev) => [...prev, newSubscription]);
    }
    handleCloseModal();
  };

  const handleDeleteSubscription = () => {
    if (!isDeleting) return;
    const { id } = subscriptionAction;
    setSubscriptions((prev) => prev.filter((subscription) => subscription.id !== id));
    setSubscriptionAction(null);
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
            <Box component="button" className="app-logo" onClick={() => setPage('dashboard')} aria-label="SubSave dashboard">
              <Box className="app-logo-mark"><AutorenewRounded sx={{ fontSize: 22 }} /></Box>
              <Typography
                variant="h6"
                component="span"
                sx={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, color: 'primary.dark', fontSize: 22, letterSpacing: '-.02em' }}
              >
                SubSave
              </Typography>
            </Box>

            {canShowDashboard && <Box component="nav" aria-label="Main navigation" className="app-navigation">
              <Button className={page === 'dashboard' || !user ? 'nav-active' : undefined} onClick={() => setPage('dashboard')} aria-current={page === 'dashboard' || !user ? 'page' : undefined}>
                Dashboard
              </Button>
              <Button onClick={() => showDashboardSection('subscriptions')}>Subscriptions</Button>
              <Button onClick={() => showDashboardSection('spending')}>Reports</Button>
            </Box>}
            {user ? (
              <Button
                id="account-menu-button" aria-label="Open account menu" aria-controls={menuAnchor ? 'account-menu' : undefined}
                aria-haspopup="true" aria-expanded={Boolean(menuAnchor)} onClick={(event) => setMenuAnchor(event.currentTarget)}
                sx={{ color: 'text.primary', gap: 1, minWidth: 0 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark', fontSize: 15 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</Box>
              </Button>
            ) : !loading && (
              <Box className="app-auth-actions" sx={{ display: 'flex', gap: 0.5 }}>
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
      <Container component="main" maxWidth={false} sx={{ maxWidth: 1180, pt: { xs: 3, sm: 4.5 }, pb: 8 }}>
        {accountError && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" onClick={refreshAccount}>Retry</Button>}>{accountError}</Alert>}
        {loading && <Typography role="status">Checking your session…</Typography>}
        {!loading && !canShowDashboard && !accountError && <Typography>Log in or create an account to manage your subscriptions.</Typography>}
        {canShowDashboard && (page === 'account' && user ? (
          <AccountPage key={`${user.id}:${user.name}:${user.email}`} user={user} service={accountService} onChanged={accountChanged} onBack={() => setPage('dashboard')} />
        ) : (
          <Dashboard
            subscriptions={subscriptions}
            onAddSubscription={() => handleOpenModal()}
            onEditSubscription={handleOpenModal}
            onDeleteSubscription={({ id, name }) => setSubscriptionAction({ type: 'delete', id, name })}
          />
        ))}
      </Container>
      {dialog && <AccountDialog initialMode={dialog} service={accountService} onClose={closeDialog} onChanged={accountChanged} allowRecovery={!useServerAccounts} />}
      <Snackbar open={Boolean(notification)} autoHideDuration={6000} onClose={(_, reason) => { if (reason !== 'clickaway') setNotification(null); }}>
        {notification ? <Alert severity={notification.severity} variant="filled" onClose={() => setNotification(null)} sx={{ width: '100%' }}>{notification.message}</Alert> : undefined}
      </Snackbar>

      <Dialog
        open={subscriptionAction !== null && !isDeleting}
        onClose={handleCloseModal}
        aria-labelledby="subscription-form-title"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="subscription-form-title" sx={{ fontWeight: 700, pb: 1 }}>
          {isEditing ? 'Edit Subscription' : 'Add New Subscription'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
          >
            <TextField
              label="Subscription Name"
              name="name"
              placeholder="e.g., Canva Pro"
              value={formData.name}
              onChange={handleInputChange}
              error={Boolean(errors.name)}
              helperText={errors.name}
              size="small"
              fullWidth
              required
            />

            <TextField
              label="Category"
              name="category"
              select
              value={formData.category}
              onChange={handleInputChange}
              error={Boolean(errors.category)}
              helperText={errors.category}
              size="small"
              fullWidth
            >
              {SUBSCRIPTION_CATEGORIES.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
            </TextField>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Cost (₱)"
                name="cost"
                type="number"
                placeholder="0.00"
                value={formData.cost}
                onChange={handleInputChange}
                error={Boolean(errors.cost)}
                helperText={errors.cost}
                size="small"
                fullWidth
                required
                slotProps={{ htmlInput: { min: '0.01', step: '0.01' } }}
              />

              <TextField
                label="Billing Cycle"
                name="billingCycle"
                select
                value={formData.billingCycle}
                onChange={handleInputChange}
                error={Boolean(errors.billingCycle)}
                helperText={errors.billingCycle}
                size="small"
                fullWidth
                required
              >
                {BILLING_CYCLES.map((cycle) => <MenuItem key={cycle} value={cycle}>{cycle}</MenuItem>)}
              </TextField>
            </Box>

            <TextField
              label="Next Renewal Date"
              name="nextRenewal"
              type="date"
              value={formData.nextRenewal}
              onChange={handleInputChange}
              error={Boolean(errors.nextRenewal)}
              helperText={errors.nextRenewal}
              size="small"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box>
              <Typography id="subscription-icon-label" variant="body2" fontWeight={600} sx={{ mb: 1 }}>Subscription icon</Typography>
              <Box role="group" aria-labelledby="subscription-icon-label" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                {[{ id: 'auto', label: 'Automatic' }, ...PRESET_ICONS, { id: 'none', label: 'No icon' }].map((preset) => (
                  <Button key={preset.id} type="button" aria-pressed={formData.iconPreset === preset.id}
                    onClick={() => handlePresetIcon(preset.id)} variant="outlined" size="small"
                    startIcon={preset.src ? <Box component="img" src={preset.src} alt="" sx={{ width: 20, height: 20, objectFit: 'contain' }} /> : undefined}
                    sx={{ justifyContent: 'flex-start', px: 1.5, py: 1, borderRadius: 2, color: formData.iconPreset === preset.id ? 'primary.dark' : 'text.secondary',
                      borderColor: formData.iconPreset === preset.id ? 'primary.main' : 'divider', bgcolor: formData.iconPreset === preset.id ? 'primary.light' : 'transparent' }}>
                    {preset.label}
                  </Button>
                ))}
              </Box>
              <FormHelperText sx={{ mx: 0, mt: 1 }}>Automatic matches the service name. You can also choose a preset or upload your own.</FormHelperText>
            </Box>

            {/* Custom uploads override automatic matching and selected presets. */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.75, fontWeight: 500 }}
              >
                Custom icon (optional, PNG or JPEG up to 1 MiB)
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={getSubscriptionIcon(formData)}
                  alt="Selected subscription icon"
                  variant="rounded"
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                    fontWeight: 700,
                    border: '1px solid #a7f3d0',
                    '& img': { objectFit: 'contain', p: formData.icon ? 0 : 1 },
                  }}
                >
                  {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                </Avatar>

                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<CloudUploadOutlined />}
                  sx={{ flexGrow: 1 }}
                >
                  {formData.icon ? 'Change Icon' : 'Upload PNG/JPEG'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={CUSTOM_ICON_TYPES.join(',')}
                    hidden
                    onChange={handleIconUpload}
                  />
                </Button>

                {(getSubscriptionIcon(formData) || errors.icon || isReadingIcon) && (
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handlePresetIcon('none')}
                    sx={{ minWidth: 'auto', p: 0.75 }}
                    aria-label="Remove selected icon"
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </Button>
                )}
              </Box>

              {formData.iconName && !errors.icon && (
                <FormHelperText sx={{ color: 'primary.dark', mt: 0.5 }}>
                  Selected: {formData.iconName}
                </FormHelperText>
              )}

              {errors.icon && (
                <FormHelperText error sx={{ mt: 0.5 }}>
                  {errors.icon}
                </FormHelperText>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disableElevation disabled={isReadingIcon}>
              Save Subscription
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={isDeleting}
        onClose={() => setSubscriptionAction(null)}
        aria-labelledby="delete-subscription-title"
        aria-describedby="delete-subscription-description"
      >
        <DialogTitle id="delete-subscription-title">Delete subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-subscription-description" sx={{ overflowWrap: 'anywhere' }}>
            Remove <strong>{subscriptionAction?.name}</strong> from your subscriptions?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setSubscriptionAction(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteSubscription}>Delete Subscription</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
