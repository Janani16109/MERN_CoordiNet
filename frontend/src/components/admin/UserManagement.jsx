import { useState, useEffect } from 'react';
import { adminService } from '../../services';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
  const response = await adminService.getAllUsers();
  const userList = response?.users || [];
  setUsers(userList);
  setFilteredUsers(userList);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
  
  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users || []);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = (users || []).filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      
      return fullName.includes(lowercasedSearch) || email.includes(lowercasedSearch);
    });
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      setRoleUpdateLoading(true);
      await adminService.updateUserRole(userId, newRole);
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      
      setSuccessMessage(`User role updated successfully to ${newRole}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    } finally {
      setRoleUpdateLoading(false);
    }
  };

  return (
  <div className="glass-soft rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
      
      {/* Search input */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input 
            type="text" 
            className="block w-full p-2 pl-10 text-sm text-white/90 border border-[rgba(255,255,255,0.04)] rounded-lg bg-[rgba(255,255,255,0.02)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]" 
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-600 border border-green-500 text-white px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-600 border border-red-500 text-white px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {(filteredUsers && filteredUsers.length === 0) ? (
            <div className="text-center py-4 text-white/70">
              No users found matching your search criteria.
            </div>
          ) : (
            <table className="min-w-full" style={{ background: 'transparent' }}>
              <thead>
                <tr className="" style={{ background: 'transparent' }}>
                  <th className="py-3 px-6 text-left text-white font-medium">Name</th>
                  <th className="py-3 px-6 text-left text-white font-medium">Email</th>
                  <th className="py-3 px-6 text-left text-white font-medium">College</th>
                  <th className="py-3 px-6 text-left text-white font-medium">Current Role</th>
                  <th className="py-3 px-6 text-center text-white font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="text-white/90 text-sm">
                {(filteredUsers || []).map(user => (
                <tr key={user._id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <td className="py-3 px-6 text-left">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="py-3 px-6 text-left">{user.email}</td>
                  <td className="py-3 px-6 text-left">{user.college}</td>
                  <td className="py-3 px-6 text-left">
                    <span className={`py-1 px-3 rounded-full text-xs ${
                      user.role === 'admin' ? 'bg-purple-600 text-white' :
                      user.role === 'organizer' ? 'bg-blue-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <select 
                        className="border rounded px-2 py-1 text-sm text-white bg-transparent border-[rgba(255,255,255,0.06)]"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={roleUpdateLoading}
                      >
                        <option value="participant">Participant</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;