import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { announcementService, eventService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Autocomplete,
  FormControlLabel,
  Switch,
  Divider
} from '@mui/material';

const AnnouncementForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  
  // Initialize with data from location state if available (for edit mode)
  const initialData = location.state?.announcement || {
    title: '',
    content: '',
    eventId: null,
    priority: 'medium',
    isPublished: true
  };

  const [formData, setFormData] = useState(initialData);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If in edit mode and no state was passed, fetch the announcement
    if (isEditMode && !location.state?.announcement) {
      fetchAnnouncement();
    }
    
    // Fetch events for the dropdown
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const response = await announcementService.getAnnouncementById(id);
      setFormData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch announcement');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await eventService.getAllEvents();
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    // Handle checkbox fields
    if (name === 'isPublished') {
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEventChange = (event, newValue) => {
    setFormData(prev => ({ ...prev, eventId: newValue?._id || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (isEditMode) {
        await announcementService.updateAnnouncement(id, formData);
      } else {
        await announcementService.createAnnouncement(formData);
      }
      
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/announcements');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 3, backgroundColor: 'transparent', color: 'rgba(255,255,255,0.95)' }} className="glass-soft">
      <Typography variant="h5" component="h1" gutterBottom sx={{ color: 'white' }}>
        {isEditMode ? 'Edit Announcement' : 'Create New Announcement'}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert className="glass-soft" severity="error" sx={{ mb: 3, color: 'rgba(255,255,255,0.9)' }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert className="glass-soft" severity="success" sx={{ mb: 3, color: 'rgba(255,255,255,0.9)' }}>
          Announcement {isEditMode ? 'updated' : 'created'} successfully!
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              inputProps={{ maxLength: 100 }}
              helperText={`${formData.title.length}/100 characters`}
              FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' }
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              multiline
              rows={6}
              FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={events}
              getOptionLabel={(option) => option.title || ''}
              value={events.find(event => event._id === formData.eventId) || null}
              onChange={handleEventChange}
              // Render each option with white text for visibility on dark dropdown
              renderOption={(props, option) => (
                <li {...props} style={{ color: 'white' }}>
                  {option.title}
                </li>
              )}
              // Style the dropdown Paper, listbox and popper to match dark theme and stand out
              componentsProps={{
                paper: {
                  sx: {
                    backgroundColor: '#0a0c1e', // solid dark base for clarity
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'white',
                    borderRadius: 2,
                    boxShadow: '0 6px 18px rgba(2,6,23,0.6)',
                    p: 1 // small padding inside the paper
                  }
                },
                listbox: {
                  sx: {
                    color: 'white',
                    '& .MuiAutocomplete-option': { paddingY: 1 },
                    // ensure selected hover states still readable
                    '& .Mui-focused, & .Mui-selected': { backgroundColor: 'rgba(255,255,255,0.04)' }
                  }
                }
              }}
              PopperProps={{
                sx: {
                  // increase z-index and keep rounded corners when positioned
                  '& .MuiPaper-root': { borderRadius: 8 }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Related Event (Optional)"
                  helperText="Leave empty for general announcements"
                  FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.6)' } }}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' }
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.6)' }}>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                label="Priority"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  color: 'white',
                  '& .MuiSelect-select': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.06)' }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: 'rgba(10,12,30,0.9)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      color: 'white'
                    }
                  }
                }}
              >
                <MenuItem value="low" sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' }, '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>Low</MenuItem>
                <MenuItem value="medium" sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' }, '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>Medium</MenuItem>
                <MenuItem value="high" sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' }, '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.06)' } }}>High</MenuItem>
              </Select>
                <FormHelperText sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Set the importance level of this announcement
                </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublished}
                  onChange={handleChange}
                  name="isPublished"
                  color="primary"
                />
              }
              label="Publish immediately"
              sx={{ color: 'rgba(255,255,255,0.92)' }}
            />
            <FormHelperText>
              {formData.isPublished 
                ? 'Announcement will be visible to all users' 
                : 'Announcement will be saved as draft'}
            </FormHelperText>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/announcements')}
              disabled={submitting}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={submitting}
              sx={{ background: 'linear-gradient(90deg, var(--color-accent), var(--color-highlight))', color: 'var(--color-primary)' }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : isEditMode ? (
                'Update Announcement'
              ) : (
                'Create Announcement'
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default AnnouncementForm;