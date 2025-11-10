import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { authService } from '../services';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    college: ''
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [roleRequesting, setRoleRequesting] = useState(false);
  const [roleRequestStatus, setRoleRequestStatus] = useState(null);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await authService.getCurrentUser();
        setProfileData(response.user);
        setFormData({
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          college: response.user.college
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  // Check for existing role requests for current user
  useEffect(() => {
    const checkRoleRequests = async () => {
      if (!user) return;
      try {
        const res = await authService.getMyRoleRequests();
        if (res.count > 0) {
          // If any pending request exists, set status to pending
          const pending = res.requests.find(r => r.status === 'pending');
          if (pending) setRoleRequestStatus('pending');
        }
      } catch (err) {
        // ignore silently — this shouldn't block profile loading
        console.debug('Could not fetch role requests:', err.message);
      }
    };
    checkRoleRequests();
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Call the updateProfile endpoint
      const response = await authService.updateProfile(formData);
      
      // Update local profile data with the response
      setProfileData(response.user);
      setUpdateSuccess(true);
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
    } catch (error) {
      setError(error.message || 'Failed to update profile');
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Render role-specific information
  const renderRoleSpecificInfo = () => {
    if (!profileData) return null;

    switch (profileData.role) {
      case 'admin':
        return (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Admin Information</h3>
            <p className="text-purple-700 mb-2">As an admin, you have full access to manage the platform.</p>
            <ul className="list-disc list-inside text-purple-600 ml-2">
              <li>Manage all users and their roles</li>
              <li>Approve or reject events</li>
              <li>Access platform analytics</li>
              <li>Configure system settings</li>
            </ul>
          </div>
        );
      case 'organizer':
        return (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Organizer Information</h3>
            <p className="text-blue-700 mb-2">As an organizer, you can create and manage events.</p>
            <ul className="list-disc list-inside text-blue-600 ml-2">
              <li>Create new events</li>
              <li>Manage your existing events</li>
              <li>View participant registrations</li>
              <li>Send announcements to participants</li>
            </ul>
          </div>
        );
      case 'participant':
      case 'user':
        return (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Participant Information</h3>
            <p className="text-green-700 mb-2">As a participant, you can register for and attend events.</p>
            <ul className="list-disc list-inside text-green-600 ml-2">
              <li>Browse and register for events</li>
              <li>View your registered events</li>
              <li>Receive event updates</li>
              <li>Participate in event activities</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-12">
      <div className="glass rounded-xl shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4" style={{ background: 'linear-gradient(90deg, rgba(26,27,58,0.9), rgba(46,46,58,0.7))' }}>
          <h1 className="text-3xl font-bold text-white">My Profile</h1>
        </div>
        <div className="p-6">
          {/* Loading indicator */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderTopColor: 'var(--color-accent)', borderBottomColor: 'rgba(255,255,255,0.06)' }}></div>
            </div>
          ) : error ? (
            <div className="my-6 p-4 rounded-md bg-[rgba(255,20,20,0.06)] border border-[rgba(255,20,20,0.12)]">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </div>
          ) : profileData ? (
            <div>
              {/* Success message */}
              {updateSuccess && (
                <div className="mb-4 px-4 py-3 rounded relative" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', color: 'var(--color-accent)' }}>
                  Profile updated successfully!
                </div>
              )}
              
              {/* Profile information */}
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 mb-6 md:mb-0">
                      <div className="flex flex-col items-center">
                        {user.photo ? (
                          <img 
                            src={user.photo} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full object-cover mb-4"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-[rgba(255,255,255,0.04)] rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl font-bold text-white/80">
                              {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <h2 className="text-xl font-semibold text-white">{profileData.firstName} {profileData.lastName}</h2>
                        <span className={`mt-2 py-1 px-3 rounded-full text-xs ${profileData.role === 'admin' ? 'bg-[rgba(124,77,255,0.06)] text-[var(--color-highlight)]' : profileData.role === 'organizer' ? 'bg-[rgba(0,229,255,0.04)] text-[var(--color-accent)]' : 'bg-[rgba(0,255,170,0.04)] text-teal-300'}`}>
                          {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                        </span>
                      </div>
                </div>
                
                <div className="md:w-2/3">
                      {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-white/70 mb-1">First Name</label>
                          <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-md focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-white/70 mb-1">Last Name</label>
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-md focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-md focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                          required
                          disabled
                        />
                        <p className="text-xs text-white/60 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label htmlFor="college" className="block text-sm font-medium text-white/70 mb-1">College</label>
                        <input
                          type="text"
                          id="college"
                          name="college"
                          value={formData.college}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] rounded-md focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                          required
                        />
                      </div>
                      <div className="flex space-x-4">
                        <button
                          type="submit"
                          className="btn-accent text-white px-4 py-2 rounded-md"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-[rgba(255,255,255,0.03)] text-white/80 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                      <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-white/60">First Name</h3>
                          <p className="mt-1 text-lg text-white/80">{profileData.firstName}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white/60">Last Name</h3>
                          <p className="mt-1 text-lg text-white/80">{profileData.lastName}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white/60">Email</h3>
                        <p className="mt-1 text-lg text-white/80">{profileData.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-white/60">College</h3>
                        <p className="mt-1 text-lg text-white/80">{profileData.college}</p>
                      </div>
                      <div>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn-accent text-white px-4 py-2 rounded-md"
                        >
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Role-specific information */}
              <div>
                {profileData.role === 'admin' && (
                  <div className="mt-6 p-4 glass-soft rounded-lg border-l-4" style={{ borderColor: 'var(--color-highlight)' }}>
                    <h3 className="text-lg font-semibold text-white mb-2">Admin Information</h3>
                    <p className="text-white/70 mb-2">As an admin, you have full access to manage the platform.</p>
                    <ul className="list-disc list-inside text-white/60 ml-2">
                      <li>Manage all users and their roles</li>
                      <li>Approve or reject events</li>
                      <li>Access platform analytics</li>
                      <li>Configure system settings</li>
                    </ul>
                  </div>
                )}
                {profileData.role === 'organizer' && (
                  <div className="mt-6 p-4 glass-soft rounded-lg border-l-4" style={{ borderColor: 'var(--color-accent)' }}>
                    <h3 className="text-lg font-semibold text-white mb-2">Organizer Information</h3>
                    <p className="text-white/70 mb-2">As an organizer, you can create and manage events.</p>
                    <ul className="list-disc list-inside text-white/60 ml-2">
                      <li>Create new events</li>
                      <li>Manage your existing events</li>
                      <li>View participant registrations</li>
                      <li>Send announcements to participants</li>
                    </ul>
                  </div>
                )}
                {(profileData.role === 'participant' || profileData.role === 'user') && (
                  <div className="mt-6 p-4 glass-soft rounded-lg border-l-4" style={{ borderColor: 'rgba(0,255,170,0.4)' }}>
                    <h3 className="text-lg font-semibold text-white mb-2">Participant Information</h3>
                    <p className="text-white/70 mb-2">As a participant, you can register for and attend events.</p>
                    <ul className="list-disc list-inside text-white/60 ml-2">
                      <li>Browse and register for events</li>
                      <li>View your registered events</li>
                      <li>Receive event updates</li>
                      <li>Participate in event activities</li>
                    </ul>
                    <div className="mt-4">
                      {roleRequestStatus === 'pending' ? (
                        <div className="text-sm text-yellow-300">Your organizer request is pending review.</div>
                      ) : roleRequestStatus === 'sent' ? (
                        <div className="text-sm text-green-300">Organizer request sent. Admin will review.</div>
                      ) : roleRequestStatus === 'error' ? (
                        <div className="text-sm text-red-300">Failed to send request. Try again later.</div>
                      ) : (
                        <button
                          disabled={roleRequesting}
                          onClick={async () => {
                            setRoleRequesting(true);
                            setRoleRequestStatus(null);
                            try {
                              const payload = {
                                email: profileData.email,
                                name: `${profileData.firstName} ${profileData.lastName}`,
                                college: profileData.college
                              };
                              await authService.requestOrganizerRole(payload);
                              setRoleRequestStatus('sent');
                            } catch (err) {
                              setRoleRequestStatus('error');
                              console.error('Role request failed', err);
                            } finally {
                              setRoleRequesting(false);
                            }
                          }}
                          className="mt-3 inline-flex items-center px-3 py-2 rounded-md bg-[rgba(0,255,170,0.08)] text-white/90"
                        >
                          {roleRequesting ? 'Sending request...' : 'Request Organizer Role'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;