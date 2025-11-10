import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { RealtimeAnnouncements } from '../announcements';
import { useAuth } from '../../context';
import { adminService } from '../../services';
import { useSocket } from '../../context/SocketContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [roleRequestNotifications, setRoleRequestNotifications] = useState(0);
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Add scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Use central SocketContext socket for real-time notifications
  useEffect(() => {
    if (!user) return;

    // Initialize badge count by fetching pending requests
    (async () => {
      try {
        const rr = await adminService.getRoleRequests();
        const rrData = rr?.data || rr;
        const requestsArr = rrData?.requests || rrData || [];
        const pendingCount = requestsArr.filter(r => r.status === 'pending').length;
        setRoleRequestNotifications(pendingCount);
      } catch (err) {
        console.debug('Failed to initialize role requests count', err?.message || err);
      }
    })();

    // Attach listener only when socket is available and user is admin
    if (socket && user.role === 'admin') {
      const handler = (data) => setRoleRequestNotifications(prev => prev + 1);
      socket.on('roleRequestCreated', handler);

      socket.on('connect_error', (err) => {
        console.debug('Socket connect error', err.message, err);
      });

      return () => {
        socket.off('roleRequestCreated', handler);
      };
    }
  }, [user, socket, connected]);

  // Clear badge when admin navigates to the role-requests page
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (location.pathname.includes('/admindashboard/role-requests')) {
      setRoleRequestNotifications(0);
    }
  }, [location.pathname, user]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-primary)] text-[var(--text-on-primary)]">
      <div className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg glass' : ''}`}>
        <Header toggleSidebar={toggleSidebar} pendingCount={roleRequestNotifications} onNotificationsClick={() => window.location.assign('/admindashboard/role-requests')} />
      </div>

      <RealtimeAnnouncements />

      <div className="flex-1 min-h-0 w-full">
        {/* Top navigation (replaces the vertical sidebar) */}
        <div className="w-full">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        </div>

        <main className="flex-1 overflow-y-auto h-full pt-4">
          <div className="container mx-auto px-4 py-4 md:px-6 md:py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;