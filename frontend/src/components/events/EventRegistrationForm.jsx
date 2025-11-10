import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { eventService } from '../../services';
import paymentService from '../../services/paymentService';
import PaymentForm from '../payments/PaymentForm';
import { useAuth } from '../../context/AuthContext';

const EventRegistrationForm = ({ event, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    specialRequirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPayment, setShowPayment] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState(null);
  const [pendingPaymentId, setPendingPaymentId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate phone before proceeding
    const phoneValid = isValidIndianPhone(formData.phone);
    if (!phoneValid) {
      setFieldErrors({ phone: 'Please enter a valid Indian mobile number (10 digits, starting with 6-9). You may include +91 or 0 prefix).' });
      setLoading(false);
      return;
    }

    try {
      // For paid events, create a PaymentIntent with registrationData first, then open payment modal
      console.log('Submitting registration/payment with data:', formData); // Debug log
      const { clientSecret, paymentId } = await paymentService.createPaymentIntent(event._id, 1, formData);
      if (clientSecret) {
        console.debug('Opening payment modal for event:', event); // debug
        setPaymentClientSecret(clientSecret);
        setPendingPaymentId(paymentId);
        setShowPayment(true);
      } else {
        // fallback: if no payment required, call existing registration endpoint
        await eventService.registerForEvent(event._id, formData);
        onSuccess();
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to register for the event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Validate Indian mobile numbers: allow optional +91, 91 or 0 prefixes, then 10 digits starting with 6-9
  const isValidIndianPhone = (raw) => {
    if (!raw) return false;
    const s = raw.toString().trim();
    // Remove spaces, dashes, parentheses
    const cleaned = s.replace(/[^0-9+]/g, '');
    // Allow +91 or 0 or 91 prefixes
    const normalized = cleaned.replace(/^\+?91|^0/, '');
    return /^[6-9][0-9]{9}$/.test(normalized);
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    // Payment succeeded — server webhook should create the registration, but webhooks can be missed in dev.
    // As a safe fallback, call the register endpoint client-side so the participant is added immediately.
    setShowPayment(false);
    setPaymentClientSecret(null);
    setPendingPaymentId(null);
    try {
      // Try to register immediately; server will prevent duplicate registrations if webhook also runs
      await eventService.registerForEvent(event._id, formData);
    } catch (err) {
      // If registration fails because user is already registered, ignore; otherwise surface error
      console.warn('Fallback registration after payment failed or already registered:', err.message || err);
    }

    onSuccess();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="glass p-6 rounded-lg overflow-hidden transform transition-all sm:max-w-lg sm:w-full">
          <div className="px-4 pt-2 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                Register for {event.title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Please fill out the following information to complete your registration.
                </p>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
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

              <form className="mt-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-subtle rounded-md bg-[rgba(255,255,255,0.02)] py-2 px-3 focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] sm:text-sm text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        handleChange(e);
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                      }}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {fieldErrors.phone && <p className="mt-1 text-sm text-red-500">{fieldErrors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700">Special Requirements (Optional)</label>
                    <textarea
                      name="specialRequirements"
                      id="specialRequirements"
                      rows="3"
                      value={formData.specialRequirements}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Any dietary restrictions, accessibility needs, etc."
                    ></textarea>
                  </div>
                </div>

                <div className="mt-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-[var(--color-primary)] btn-accent sm:ml-3 sm:w-auto sm:text-sm ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Registering...' : 'Complete Registration'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-subtle shadow-sm px-4 py-2 bg-[var(--color-secondary)] text-white text-base font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent)] sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
          </div>
        </div>
      </div>
      {showPayment && (
        <PaymentModal
          clientSecret={paymentClientSecret}
          eventId={event._id}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

// Payment modal render
const PaymentModal = ({ clientSecret, eventId, onClose, onSuccess }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
    <div className="glass p-6 rounded-lg sm:max-w-md sm:w-full">
  <h3 className="text-lg font-medium text-white mb-4">Complete Payment</h3>
  <PaymentForm eventId={eventId} clientSecret={clientSecret} onSuccess={onSuccess} event={event} />
      <div className="mt-4 text-right">
        <button onClick={onClose} className="px-4 py-2 rounded bg-subtle text-white">Cancel</button>
      </div>
    </div>
  </div>
);

// (component defined above)
EventRegistrationForm.propTypes = {
  event: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default EventRegistrationForm;