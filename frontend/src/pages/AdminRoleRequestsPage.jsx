import { useEffect, useState } from 'react';
import adminService from '../services/adminService';

const AdminRoleRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({});

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminService.getRoleRequests();
      // adminService returns an object like { success, count, requests }
      const data = res?.requests || res?.data?.requests || res || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id, action) => {
    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      await adminService.updateRoleRequest(id, action === 'approve' ? 'approved' : 'rejected');
      // Refresh list
      await fetchRequests();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Action failed');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Organizer Role Requests</h1>
      {loading ? <div>Loading...</div> : null}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !requests.length && <div className="text-white/70">No role requests found.</div>}
      {requests.length > 0 && (
        <div className="mt-4 space-y-3">
          {requests.map(r => (
            <div key={r._id} className="glass-soft p-4 rounded-md flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{r.name} ({r.email})</div>
                <div className="text-white/70 text-sm">College: {r.college || '—'}</div>
                <div className="text-white/60 text-sm">Requested: {new Date(r.createdAt).toLocaleString()}</div>
                <div className="text-white/60 text-sm">Status: {r.status}</div>
              </div>
              <div className="flex items-center space-x-2">
                {r.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleAction(r._id, 'approve')}
                      disabled={processing[r._id]}
                      className="px-3 py-2 rounded bg-[rgba(0,229,255,0.08)] text-white/90"
                    >
                      {processing[r._id] ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(r._id, 'reject')}
                      disabled={processing[r._id]}
                      className="px-3 py-2 rounded bg-[rgba(255,20,60,0.06)] text-red-300"
                    >
                      {processing[r._id] ? 'Processing...' : 'Reject'}
                    </button>
                  </>
                ) : (
                  <div className="text-white/70">Handled by: {r.handledBy || '—'}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRoleRequestsPage;
