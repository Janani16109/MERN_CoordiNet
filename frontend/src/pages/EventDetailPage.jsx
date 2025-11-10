import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../services';
import { useAuth } from '../context/AuthContext';
import EventRegistrationForm from '../components/events/EventRegistrationForm';
import EventAnnouncements from '../components/events/EventAnnouncements';

const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // Check if user is an organizer or admin
  const isOrganizerOrAdmin = user && (user.role === 'organizer' || user.role === 'admin');
  // Check if user is the event creator
  const isEventCreator = event && user && event.createdBy === user.id;
  // Check if user is a participant (not admin or organizer)
  // eslint-disable-next-line no-unused-vars
  const isParticipant = user && user.role === 'participant';

  // Function to fetch event details
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate eventId before making API call
      if (!eventId) {
        setError('Invalid event ID');
        setLoading(false);
        return;
      }

      // console.log('Fetching event with ID:', eventId); // Debug log
      
      const eventData = await eventService.getEventById(eventId);
      // console.log('Event data received:', eventData); // Debug log to see what's returned
      setEvent(eventData);
      
      // Fetch participants in a separate call to avoid race conditions
      await fetchParticipants();
      
    } catch (err) {
      console.error('Failed to fetch event details:', err);
      setError('Failed to load event details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch participants
  const fetchParticipants = async () => {
    if (!user || !eventId) return;
    
    try {
      const participantsData = await eventService.getEventParticipants(eventId);
      // console.log('Participants data received:', participantsData); // Debug log
      
      // Ensure we have an array of participants
      const list = Array.isArray(participantsData) ? participantsData : 
                  (participantsData && participantsData.data ? participantsData.data : []);
      
      setParticipants(list);
      setIsRegistered(list.some(p => p.userId === user.id));
    } catch (participantError) {
      console.warn('Failed to fetch participants:', participantError);
      setParticipants([]);
    }
  };

  useEffect(() => {
    // Only fetch if eventId exists
    if (eventId) {
      fetchEventDetails();
    } else {
      setError('No event ID provided');
      setLoading(false);
    }
    
    // Set up polling to refresh participant data every 10 seconds
    const participantPolling = setInterval(() => {
      if (eventId && user) {
        fetchParticipants();
      }
    }, 10000); // 10 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(participantPolling);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, user]);

  const handleRegister = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: `/events/${eventId}` } });
      return;
    }
    
    // Only allow participants to register
    if (user.role === 'admin' || user.role === 'organizer') {
      // console.log('Admins and organizers cannot register for events');
      return;
    }
    
    setShowRegistrationForm(true);
  };

  const handleCancelRegistration = async () => {
    try {
      await eventService.cancelRegistration(eventId);
      setIsRegistered(false);
      // Fetch updated participants list after cancellation
      fetchParticipants();
    } catch (err) {
      console.error('Failed to cancel registration:', err);
      // Show error message
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await eventService.deleteEvent(eventId);
        navigate('/events');
      } catch (err) {
        console.error('Failed to delete event:', err);
        // Show error message
      }
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString))) return 'Invalid Date';
    const options = {
      weekday: 'long', year: 'numeric',
      month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format price for display (accepts rupees or paise heuristically)
  const formatPrice = (priceValue) => {
    if (priceValue === undefined || priceValue === null) return 'Free';
    let rupees = Number(priceValue);
    // If looks like paise (integer and multiple of 100 and reasonably large), convert
    if (Number.isInteger(rupees) && Math.abs(rupees) > 0 && rupees % 100 === 0) {
      rupees = rupees / 100;
    }
    if (!isFinite(rupees) || rupees === 0) return 'Free';
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rupees);
    } catch (err) {
      return `Rs. ${rupees}`;
    }
  };
  

  // Show error if no eventId
  if (!eventId) {
    return (
      <div className="min-h-screen bg-[var(--color-primary)] flex flex-col items-center justify-center px-4">
        <div className="glass p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <svg className="h-12 w-12 text-[var(--color-highlight)] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-center text-white">Invalid Event ID</h2>
          <p className="mt-2 text-center text-[rgba(255,255,255,0.8)]">The event ID is missing or invalid.</p>
          <div className="mt-6 text-center">
              <Link to="/events" className="text-[var(--color-accent)] hover:opacity-90 font-medium">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[var(--color-primary)]">
        <div className="animate-spin rounded-full h-12 w-12" style={{ borderTop: '2px solid var(--color-accent)', borderBottom: '2px solid var(--color-accent)' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-primary)] flex flex-col items-center justify-center px-4">
        <div className="glass p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <svg className="h-12 w-12 text-[var(--color-highlight)] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-center text-white">{error}</h2>
          <div className="mt-6 text-center">
              <Link to="/events" className="text-[var(--color-accent)] hover:opacity-90 font-medium">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--color-primary)] flex flex-col items-center justify-center px-4">
        <div className="glass p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-white">Event not found</h2>
          <p className="mt-2 text-[rgba(255,255,255,0.8)]">The event you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6">
              <Link to="/events" className="text-[var(--color-accent)] hover:opacity-90 font-medium">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-primary)] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/events"
            className="text-[var(--color-accent)] hover:text-[var(--color-highlight)] flex items-center"
          >
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Events
          </Link>
        </div>

        {/* Event details card */}
        <div className="glass shadow-lg overflow-hidden sm:rounded-lg">
          {/* Event Image */}
          {event?.image && (
            <div className="w-full overflow-hidden" style={{ maxHeight: 520 }}>
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full"
                style={{
                  width: '100%',
                  maxHeight: 520,
                  objectFit: 'contain',
                  objectPosition: 'center',
                  backgroundColor: 'transparent'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
            <div>
              <h3 className="text-2xl leading-6 font-bold text-white">
                {event?.title || 'Event Title'}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-[rgba(255,255,255,0.8)]">
                Organized by{" "}
                {event?.organizerName &&
                event.organizerName.trim() !== "undefined undefined"
                  ? event.organizerName
                  : "Event Organizer"}
              </p>
            </div>
            {/* Admin/Organizer actions */}
            <div className="flex space-x-3">
              {isEventCreator && (
                <>
                  <Link
                    to={`/events/${eventId}/edit`}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border border-subtle bg-[var(--color-secondary)] text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)]"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </>
              )}
              <Link
                to={`/leaderboard/${eventId}`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-[var(--color-primary)] btn-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)]"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
          <div className="border-t border-subtle">
            <dl>
              <div className="bg-[rgba(255,255,255,0.01)] px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
                  Date and Time
                </dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {event?.date ? formatDate(event.date) : 'Date not specified'}
                </dd>
              </div>
              <div className="bg-[rgba(255,255,255,0.02)] px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-[rgba(255,255,255,0.7)]">Location</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {event?.location || 'Location not specified'}
                </dd>
              </div>
              <div className="bg-[rgba(255,255,255,0.01)] px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-[rgba(255,255,255,0.7)]">
                  Description
                </dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {event?.description || 'No description provided'}
                </dd>
              </div>
              <div className="bg-[rgba(255,255,255,0.02)] px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-[rgba(255,255,255,0.7)]">Capacity</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                {participants && event ? `${participants.length} / ${event.capacity || 0} registered` : 'Loading capacity information...'}
                </dd>
              </div>
              <div className="bg-[rgba(255,255,255,0.01)] px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-[rgba(255,255,255,0.7)]">Price</dt>
                <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                  {formatPrice(event?.price)}
                </dd>
              </div>
              {/* Removing duplicate Description section */}
              {event?.tags && event.tags.length > 0 && (
                <div className="bg-[rgba(255,255,255,0.01)] px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-[rgba(255,255,255,0.7)]">Tags</dt>
                  <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.03)] text-white/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Registration section - only visible to participants */}
        {!isOrganizerOrAdmin && (
            <div className="mt-8 glass-soft shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-white">
                Event Registration
              </h3>
              <div className="mt-2 max-w-xl text-sm text-white/70">
                <p>
                  {isRegistered
                    ? "You are registered for this event."
                    : participants && event && participants.length >= (event.capacity || 0)
                    ? "This event has reached its capacity."
                    : "Register to secure your spot for this event."}
                </p>
              </div>
              <div className="mt-5">
                {isRegistered ? (
                  <button
                    onClick={handleCancelRegistration}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-[var(--color-primary)] btn-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)]"
                  >
                    Cancel Registration
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={participants && event && participants.length >= (event.capacity || 0)}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${participants && event && participants.length >= (event.capacity || 0) ? 'opacity-50 cursor-not-allowed text-white bg-[rgba(255,255,255,0.03)]' : 'btn-accent text-[var(--color-primary)]'}`}
                  >
                    Register Now
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Registration form modal */}
        {showRegistrationForm && (
          <EventRegistrationForm
            event={event}
            onClose={() => setShowRegistrationForm(false)}
            onSuccess={() => {
              setIsRegistered(true);
              setShowRegistrationForm(false);
              // Fetch updated participants list after successful registration
              fetchParticipants();
            }}
          />
        )}

        {/* Participants section (visible to organizers/admins) */}
        {isOrganizerOrAdmin && (
          <div className="mt-8 glass-soft shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-white">
                Registered Participants ({participants ? participants.length : 0})
              </h3>
              <div className="mt-4">
                {participants && participants.length > 0 ? (
                  <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {participants.map((participant) => (
                      <li key={participant.userId || `participant-${Math.random()}`} className="py-4 flex">
                        <div className="ml-3">
                          <p className="text-sm font-medium text-white/90">
                            {participant.name || 'Unnamed Participant'}
                          </p>
                          <p className="text-sm text-white/60">
                            {participant.email || 'No email provided'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-white/60">
                    No participants registered yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Event Announcements Section */}
        <div className="mt-8">
          <EventAnnouncements eventId={eventId} eventTitle={event?.title} />
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;