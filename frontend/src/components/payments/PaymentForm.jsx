import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../../context';
import paymentService from '../../services/paymentService';
import eventService from '../../services/eventService';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Format price helper (assume rupees stored, but handle paise fallback)
const formatPrice = (priceValue) => {
  if (priceValue === undefined || priceValue === null) return 'Free';
  let rupees = Number(priceValue);
  if (Number.isInteger(rupees) && rupees % 100 === 0) rupees = rupees / 100;
  if (!isFinite(rupees) || rupees === 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(rupees);
  } catch (err) {
    return `Rs. ${rupees}`;
  }
};

const CheckoutFormInner = ({ eventId, clientSecretProp = null, onSuccess = () => {}, event = null }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState(null);
  const [fetchedEvent, setFetchedEvent] = useState(null);
  const [eventFetchError, setEventFetchError] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);
  const { user } = useAuth();
  const [payerName, setPayerName] = useState('');

  // Resolve which event object to display. Prefer the passed-in prop only if it
  // contains the essential fields (title and price). If the prop is missing price
  // or title, prefer the fetched canonical event.
  const displayEvent = (() => {
    if (event && event.title !== undefined && event.price !== undefined && event.title !== null) return event;
    if (fetchedEvent) return fetchedEvent;
    return event;
  })();

  useEffect(() => {
    // prefill payer name from authenticated user if available
    if (user) {
      const name = (user.firstName || '') + (user.lastName ? ` ${user.lastName}` : '');
      setPayerName(name.trim() || user.email || '');
    }
    let mounted = true;
    const loadEvent = async () => {
      // If parent didn't pass a full event object or price/title is missing,
      // fetch the canonical event from the API so we reliably show title/price.
      if (!event || event.title === undefined || event.price === undefined || event.title === null) {
        if (!eventId) return;
        setEventLoading(true);
        setEventFetchError(null);
        try {
          const ev = await eventService.getEventById(eventId);
          if (mounted) setFetchedEvent(ev);
        } catch (err) {
          if (mounted) setEventFetchError(err.message || 'Failed to load event details');
        } finally {
          if (mounted) setEventLoading(false);
        }
      }
    };
    loadEvent();
    return () => { mounted = false; };
  }, [event, eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const clientSecret = clientSecretProp || (await paymentService.createPaymentIntent(eventId)).clientSecret;
      const cardNumber = elements.getElement(CardNumberElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardNumber, billing_details: { name: payerName || undefined } }
      });

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Build receipt info (amount is in smallest unit)
        const amountPaise = paymentIntent.amount_received || paymentIntent.amount || 0;
        const amountRupees = (amountPaise / 100).toFixed(2);
        const info = {
          amountFormatted: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amountRupees)),
          receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url || null,
          paymentIntentId: paymentIntent.id
        };

        setReceiptInfo(info);
        setSuccess(true);
        // let parent know the payment succeeded
        onSuccess(paymentIntent);

        // Send a client-side confirmation to backend to persist receipt info in payment record
        try {
          await fetch(`/api/payments/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id, receiptUrl: info.receiptUrl, amountPaise })
          });
        } catch (confirmErr) {
          console.warn('Failed to send client-side payment confirmation to server:', confirmErr);
        }
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

    // Debug: log key values to trace why the modal might show 'Free'
    console.debug('PaymentForm:', { eventId, eventProp: event, fetchedEvent, clientSecretProp });

  return (
    // make text white for dark backgrounds; keep error/success backgrounds for contrast
    <div className="text-white">
        {/* Event summary (if available) */}
        {eventLoading ? (
          <div className="mb-4 p-3 rounded bg-[rgba(255,255,255,0.02)] text-white/70">Loading event…</div>
        ) : eventFetchError ? (
          <div className="mb-4 p-3 rounded bg-[rgba(255,60,126,0.06)] text-[var(--color-highlight)]">{eventFetchError}</div>
        ) : displayEvent ? (
          <div className="mb-4 p-3 rounded bg-[rgba(255,255,255,0.02)]">
            <div className="text-base text-white font-semibold">{displayEvent.title || 'Event'}</div>
            <div className="text-sm text-white/60">{displayEvent.date ? new Date(displayEvent.date).toLocaleString() : ''}</div>
            <div className="mt-1 text-sm text-white">{formatPrice(displayEvent.price)}</div>
            {typeof displayEvent.price === 'undefined' && (
              <div className="mt-1 text-xs text-yellow-200">Price missing from event object — fetched details should populate this. If you see 'Free' here but the event has a price, check the event payload.</div>
            )}
          </div>
        ) : null}
      {error && (
        <div className="bg-red-600 text-white rounded px-3 py-2 mb-2">{error}</div>
      )}
      {success ? (
        <div className="bg-green-600 text-white rounded px-3 py-2">
          <div>Payment succeeded. Thank you!</div>
          {receiptInfo && (
            <div className="mt-2 text-sm text-white/90">
              <div>Amount paid: {receiptInfo.amountFormatted}</div>
              {receiptInfo.receiptUrl && (
                <div>
                  Receipt: <a className="text-[var(--color-accent)]" href={receiptInfo.receiptUrl} target="_blank" rel="noreferrer">View receipt</a>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-white">
          <div className="space-y-3">
            <label className="block text-sm text-white/80">Payer name</label>
            <input
              className="w-full bg-[rgba(255,255,255,0.02)] border border-white/10 rounded px-3 py-2 text-white"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="Full name as on card"
            />

            <div>
              <label className="block text-sm text-white/80">Card number</label>
              <div className="p-2 bg-[rgba(255,255,255,0.02)] rounded">
                <CardNumberElement
                  options={{
                    showIcon: true,
                    style: {
                      base: { color: '#ffffff', fontSize: '16px', '::placeholder': { color: '#bfbfbf' } },
                      invalid: { color: '#ff4d4f' }
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-white/80">Expiry</label>
                <div className="p-2 bg-[rgba(255,255,255,0.02)] rounded">
                  <CardExpiryElement
                    options={{
                      style: { base: { color: '#ffffff', fontSize: '16px' }, invalid: { color: '#ff4d4f' } }
                    }}
                  />
                </div>
              </div>
              <div style={{ minWidth: 120 }}>
                <label className="block text-sm text-white/80">CVC</label>
                <div className="p-2 bg-[rgba(255,255,255,0.02)] rounded">
                  <CardCvcElement
                    options={{
                      style: { base: { color: '#ffffff', fontSize: '16px' }, invalid: { color: '#ff4d4f' } }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <button type="submit" disabled={!stripe || loading} className="btn btn-primary text-white">
            {loading ? 'Processing...' : 'Pay'}
          </button>
        </form>
      )}
    </div>
  );
};

const PaymentForm = ({ eventId, clientSecret = null, onSuccess, event = null }) => (
  <Elements stripe={stripePromise}>
    <CheckoutFormInner eventId={eventId} clientSecretProp={clientSecret} onSuccess={onSuccess} event={event} />
  </Elements>
);

export default PaymentForm;
