import { useState, useRef } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormHelperText,
  MenuItem,
  TextField,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';
import {
  AccountBalanceWalletOutlined,
  AddRounded,
  AutorenewRounded,
  CloudUploadOutlined,
  DeleteOutlineRounded,
  EventRepeatOutlined,
  SubscriptionsOutlined,
} from '@mui/icons-material';

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

const INITIAL_SUBSCRIPTIONS = [
  {
    id: 'sub-1',
    name: 'Spotify Premium',
    category: 'Music & Audio',
    cost: 149.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 05, 2026',
    icon: null,
  },
  {
    id: 'sub-2',
    name: 'Netflix Standard',
    category: 'Entertainment',
    cost: 399.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 12, 2026',
    icon: null,
  },
  {
    id: 'sub-3',
    name: 'GitHub Pro',
    category: 'Developer Tools',
    cost: 230.0,
    billingCycle: 'Monthly',
    nextRenewal: 'Nov 18, 2026',
    icon: null,
  },
  {
    id: 'sub-4',
    name: 'Google One (100GB)',
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
  const [subscriptions, setSubscriptions] = useState(INITIAL_SUBSCRIPTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Calculate total monthly expense (normalizes Yearly subscriptions to Monthly cost)
  const totalMonthly = subscriptions.reduce((sum, item) => {
    const monthlyEquivalent =
      item.billingCycle === 'Yearly' ? item.cost / 12 : item.cost;
    return sum + monthlyEquivalent;
  }, 0);

  const nextUpcoming = subscriptions[0];

  const resetForm = () => {
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
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        icon: reader.result,
        iconName: file.name,
      }));
      setErrors((prev) => ({ ...prev, icon: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleClearIcon = () => {
    setFormData((prev) => ({ ...prev, icon: null, iconName: '' }));
    setErrors((prev) => ({ ...prev, icon: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Subscription name is required.';
    }

    const parsedCost = Number(formData.cost);
    if (!formData.cost || Number.isNaN(parsedCost) || parsedCost <= 0) {
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
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: 'background.paper' }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutorenewRounded sx={{ color: 'primary.main', fontSize: 26 }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: 'primary.dark' }}
              >
                SubSave
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="primary" sx={{ fontWeight: 700 }}>
                Dashboard
              </Button>
              <Button sx={{ color: 'text.secondary' }}>Subscriptions</Button>
              <Button sx={{ color: 'text.secondary' }}>Reports</Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
            onClick={handleOpenModal}
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
                {subscriptions.length}
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
                {nextUpcoming ? nextUpcoming.nextRenewal : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {nextUpcoming
                  ? `${nextUpcoming.name} (₱${nextUpcoming.cost.toFixed(2)})`
                  : 'No upcoming renewals'}
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
            label={`${subscriptions.length} Active`}
            size="small"
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.dark',
              fontWeight: 600,
            }}
          />
        </Box>

        <div className="subscription-grid">
          {subscriptions.map((sub) => (
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
                      src={sub.icon || undefined}
                      alt={sub.name}
                      variant="rounded"
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.dark',
                        fontWeight: 700,
                      }}
                    >
                      {sub.name.charAt(0).toUpperCase()}
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
      </Container>

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

            {/* Custom Icon Upload (PNG/JPEG) with Default Placeholder Fallback */}
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
                  src={formData.icon || undefined}
                  variant="rounded"
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor: 'primary.light',
                    color: 'primary.dark',
                    fontWeight: 700,
                    border: '1px solid #a7f3d0',
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

                {formData.icon && (
                  <Button
                    color="error"
                    size="small"
                    onClick={handleClearIcon}
                    sx={{ minWidth: 'auto', p: 0.75 }}
                    aria-label="Remove uploaded icon"
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