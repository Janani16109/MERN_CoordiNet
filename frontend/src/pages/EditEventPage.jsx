import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../services';
import { useAuth } from '../context/AuthContext';
import EventForm from '../components/events/EventForm';

const EditEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const eventData = await eventService.getEventById(eventId);
        
        // Check if user is authorized to edit this event
        // `createdBy` may be a string id or a populated user object; normalize to an id string
        const creatorId = eventData.createdBy && (typeof eventData.createdBy === 'string'
          ? eventData.createdBy
          : (eventData.createdBy._id || eventData.createdBy.id || eventData.createdBy.toString()));

        if (user && (String(user._id) === String(creatorId) || user.role === 'admin')) {
          // Format date and time for the form
          const eventDate = new Date(eventData.date);
          const formattedDate = eventDate.toISOString().split('T')[0];
          const formattedTime = eventDate.toTimeString().split(' ')[0].substring(0, 5);
          
          setEvent({
            ...eventData,
            date: formattedDate,
            time: formattedTime
          });
        } else {
          setError('You do not have permission to edit this event.');
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, user]);

  const handleSubmit = async (eventData) => {
    setSubmitting(true);
    setError(null);

    try {
      // Combine date and time fields
      const combinedData = {
        ...eventData,
        date: new Date(`${eventData.date}T${eventData.time}`).toISOString(),
      };
      
      // Remove the separate time field
      delete combinedData.time;

      await eventService.updateEvent(eventId, combinedData);
      navigate(`/events/${eventId}`);
    } catch (err) {
      console.error('Failed to update event:', err);
      setError(err.message || 'Failed to update event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[var(--color-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: 'var(--color-accent)' }}></div>
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
            <Link to={`/events/${eventId}`} className="text-[var(--color-accent)] hover:opacity-90 font-medium">
              Back to Event
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
          <p className="mt-2 text-[rgba(255,255,255,0.8)]">The event you're trying to edit doesn't exist or has been removed.</p>
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
    <div className="min-h-screen py-8 bg-[var(--color-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to={`/events/${eventId}`} className="text-[var(--color-accent)] hover:opacity-90 flex items-center">
            <svg className="h-5 w-5 mr-1 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Event
          </Link>
        </div>

        <div className="glass shadow-lg overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-white">Edit Event</h1>
            <p className="mt-1 max-w-2xl text-sm text-[rgba(255,255,255,0.8)]">
              Update the details of your event.
            </p>
          </div>

          <div className="border-t border-subtle px-4 py-5 sm:px-6">
            <EventForm 
              initialData={event} 
              onSubmit={handleSubmit} 
              isSubmitting={submitting} 
              submitButtonText="Update Event"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventPage;