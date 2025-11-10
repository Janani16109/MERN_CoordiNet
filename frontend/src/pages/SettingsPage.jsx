import { useState, useEffect } from 'react';
import { useAuth } from '../context';
import { settingsService } from '../services';

const SettingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [notification, setNotification] = useState({
    email: true,
    push: true,
    sms: false
  });
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleNotificationChange = (type) => {
    setNotification(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  // Load user settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);

        // If the user is not authenticated, don't call the API — avoid 401 responses
        if (!isAuthenticated) {
          setError('Please sign in to view and edit your settings.');
          setLoading(false);
          return;
        }

        let response;
        try {
          response = await settingsService.getUserSettings();
        } catch (err) {
          // If the service indicated missing auth, show friendly message and don't spam console
          if (err && err.isAuthMissing) {
            setError('Please sign in to view and edit your settings.');
            setLoading(false);
            return;
          }
          throw err;
        }

        if (response.success && response.data) {
          const userSettings = response.data;
          if (userSettings.notification) setNotification(userSettings.notification);
          if (userSettings.theme) setTheme(userSettings.theme);
          if (userSettings.language) setLanguage(userSettings.language);

          // Set privacy settings if available
          if (userSettings.privacy) {
            // Update UI for privacy settings
            // This would be implemented with state variables for privacy settings
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        setError('Failed to load your settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isAuthenticated]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // In a real app, you would save these settings to the backend
      await settingsService.updateUserSettings({
        notification,
        theme,
        language
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-12">
      <div className="glass rounded-xl shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4" style={{ background: 'linear-gradient(90deg, rgba(26,27,58,0.9), rgba(46,46,58,0.7))' }}>
          <h1 className="text-3xl font-bold text-white">User Settings</h1>
        </div>
        <div className="p-6">
          {!isAuthenticated ? (
            <div className="mb-6 p-4 rounded-md" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
              <p className="text-white/80">You need to be signed in to view and edit your settings.</p>
              <div className="mt-3">
                <a href="/login" className="btn-accent">Sign in</a>
              </div>
            </div>
          ) : (
            <p className="text-lg text-white/80 mb-6">Customize your experience, {user?.firstName || 'User'}!</p>
          )}
          
          {success && (
            <div className="mb-6 p-4 rounded-md" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', color: 'var(--color-accent)' }}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-white/80">Settings saved successfully!</p>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 rounded-md" style={{ background: 'rgba(255,20,20,0.06)', border: '1px solid rgba(255,20,20,0.12)' }}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSaveSettings}>
            {/* Notification Settings */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="email-notifications"
                    type="checkbox"
                    className="h-4 w-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)] border-[rgba(255,255,255,0.06)] rounded"
                    checked={notification.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                  <label htmlFor="email-notifications" className="ml-3 block text-white/80">
                    Email Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="push-notifications"
                    type="checkbox"
                    className="h-4 w-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)] border-[rgba(255,255,255,0.06)] rounded"
                    checked={notification.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                  <label htmlFor="push-notifications" className="ml-3 block text-white/80">
                    Push Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="sms-notifications"
                    type="checkbox"
                    className="h-4 w-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)] border-[rgba(255,255,255,0.06)] rounded"
                    checked={notification.sms}
                    onChange={() => handleNotificationChange('sms')}
                  />
                  <label htmlFor="sms-notifications" className="ml-3 block text-white/80">
                    SMS Notifications
                  </label>
                </div>
              </div>
            </div>
            
            {/* Appearance Settings */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Appearance</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="theme" className="block text-white/80 mb-2">Theme</label>
                  <select
                    id="theme"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] sm:text-sm rounded-md"
                    value={theme}
                    onChange={handleThemeChange}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Language Settings */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Language</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="language" className="block text-white/80 mb-2">Preferred Language</label>
                  <select
                    id="language"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] focus:outline-none focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] sm:text-sm rounded-md"
                    value={language}
                    onChange={handleLanguageChange}
                  >
                    <option value="english">English</option>
                    <option value="kannada">Kannada</option>
                    <option value="hindi">Hindi</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="chinese">Chinese</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Privacy Settings */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Privacy</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="profile-visibility"
                    type="checkbox"
                    className="h-4 w-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)] border-[rgba(255,255,255,0.06)] rounded"
                    defaultChecked
                  />
                  <label htmlFor="profile-visibility" className="ml-3 block text-white/80">
                    Make my profile visible to other users
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="event-participation"
                    type="checkbox"
                    className="h-4 w-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)] border-[rgba(255,255,255,0.06)] rounded"
                    defaultChecked
                  />
                  <label htmlFor="event-participation" className="ml-3 block text-white/80">
                    Show my event participation history
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-accent inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;