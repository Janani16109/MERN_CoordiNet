import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { eventService } from '../services';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { Link } from 'react-router-dom';
import { 
  LeaderboardTable, 
  ParticipantScore,
  TopPerformers,
  CollegeLeaderboard,
  UpdateScoreForm 
} from '../components/leaderboard';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leaderboard-tabpanel-${index}`}
      aria-labelledby={`leaderboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LeaderboardPage = () => {
  const { eventId } = useParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch event details if eventId is provided
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const eventData = await eventService.getEventById(eventId);
        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Check if user is registered for this event
  const isUserRegistered = () => {
    if (!isAuthenticated || !user || !event) return false;
    return event.participants?.some(participant => participant === user._id);
  };

  return (
    <div className="min-h-screen py-8" style={{ color: 'rgba(255,255,255,0.95)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs navigation */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        {eventId ? [
          <MuiLink key="home" component={Link} to="/home" sx={{ color: 'rgba(255,255,255,0.72)' }}>Home</MuiLink>,
          <MuiLink key="events" component={Link} to="/events" sx={{ color: 'rgba(255,255,255,0.72)' }}>Events</MuiLink>,
          <MuiLink key="event" component={Link} to={`/events/${eventId}`} sx={{ color: 'rgba(255,255,255,0.72)' }}>
            {loading ? 'Loading...' : event?.title || 'Event'}
          </MuiLink>,
          <Typography key="label" sx={{ color: 'rgba(255,255,255,0.9)' }}>Leaderboard</Typography>
        ] : [
          <MuiLink key="home" component={Link} to="/home" sx={{ color: 'rgba(255,255,255,0.72)' }}>Home</MuiLink>,
          <Typography key="label" sx={{ color: 'rgba(255,255,255,0.9)' }}>Leaderboards</Typography>
        ]}
      </Breadcrumbs>

      {/* Page header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">{eventId ? (loading ? 'Loading Event Leaderboard...' : `${event?.title || 'Event'} Leaderboard`) : 'Leaderboards'}</h1>
        </div>
        {eventId && event && (
          <p style={{ color: 'rgba(255,255,255,0.72)' }}>Track scores and rankings for this event</p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <Alert className="glass-soft" severity="error" sx={{ mb: 4, color: 'rgba(255,255,255,0.95)' }}>
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Event-specific leaderboard */}
      {eventId ? (
        !loading && event && (
          <>
            {/* Show participant score if user is registered */}
            {isAuthenticated && isUserRegistered() && (
              <Box mb={4}>
                <ParticipantScore eventId={eventId} />
              </Box>
            )}
            
            {/* Score update form for organizers/admins */}
            {isAuthenticated && user && (user.role === 'admin' || user.role === 'organizer') && (
              <Box mb={4}>
                <UpdateScoreForm 
                  eventId={eventId} 
                  onScoreUpdated={() => {
                    // Refresh the leaderboard when score is updated
                    // This is a placeholder - you would implement a refresh mechanism
                    window.location.reload();
                  }} 
                />
              </Box>
            )}
            
            {/* Event leaderboard */}
            <div className="glass p-4 rounded-md">
              <LeaderboardTable eventId={eventId} />
            </div>
          </>
        )
      ) : (
  /* Global leaderboards */
  <div className="glass p-4 rounded-md">
          <div className="border-b border-white/6">
            <div className="flex">
              <button className={`px-4 py-2 ${tabValue===0? 'sidebar-item-active' : 'sidebar-item'}`} onClick={(e)=>handleTabChange(e,0)}>Top Performers</button>
              <button className={`px-4 py-2 ${tabValue===1? 'sidebar-item-active' : 'sidebar-item'}`} onClick={(e)=>handleTabChange(e,1)}>College Rankings</button>
            </div>
          </div>

          <div className="py-3">
            {tabValue===0 ? <TopPerformers /> : <CollegeLeaderboard />}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default LeaderboardPage;