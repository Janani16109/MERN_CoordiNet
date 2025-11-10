import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const EventCard = ({ event }) => {
  // Default placeholder image for events without images
  const defaultEventImage = '/beach.jpg';
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge based on event date
  const getStatusBadge = () => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (eventDate < today) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(255,255,255,0.06)] text-white/80">
          Completed
        </span>
      );
    } else if (eventDate >= today && eventDate < tomorrow) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(0,230,255,0.08)] text-[var(--color-accent)]">
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(255,60,126,0.07)] text-[var(--color-highlight)]">
          Upcoming
        </span>
      );
    }
  };

  // Format price: handle cases where backend may store price in paise (integer) or in rupees (decimal)
  const formatPrice = (priceValue) => {
    if (priceValue === undefined || priceValue === null) return 'Free';

    let rupees = Number(priceValue);
    if (Number.isInteger(rupees) && rupees % 100 === 0) {
      // likely stored in paise
      rupees = rupees / 100;
    }

    if (rupees === 0) return 'Free';

    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rupees);
    } catch (err) {
      return `Rs. ${rupees}`;
    }
  };

  return (
  <div className="glass overflow-hidden rounded-lg hover:shadow-2xl transition-shadow duration-200">
      {/* Event Image */}
      <div className="h-48 overflow-hidden relative">
        <img 
          src={event.image || defaultEventImage} 
          alt={event.title} 
          className="w-full h-full object-cover rounded-t-lg" 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = defaultEventImage;
          }}
        />
        <div className="absolute inset-0 image-overlay rounded-t-lg" />
      </div>
      
  <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-semibold text-white">
            {event.title}
          </h3>
          {getStatusBadge()}
        </div>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          {event.description.length > 100 
            ? `${event.description.substring(0, 100)}...` 
            : event.description}
        </p>
        <div className="mt-3 flex items-center text-sm text-white/60">
          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>{formatDate(event.date)}</span>
        </div>
  <div className="mt-2 flex items-center text-sm text-white/60">
          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>{event.location}</span>
        </div>
        <div className="mt-2 flex items-center text-sm text-white/60">
          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <span>{event.participants ? `${event.participants.length} / ${event.capacity} registered` : `0 / ${event.capacity} registered`}</span>
        </div>
        <div className="mt-2 flex items-center text-sm text-white/60">
          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M12 1v22" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 5H9a4 4 0 100 8h6a4 4 0 110 8H7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{formatPrice(event.price)}</span>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-subtle bg-[rgba(255,255,255,0.02)]">
        <div className="text-sm flex justify-between">
          <Link to={`/events/${event._id}`} className="font-medium text-[var(--color-accent)] hover:opacity-90">
            View details
          </Link>
          <Link to={`/leaderboard/${event._id}`} className="font-medium text-[var(--color-accent)] hover:opacity-90">
            View leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
};

EventCard.propTypes = {
  event: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired,
    price: PropTypes.number
  }).isRequired,
};

export default EventCard;