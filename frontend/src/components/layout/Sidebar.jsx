import { NavLink, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import AuthContext from '../../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAdmin = user && user.role === 'admin';
  const isOrganizer = user && user.role === 'organizer';

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('navCollapsed');
      if (saved === 'true') setCollapsed(true);
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('navCollapsed', String(next)); } catch (e) {}
      return next;
    });
  };

  const NavItem = ({ to, icon, label }) => (
    <NavLink
      to={to}
      title={label}
      className={({isActive})=>`relative flex items-center justify-center ${collapsed ? 'p-2 mx-0' : 'px-3 py-2 mx-1'} rounded-md transition-colors duration-200 ${isActive? 'sidebar-item-active' : 'sidebar-item'}`}
      onMouseEnter={(e)=>handleTooltipEnter(e, label)}
      onMouseLeave={handleTooltipLeave}
      onFocus={(e)=>handleTooltipEnter(e, label)}
      onBlur={handleTooltipLeave}
    >
      <span className="flex items-center gap-2">
        <span className="w-5 h-5 text-white/90" aria-hidden>{icon}</span>
        {!collapsed && <span className="text-white/90 ml-1">{label}</span>}
      </span>
    </NavLink>
  );

  // Tooltip state and handlers (for collapsed mode only)
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  let tooltipTimer = null;

  const handleTooltipEnter = (event, text) => {
    if (!collapsed) return;
    const target = event.currentTarget;
    // start delay
    tooltipTimer = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setTooltip({ visible: true, text, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    }, 300);
  };

  const handleTooltipLeave = () => {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
      tooltipTimer = null;
    }
    setTooltip({ visible: false, text: '', x: 0, y: 0 });
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Desktop: top horizontal nav */}
      <header className="w-full glass p-2 shadow-md z-30">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-2">
             
              {!isAdmin && !isOrganizer && (
                <NavItem to="/home" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3"/></svg>} label="Home" />
              )}
              {isOrganizer && <NavItem to="/organizerdashboard" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2"/></svg>} label="Organizer" />}
              {isAdmin && <NavItem to="/admindashboard" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/></svg>} label="Admin" />}
              <NavItem to="/events" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10"/></svg>} label="Events" />
              <NavItem to="/leaderboard" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5"/></svg>} label="Leaderboard" />
              <NavItem to="/announcements" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592"/></svg>} label="Announcements" />
              <NavItem to="/settings" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10" strokeWidth="2"/></svg>} label="Settings" />
              {isAdmin && <NavItem to="/system-settings" icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 12h16"/></svg>} label="System Settings" />}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleCollapsed} className="text-white/90 px-2 py-1 rounded-md hover:bg-[rgba(255,255,255,0.03)]" title={collapsed ? 'Expand menu' : 'Compact menu'}>
              {collapsed ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 18h16"/></svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6h12v12H6z"/></svg>
              )}
            </button>

            <NavLink to="/profile" className={`hidden md:flex items-center gap-2 hover:bg-[rgba(255,255,255,0.03)] ${collapsed? 'px-2' : 'px-2 py-1'} rounded-md`}>
              <div className="h-8 w-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center font-semibold uppercase text-[var(--color-primary)]">{user?.firstName?.charAt(0) || 'U'}</div>
              {!collapsed && <span className="text-white/90 hidden lg:inline">{user?.firstName || 'User'}</span>}
            </NavLink>

            <button onClick={() => { logout(); navigate('/'); }} className="bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)] px-3 py-2 rounded-md text-sm">Logout</button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-sidebar-gradient text-sidebar-fg z-40 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold text-white">Menu</div>
            <button onClick={toggleSidebar} className="text-white">Close</button>
          </div>
          <nav>
            <ul className="flex flex-col gap-2">
              {!isAdmin && !isOrganizer && (
                <li><NavItem to="/home">Home</NavItem></li>
              )}
              {isOrganizer && <li><NavItem to="/organizerdashboard">Organizer Dashboard</NavItem></li>}
              {isAdmin && <li><NavItem to="/admindashboard">Admin Dashboard</NavItem></li>}
              <li><NavItem to="/events">Events</NavItem></li>
              <li><NavItem to="/leaderboard">Leaderboard</NavItem></li>
              <li><NavItem to="/announcements">Announcements</NavItem></li>
              <li><NavItem to="/profile">Profile</NavItem></li>
              <li><NavItem to="/settings">Settings</NavItem></li>
              {isAdmin && <li><NavItem to="/system-settings">System Settings</NavItem></li>}
              <li>
                <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-3 py-2 rounded-md sidebar-logout">Logout</button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
      {/* Tooltip overlay for collapsed icons */}
      {tooltip.visible && (
        <div
          role="tooltip"
          aria-live="polite"
          className="pointer-events-none z-50 fixed transform -translate-x-1/2"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="bg-[rgba(0,0,0,0.75)] text-white text-sm px-3 py-1 rounded-md shadow-md">
            {tooltip.text}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;