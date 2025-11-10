import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { eventService } from '../services';

const OrganizerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'organizer') navigate('/home');
  }, [user, navigate]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const allEvents = await eventService.getAllEvents();
        const organizerEvents = (allEvents && allEvents.data) ? allEvents.data.filter(e => e.createdBy === user.id) : [];
        organizerEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(organizerEvents);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  return (
    <div className="pb-12 bg-[var(--color-primary)]">
      <div className="glass rounded-xl shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-subtle">
          <h1 className="text-3xl font-bold text-white">Organizer Dashboard</h1>
        </div>
        <div className="p-6">
          <p className="text-lg text-[rgba(255,255,255,0.85)] mb-6">Welcome, {user?.firstName || 'Organizer'}!</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-soft rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Create Event</h2>
                <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <p className="text-[rgba(255,255,255,0.8)] mb-4">Create a new event, set up registration, and publish it to participants.</p>
              <Link to="/events/create" className="inline-block btn-accent text-[var(--color-primary)] py-2 px-4 rounded-md transition duration-300">Create New Event</Link>
            </div>

            <div className="glass-soft rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">My Events</h2>
                <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p className="text-[rgba(255,255,255,0.8)] mb-4">View and manage your created events, track registrations, and update details.</p>
              <Link to="/events" className="inline-block btn-accent text-[var(--color-primary)] py-2 px-4 rounded-md transition duration-300">Manage Events</Link>
            </div>

            <div className="glass-soft rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Announcements</h2>
                <svg className="w-8 h-8 text-[var(--color-highlight)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                </svg>
              </div>
              <p className="text-[rgba(255,255,255,0.8)] mb-4">Create and send announcements to event participants and keep them updated.</p>
              <Link to="/announcements/create" className="inline-block btn-accent text-[var(--color-primary)] py-2 px-4 rounded-md transition duration-300">Create Announcement</Link>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-white mb-6">Your Upcoming Events</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8" style={{ borderTop: '2px solid var(--color-accent)', borderBottom: '2px solid var(--color-accent)' }} />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
            ) : events.length === 0 ? (
              <div className="glass-soft p-6 text-center">
                <p className="text-[rgba(255,255,255,0.8)]">You haven't created any events yet.</p>
                <Link to="/events/create" className="mt-4 inline-block text-[var(--color-accent)] hover:opacity-90">Create your first event</Link>
              </div>
            ) : (
              <div className="glass-soft overflow-hidden">
                <ul className="divide-y divide-[rgba(255,255,255,0.04)]">
                  {events.map(event => {
                    const eventDate = new Date(event.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    let status = '';
                    let statusClass = '';
                    if (eventDate < today) {
                      status = 'Completed';
                      statusClass = 'bg-[rgba(255,255,255,0.06)] text-white/80';
                    } else if (eventDate >= today && eventDate < tomorrow) {
                      status = 'Active';
                      statusClass = 'bg-[rgba(0,230,255,0.08)] text-[var(--color-accent)]';
                    } else {
                      status = 'Upcoming';
                      statusClass = 'bg-[rgba(255,60,126,0.07)] text-[var(--color-highlight)]';
                    }

                    const formattedDate = new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

                    return (
                      <li key={event._id}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-white">{event.title}</p>
                            <div className="ml-2 flex flex-shrink-0">
                              <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusClass}`}>{status}</p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-[rgba(255,255,255,0.75)]">
                                <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-[rgba(255,255,255,0.2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.location}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-[rgba(255,255,255,0.75)] sm:mt-0">
                              <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-[rgba(255,255,255,0.2)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p>{formattedDate}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Link to={`/events/${event._id}`} className="text-sm font-medium text-[var(--color-accent)] hover:opacity-90">View details</Link>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-black mb-6">Event Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-soft p-4 rounded-lg shadow text-center">
                <h3 className="text-[rgba(255,255,255,0.75)] text-sm font-medium">Total Events</h3>
                <p className="text-3xl font-bold text-[var(--color-accent)]">{events.length}</p>
                <p className="text-[rgba(255,255,255,0.7)] text-sm">{events.length > 0 ? `${events.length} events created` : 'No events yet'}</p>
              </div>
              <div className="glass-soft p-4 rounded-lg shadow text-center">
                <h3 className="text-[rgba(255,255,255,0.75)] text-sm font-medium">Registrations</h3>
                <p className="text-3xl font-bold text-[var(--color-highlight)]">{events.reduce((total, e) => total + (e.participants ? e.participants.length : 0), 0)}</p>
                <p className="text-[rgba(255,255,255,0.7)] text-sm">Total registrations</p>
              </div>
              <div className="glass-soft p-4 rounded-lg shadow text-center">
                <h3 className="text-[rgba(255,255,255,0.75)] text-sm font-medium">Active Events</h3>
                <p className="text-3xl font-bold text-[var(--color-accent)]">{events.filter(e => {
                  const eventDate = new Date(e.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return eventDate >= today && eventDate < tomorrow;
                }).length}</p>
                <p className="text-[rgba(255,255,255,0.7)] text-sm">Events happening today</p>
              </div>
              <div className="glass-soft p-4 rounded-lg shadow text-center">
                <h3 className="text-[rgba(255,255,255,0.75)] text-sm font-medium">Upcoming Events</h3>
                <p className="text-3xl font-bold text-[var(--color-accent)]">{events.filter(e => new Date(e.date) >= new Date(new Date().setDate(new Date().getDate() + 1))).length}</p>
                <p className="text-[rgba(255,255,255,0.7)] text-sm">Future events</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboardPage;