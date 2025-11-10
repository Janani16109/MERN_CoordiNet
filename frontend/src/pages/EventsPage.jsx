import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services';
import EventCard from '../components/events/EventCard';
import { useAuth } from '../context/AuthContext';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await eventService.getAllEvents();
        // console.log('Fetched data from getAllEvents:', data);
        
        // Get events data, ensuring we have an array
        let eventsData = Array.isArray(data) ? data : data.data || [];
        
        // Filter out sample events (events with titles containing 'sample' or 'test')
        // This is a temporary solution to remove sample events from the home page
        eventsData = eventsData.filter(event => {
          const title = event.title.toLowerCase();
          return !title.includes('sample') && !title.includes('test');
        });
        
        setEvents(eventsData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchEvents();
  }, []);

  // Filter events based on selected filter
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    
    if (filter === 'upcoming') {
      return eventDate >= today;
    } else if (filter === 'past') {
      return eventDate < today;
    }
    return true; // 'all' filter
  });

  // Check if user is an organizer or admin
  const canCreateEvent = user && (user.role === 'organizer' || user.role === 'admin');

  return (
    <div className="min-h-screen py-8 bg-[var(--color-primary)] text-[var(--text-on-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Events</h1>
          {canCreateEvent && (
            <Link 
              to="/events/create" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm btn-accent"
            >
              Create Event
            </Link>
          )}
        </div>

        {/* Filter controls */}
        <div className="mt-4 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-[rgba(255,255,255,0.04)] text-white' : 'bg-[var(--color-secondary)] text-white/70 hover:opacity-90'}`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'upcoming' ? 'bg-[rgba(0,230,255,0.08)] text-[var(--color-accent)]' : 'bg-[var(--color-secondary)] text-white/70 hover:opacity-90'}`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${filter === 'past' ? 'bg-[rgba(255,60,126,0.07)] text-[var(--color-highlight)]' : 'bg-[var(--color-secondary)] text-white/70 hover:opacity-90'}`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12" style={{ borderTop: '2px solid var(--color-accent)', borderBottom: '2px solid var(--color-accent)' }}></div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 my-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Events grid */}
        {!loading && !error && (
          <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <EventCard key={event._id} event={event} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-white/70 text-lg">
                  {filter === 'all' 
                    ? 'No events found.' 
                    : filter === 'upcoming' 
                      ? 'No upcoming events found.' 
                      : 'No past events found.'}
                </p>
                {canCreateEvent && (
                  <Link 
                    to="/events/create" 
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[var(--color-primary)] btn-accent"
                  >
                    Create your first event
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;