import { useEffect, useState, useRef } from 'react';
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
import AccountDialog from './accounts/AccountDialog.jsx';
import AccountPage from './accounts/AccountPage.jsx';
import { ACCOUNT_STORAGE_KEY, createAccountService } from './accounts/accountService.js';
import { getSubscriptionIcon, PRESET_ICONS } from './subscriptions/presetIcons.js';

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

const INITIAL_SUBSCRIPTIONS = [
  {
    id: 'sub-1',
    name: 'Spotify Premium',
    iconPreset: 'spotify',
    category: 'Music & Audio',
    cost: 149.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 05, 2026',
    icon: null,
  },
  {
    id: 'sub-2',
    name: 'Netflix Standard',
    iconPreset: 'netflix',
    category: 'Entertainment',
    cost: 399.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 12, 2026',
    icon: null,
  },
  {
    id: 'sub-3',
    name: 'GitHub Pro',
    iconPreset: 'github',
    category: 'Developer Tools',
    cost: 230.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 18, 2026',
    icon: null,
  },
  {
    id: 'sub-4',
    name: 'Google One (100GB)',
    iconPreset: 'google-one',
    category: 'Cloud Storage',
    cost: 89.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 24, 2026',
    icon: null,
  },
];

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

function formatRenewalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

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

  function showDashboardSection(section) {
    setPage('dashboard');
    window.requestAnimationFrame(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }

  const [subscriptions, setSubscriptions] = useState(INITIAL_SUBSCRIPTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const iconReadRef = useRef(0);

  const resetForm = () => {
    iconReadRef.current += 1;
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    resetForm();
    setIsModalOpen(false);
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

    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        icon: 'Only PNG and JPEG image formats are supported.',
      }));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (readId !== iconReadRef.current) return;
      setFormData((prev) => ({
        ...prev,
        icon: reader.result,
        iconName: file.name,
        iconPreset: 'custom',
      }));
      setErrors((prev) => ({ ...prev, icon: '' }));
    };
    reader.onerror = () => {
      if (readId === iconReadRef.current) {
        setErrors((prev) => ({ ...prev, icon: 'This image could not be read. Choose another file.' }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearIcon = () => {
    iconReadRef.current += 1;
    setFormData((prev) => ({ ...prev, icon: null, iconName: '', iconPreset: 'none' }));
    setErrors((prev) => ({ ...prev, icon: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePresetIcon = (iconPreset) => {
    iconReadRef.current += 1;
    setFormData((prev) => ({ ...prev, iconPreset, icon: null, iconName: '' }));
    setErrors((prev) => ({ ...prev, icon: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Subscription name is required.';
    }

    const parsedCost = Number(formData.cost);
    if (!formData.cost || !Number.isFinite(parsedCost) || parsedCost <= 0) {
      newErrors.cost = 'Please enter a valid cost greater than 0.';
    }

    if (!formData.billingCycle) {
      newErrors.billingCycle = 'Please select a billing cycle.';
    }

    if (!formData.nextRenewal) {
      newErrors.nextRenewal = 'Next renewal date is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newSubscription = {
      id: `sub-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category.trim() || 'General',
      cost: Number(formData.cost),
      billingCycle: formData.billingCycle,
      nextRenewal: formatRenewalDate(formData.nextRenewal),
      icon: formData.icon || null,
      iconPreset: formData.iconPreset,
    };

    setSubscriptions((prev) => [...prev, newSubscription]);
    resetForm();
    setIsModalOpen(false);
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

            <Box component="nav" aria-label="Main navigation" className="app-navigation">
              <Button className={page === 'dashboard' || !user ? 'nav-active' : undefined} onClick={() => setPage('dashboard')} aria-current={page === 'dashboard' || !user ? 'page' : undefined}>
                Dashboard
              </Button>
              <Button onClick={() => showDashboardSection('subscriptions')}>Subscriptions</Button>
              <Button onClick={() => showDashboardSection('spending')}>Reports</Button>
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
        {storageError && <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" onClick={() => setAccount(readAccount())}>Retry</Button>}>{storageError}</Alert>}
        {page === 'account' && user ? (
          <AccountPage key={`${user.id}:${user.name}:${user.email}`} user={user} service={accountService} onChanged={accountChanged} onBack={() => setPage('dashboard')} />
        ) : (
          <Dashboard subscriptions={subscriptions} onAddSubscription={handleOpenModal} />
        )}
      </Container>
      {dialog && <AccountDialog initialMode={dialog} service={accountService} onClose={closeDialog} onChanged={accountChanged} />}
      <Snackbar open={Boolean(notification)} autoHideDuration={6000} onClose={(_, reason) => { if (reason !== 'clickaway') setNotification(null); }}>
        {notification ? <Alert severity={notification.severity} variant="filled" onClose={() => setNotification(null)} sx={{ width: '100%' }}>{notification.message}</Alert> : undefined}
      </Snackbar>

      {/* Add Subscription Dialog Form */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Add New Subscription
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
              size="small"
              fullWidth
            >
              <MenuItem value="Entertainment">Entertainment</MenuItem>
              <MenuItem value="Music & Audio">Music & Audio</MenuItem>
              <MenuItem value="Developer Tools">Developer Tools</MenuItem>
              <MenuItem value="Cloud Storage">Cloud Storage</MenuItem>
              <MenuItem value="Productivity">Productivity</MenuItem>
              <MenuItem value="General">General</MenuItem>
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
                slotProps={{ htmlInput: { min: '0', step: '0.01' } }}
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
                <MenuItem value="Monthly">Monthly</MenuItem>
                <MenuItem value="Yearly">Yearly</MenuItem>
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
                Custom Icon (Optional — PNG or JPEG)
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
                  {formData.iconName ? 'Change Icon' : 'Upload PNG/JPEG'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    hidden
                    onChange={handleIconUpload}
                  />
                </Button>

                {getSubscriptionIcon(formData) && (
                  <Button
                    color="error"
                    size="small"
                    onClick={handleClearIcon}
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
            <Button type="submit" variant="contained" disableElevation>
              Save Subscription
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
