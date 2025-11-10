import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnnouncementList } from '../components/announcements';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Tabs,
  Tab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [publishedFilter, setPublishedFilter] = useState('all');

  const isAdmin = user?.role === 'admin';
  const isOrganizer = user?.role === 'organizer';
  const canCreateAnnouncement = isAdmin || isOrganizer;

  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleCreateAnnouncement = () => navigate('/announcements/create');

  const getFilterParams = () => {
    const params = {};
    if (priorityFilter !== 'all') params.priority = priorityFilter;
    if (publishedFilter !== 'all' && (isAdmin || isOrganizer)) {
      params.isPublished = publishedFilter === 'published';
    }
    return params;
  };

  return (
    <div className="min-h-screen py-8 text-[var(--text-on-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">📢 Announcements</h2>
            {canCreateAnnouncement && (
              <button onClick={handleCreateAnnouncement} className="btn-accent">
                <AddIcon sx={{ mr: 1 }} /> Create
              </button>
            )}
          </div>

          <div className="mb-4">
            <div className="flex gap-2">
              <button className="px-3 py-2 rounded-md bg-[var(--color-secondary)] text-white/80">All Announcements</button>
              <button className="px-3 py-2 rounded-md bg-[var(--color-secondary)] text-white/80">General Announcements</button>
              <button className="px-3 py-2 rounded-md bg-[var(--color-secondary)] text-white/80">Event Announcements</button>
            </div>
          </div>

          <div className="glass-soft p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center px-3 py-1 rounded-md bg-[rgba(0,0,0,0.04)]">Filters</div>
              {/* keep existing MUI controls for now; they will inherit dark mode if styled via sx */}
            </div>
          </div>

          <div>
            {tabValue === 0 && (
              <AnnouncementList showControls filters={getFilterParams()} />
            )}
            {tabValue === 1 && (
              <AnnouncementList showControls filters={{ ...getFilterParams(), eventId: null }} />
            )}
            {tabValue === 2 && (
              <AnnouncementList showControls filters={{ ...getFilterParams(), hasEvent: true }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
