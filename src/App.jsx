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
  Divider,
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
      </Container>
    </ThemeProvider>
  );
}

export default App;