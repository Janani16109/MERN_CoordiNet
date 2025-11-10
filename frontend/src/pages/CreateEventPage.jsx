import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { eventService } from '../services';
import { useAuth } from '../context/AuthContext';
import EventForm from '../components/events/EventForm';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is authorized to create events
  const canCreateEvent = user && (user.role === 'organizer' || user.role === 'admin');

  // Initial form data
  const initialEventData = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: 50,
    tags: [],
    price: 0,
    image: ''
  };

  const handleSubmit = async (eventData) => {
    console.log('=== CREATE EVENT PAGE - RECEIVED DATA ===');
    console.log('Received eventData:', eventData);
    
    if (!canCreateEvent) {
      setError('You do not have permission to create events.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Combine date and time fields - improved error handling
      let combinedDate;
      try {
        combinedDate = new Date(`${eventData.date}T${eventData.time}`);
        // Check if date is valid
        if (isNaN(combinedDate.getTime())) {
          throw new Error('Invalid date or time format');
        }
      } catch (dateError) {
        throw new Error('Please enter a valid date and time');
      }
      
      const combinedData = {
        ...eventData,
        // Normalize date to ISO (using the combined local date/time)
        date: combinedDate.toISOString(),
      };
      
      // Remove the separate time field
      delete combinedData.time;
      
      // Handle image URL - ensure we get the Cloudinary URL if available
      if (eventData.imageData && eventData.imageData.url) {
        // Use Cloudinary URL from imageData
        combinedData.image = eventData.imageData.url;
      } else if (eventData.image && eventData.image.trim() !== '' && eventData.image !== 'NO IMAGE PROVIDED') {
        // Use existing image URL if available
        combinedData.image = eventData.image;
      } else {
        // No image provided
        combinedData.image = '';
      }
      
      // Remove imageData before sending to backend
      delete combinedData.imageData;
      
      // Add creator information
      combinedData.createdBy = user._id || user.id;
      combinedData.organizerName = user.name || `${user.firstName} ${user.lastName}`;
      // Keep price in rupees (decimal). Backend will convert to smallest unit when contacting Stripe.
      if (eventData.price !== undefined && eventData.price !== null) {
        const rupees = Number(eventData.price) || 0;
        combinedData.price = rupees;
      } else {
        combinedData.price = 0;
      }
      
      // Also log a human-friendly local date for debugging
      console.log('Submitting event data:', combinedData); // Debug log
      try {
        console.log('Local date/time:', new Date(combinedData.date).toString());
      } catch (e) {
        // ignore
      }
      
      const createdEvent = await eventService.createEvent(combinedData);
      
      // Extract the event ID from the response, handling different response structures
      const eventId = createdEvent.data?._id || createdEvent._id;
      
      if (!eventId) {
        throw new Error('Failed to get event ID from server response');
      }
      navigate(`/events/${eventId}`);
    } catch (err) {
      console.error('Event creation error:', err); // Debug log
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user is not authorized, show access denied message
  if (!canCreateEvent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, var(--color-primary) 0%, #0b0d1a 100%)' }}>
        <div className="glass p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <svg className="h-12 w-12 text-[var(--color-accent)] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-white">Access Denied</h2>
          <p className="mt-2 text-white/80">You don't have permission to create events. Only organizers and administrators can create events.</p>
          <div className="mt-6">
            <Link to="/events" className="text-[var(--color-accent)] hover:text-[var(--color-highlight)] font-medium">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ background: 'linear-gradient(180deg, var(--color-primary) 0%, #0b0d1a 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/events" className="text-[var(--color-accent)] hover:text-[var(--color-highlight)] flex items-center">
            <svg className="h-5 w-5 mr-1 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Events
          </Link>
        </div>

        <div className="glass overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-2xl font-bold text-white">Create New Event</h1>
            <p className="mt-1 max-w-2xl text-sm text-white/70">
              Fill out the form below to create a new event.
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 bg-[rgba(255,60,126,0.06)] border-t border-b" style={{ borderColor: 'rgba(255,60,126,0.08)' }}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-[var(--color-highlight)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-[var(--color-highlight)]">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t px-4 py-5 sm:px-6">
            <EventForm 
              initialData={initialEventData} 
              onSubmit={handleSubmit} 
              isSubmitting={loading} 
              submitButtonText="Create Event"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;