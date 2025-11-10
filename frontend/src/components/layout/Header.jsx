import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context'

const Header = ({ toggleSidebar, pendingCount = 0, onNotificationsClick }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="w-full">
      <div className="w-full px-4 py-3 flex justify-between items-center glass" style={{ backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-3">
          <button
            className="text-white focus:outline-none md:hidden"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          <Link to="/home" className="flex items-center text-2xl font-bold gap-3">
            <div className="relative">
              <img src="/logo4.png" alt="Coordi-Net" className="h-10 w-10 rounded-full mr-2 object-cover" />
              <span
                className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, var(--color-accent), var(--color-highlight))',
                }}
              />
            </div>
            <div>
              <div className="text-white font-semibold">CoordiNet</div>
              <p className="text-xs text-white/60">Seamless Coordination, limitless Network</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              {/* Notification bell - visible to admins */}
              {user.role === 'admin' && (
                <button onClick={() => { if (onNotificationsClick) onNotificationsClick(); else if (typeof window !== 'undefined') window.location.assign('/admindashboard/role-requests'); }} className="relative mr-2">
                  <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Badge */}
                  <span className="absolute -top-1 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{pendingCount}</span>
                </button>
              )}
            {/*  <Link to="/profile" className="flex items-center gap-2 hover:bg-[rgba(255,255,255,0.03)] px-2 py-1 rounded-md transition duration-300">
                {user.photo ? (
                  <img src={user.photo} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center font-semibold uppercase text-[var(--color-primary)]">
                    {user.firstName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="hidden md:inline font-medium">{user.firstName || 'User'}</span>
              </Link>

             <button onClick={handleLogout} className="bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.09)] px-4 py-2 rounded-md transition duration-300 border border-white/6 flex items-center gap-2">
                <span className="hidden md:inline">Logout</span>
                <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 4H6a2 2 0 00-2 2v12a2 2 0 002 2h7" />
                </svg>
              </button> */}
            </div>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200 transition duration-300">Login</Link>
              <Link to="/register" className="px-4 py-2 rounded-md hover:bg-[rgba(255,255,255,0.03)] transition duration-300 font-medium btn-accent text-white">Register</Link>
            </>
          )}
        </div>
      </div>

      <div className="w-full px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mt-3">
            <div className="header-accent" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
