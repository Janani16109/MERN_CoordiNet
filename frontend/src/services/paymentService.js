import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/payments` : 'http://localhost:8001/api/payments'); // fallback to backend started on 8001

const paymentApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

paymentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const paymentService = {
  createPaymentIntent: async (eventId, quantity = 1, registrationData = {}) => {
    try {
      const res = await paymentApi.post('/create-payment-intent', { eventId, quantity, registrationData });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create payment intent');
    }
  }
};

export default paymentService;
