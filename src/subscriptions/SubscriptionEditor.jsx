import { useEffect, useRef, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormHelperText, MenuItem, TextField, Typography,
} from '@mui/material';
import { CloudUploadOutlined, DeleteOutlineRounded } from '@mui/icons-material';
import { formatCalendarDate } from '../dashboard/dashboardModel.js';
import { getSubscriptionIcon, PRESET_ICONS } from './presetIcons.js';
import {
  BILLING_CYCLES, MAX_SUBSCRIPTION_ICON_BYTES, SUBSCRIPTION_CATEGORIES, validateSubscriptionFields,
} from './subscriptionRecord.js';

const CUSTOM_ICON_TYPES = ['image/png', 'image/jpeg'];

export default function SubscriptionEditor({ subscription, onSave, onClose, saving, saveError }) {
  const [formData, setFormData] = useState(() => ({
    name: subscription?.name ?? '',
    category: subscription?.category ?? 'General',
    cost: subscription ? String(subscription.cost) : '',
    billingCycle: subscription?.billingCycle ?? 'Monthly',
    nextRenewal: subscription?.date ? formatCalendarDate(subscription.date) : '',
    icon: subscription?.icon ?? null,
    iconName: '',
    iconPreset: subscription?.iconPreset ?? (subscription?.icon ? 'custom' : 'auto'),
  }));
  const [errors, setErrors] = useState({});
  const [isReadingIcon, setIsReadingIcon] = useState(false);
  const iconReader = useRef(null);
  const isEditing = Boolean(subscription);
  const previewIcon = getSubscriptionIcon(formData);

  useEffect(() => () => iconReader.current?.abort(), []);

  function field(name) {
    return {
      name,
      value: formData[name],
      disabled: saving,
      onChange: handleInputChange,
      error: Boolean(errors[name]),
      helperText: errors[name],
      size: 'small',
      fullWidth: true,
    };
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: '' }));
  }

  function handleIconUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    // Clearing the picker lets the same file be chosen again.
    event.target.value = '';
    iconReader.current?.abort();

    let message = '';
    if (!file.size || !CUSTOM_ICON_TYPES.includes(file.type)) {
      message = 'Choose a non-empty PNG or JPEG image.';
    } else if (file.size > MAX_SUBSCRIPTION_ICON_BYTES) {
      message = 'Choose an image that is 1 MiB or smaller.';
    }
    setErrors((previous) => ({ ...previous, icon: message }));
    setIsReadingIcon(!message);
    if (message) return;

    const reader = new FileReader();
    iconReader.current = reader;
    reader.onload = () => {
      setIsReadingIcon(false);
      setFormData((previous) => ({
        ...previous, icon: reader.result, iconName: file.name, iconPreset: 'custom',
      }));
    };
    reader.onerror = () => {
      setIsReadingIcon(false);
      setErrors((previous) => ({ ...previous, icon: 'This image could not be read. Choose another file.' }));
    };
    reader.readAsDataURL(file);
  }

  function handlePresetIcon(iconPreset) {
    iconReader.current?.abort();
    setIsReadingIcon(false);
    setFormData((previous) => ({ ...previous, iconPreset, icon: null, iconName: '' }));
    setErrors((previous) => ({ ...previous, icon: '' }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isReadingIcon || saving) return;

    const { name, category, cost, billingCycle, nextRenewal, icon, iconPreset } = formData;
    const fields = { name: name.trim(), category, cost: Number(cost), billingCycle, nextRenewal, icon: icon || null, iconPreset };
    const validation = validateSubscriptionFields(fields);
    if (errors.icon) validation.icon = errors.icon;
    setErrors(validation);
    if (Object.keys(validation).length === 0) onSave(fields);
  }

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      aria-labelledby="subscription-form-title"
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id="subscription-form-title" sx={{ fontWeight: 700, pb: 1 }}>
        {isEditing ? 'Edit Subscription' : 'Add New Subscription'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate aria-busy={saving}>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <TextField
            label="Subscription Name"
            {...field('name')}
            placeholder="e.g., Canva Pro"
            required
          />

          <TextField
            label="Category"
            {...field('category')}
            select
          >
            {SUBSCRIPTION_CATEGORIES.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
          </TextField>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="Cost (₱)"
              {...field('cost')}
              type="number"
              placeholder="0.00"
              required
              slotProps={{ htmlInput: { min: '0.01', step: '0.01' } }}
            />

            <TextField
              label="Billing Cycle"
              {...field('billingCycle')}
              select
              required
            >
              {BILLING_CYCLES.map((cycle) => <MenuItem key={cycle} value={cycle}>{cycle}</MenuItem>)}
            </TextField>
          </Box>

          <TextField
            label="Next Renewal Date"
            {...field('nextRenewal')}
            type="date"
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Box>
            <Typography id="subscription-icon-label" variant="body2" fontWeight={600} sx={{ mb: 1 }}>Subscription icon</Typography>
            <Box role="group" aria-labelledby="subscription-icon-label" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
              {[{ id: 'auto', label: 'Automatic' }, ...PRESET_ICONS, { id: 'none', label: 'No icon' }].map((preset) => (
                <Button key={preset.id} type="button" aria-pressed={formData.iconPreset === preset.id}
                  onClick={() => handlePresetIcon(preset.id)} variant="outlined" size="small"
                  disabled={saving}
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
                src={previewIcon}
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
                disabled={saving}
                startIcon={<CloudUploadOutlined />}
                sx={{ flexGrow: 1 }}
              >
                {formData.icon ? 'Change Icon' : 'Upload PNG/JPEG'}
                <input
                  type="file"
                  disabled={saving}
                  accept={CUSTOM_ICON_TYPES.join(',')}
                  hidden
                  onChange={handleIconUpload}
                />
              </Button>

              {(previewIcon || errors.icon || isReadingIcon) && (
                <Button
                  color="error"
                  size="small"
                  disabled={saving}
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
          <Button onClick={onClose} disabled={saving} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disableElevation disabled={isReadingIcon || saving}>
            {saving ? 'Saving…' : 'Save Subscription'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
