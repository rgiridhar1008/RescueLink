import { useEffect, useMemo, useState } from 'react';
import { clearBroadcast, fetchActivityLog, fetchLatestBroadcast, sendBroadcast } from '../api/admin.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastProvider';

const QUICK_TEMPLATES = [
  'Blood required at City Hospital. O- donors requested urgently.',
  'Emergency bed shortage reported. Nearby hospitals please confirm availability.',
  'Traffic incident alert. Avoid Main Road and use alternate routes.',
  'Heavy rain alert. Stay indoors unless urgent travel is required.'
];

function Broadcast() {
  const { role } = useAuth();
  const { pushToast } = useToast();
  const isAdmin = role === 'ADMIN';
  const [latest, setLatest] = useState('');
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [audience, setAudience] = useState('ALL_USERS');
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const [editing, setEditing] = useState(false);

  const loadLatest = async () => {
    try {
      const [data, logs] = await Promise.all([
        fetchLatestBroadcast(),
        fetchActivityLog().catch(() => [])
      ]);
      setLatest((data?.message || '').trim());
      const broadcastLogs = (Array.isArray(logs) ? logs : [])
        .filter((item) => String(item.action || '').toLowerCase().includes('broadcast'))
        .slice(0, 8)
        .map((item, idx) => ({
          id: `${item.time || 't'}-${idx}`,
          message: item.details || '',
          time: item.time || ''
        }));
      setRecent(broadcastLogs);
      setUpdatedAt(new Date().toISOString());
    } catch {
      // keep current state if API is unavailable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatest();
    const id = setInterval(loadLatest, 10000);
    return () => clearInterval(id);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const finalMessage = `[${priority}] [${audience}] ${draft.trim()}`;
    try {
      setSending(true);
      await sendBroadcast(finalMessage);
      setLatest(finalMessage);
      setUpdatedAt(new Date().toISOString());
      setDraft('');
      setEditing(false);
      pushToast('Emergency broadcast sent to all users.', 'success');
      loadLatest();
    } catch {
      pushToast('Unable to send broadcast right now.', 'danger');
    } finally {
      setSending(false);
    }
  };

  const startEditCurrent = () => {
    if (!latest) return;
    setDraft(latest);
    setEditing(true);
  };

  const cancelEditCurrent = () => {
    setDraft('');
    setEditing(false);
  };

  const handleDeleteBroadcast = async () => {
    const confirmed = window.confirm('Delete current active broadcast?');
    if (!confirmed) return;
    try {
      setSending(true);
      await clearBroadcast();
      setLatest('');
      setUpdatedAt(new Date().toISOString());
      pushToast('Current broadcast deleted.', 'success');
      loadLatest();
    } catch {
      pushToast('Unable to delete broadcast right now.', 'danger');
    } finally {
      setSending(false);
    }
  };

  const statusText = useMemo(() => {
    if (loading) return 'Loading latest broadcast...';
    if (!latest) return 'No active emergency broadcast.';
    return latest;
  }, [latest, loading]);

  return (
    <div className='container py-4'>
      <div className='card card-soft p-4 mb-3'>
        <h2 className='mb-2'>Emergency Broadcast</h2>
        <p className='text-muted mb-0'>
          Admin can publish critical messages. All users can view them here in near real time.
        </p>
      </div>

      <div className='card card-soft p-4 mb-3'>
        <h5 className='mb-2'>Latest Broadcast</h5>
        <div className='timeline-box'>
          <p className='mb-1 fw-semibold'>{statusText}</p>
          {updatedAt && (
            <small className='text-muted'>Updated: {new Date(updatedAt).toLocaleString()}</small>
          )}
          {isAdmin && (
            <div className='mt-2 d-flex gap-2'>
              <button
                type='button'
                className='btn btn-sm btn-outline-primary'
                onClick={startEditCurrent}
                disabled={!latest || sending}
              >
                Edit Current
              </button>
              <button
                type='button'
                className='btn btn-sm btn-outline-danger'
                onClick={handleDeleteBroadcast}
                disabled={sending || !latest}
              >
                Delete Current
              </button>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className='card card-soft p-4'>
          <h5 className='mb-3'>Send Broadcast</h5>
          <div className='row g-2 mb-3'>
            <div className='col-md-4'>
              <label className='form-label'>Priority</label>
              <select className='form-select' value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value='LOW'>LOW</option>
                <option value='MEDIUM'>MEDIUM</option>
                <option value='HIGH'>HIGH</option>
                <option value='CRITICAL'>CRITICAL</option>
              </select>
            </div>
            <div className='col-md-8'>
              <label className='form-label'>Audience</label>
              <select className='form-select' value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value='ALL_USERS'>All Users</option>
                <option value='DONORS'>Donors</option>
                <option value='HOSPITALS'>Hospitals</option>
                <option value='ADMINS'>Admins</option>
              </select>
            </div>
          </div>

          <div className='mb-3'>
            <p className='mb-2 fw-semibold'>Quick Templates</p>
            <div className='d-flex flex-wrap gap-2'>
              {QUICK_TEMPLATES.map((template) => (
                <button
                  key={template}
                  type='button'
                  className='btn btn-sm btn-outline-secondary'
                  onClick={() => setDraft(template)}
                >
                  Use Template
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSend}>
            <label htmlFor='broadcast-message' className='form-label'>Message</label>
            <textarea
              id='broadcast-message'
              className='form-control mb-3'
              rows='3'
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder='Blood required at City Hospital. O- donors requested urgently.'
            />
            <small className='text-muted d-block mb-3'>{draft.length}/300 characters</small>
            <div className='timeline-box mb-3'>
              <small className='text-muted d-block'>Preview</small>
              <strong>[{priority}] [{audience}]</strong> {draft || 'Type message to preview'}
            </div>
            <button className='btn btn-danger' disabled={!draft.trim() || sending}>
              {sending ? (editing ? 'Updating...' : 'Sending...') : (editing ? 'Update Broadcast' : 'Send to All Users')}
            </button>
            {editing && (
              <button type='button' className='btn btn-outline-secondary ms-2' onClick={cancelEditCurrent} disabled={sending}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      )}

      <div className='card card-soft p-4 mt-3'>
        <h5 className='mb-3'>Recent Broadcasts</h5>
        {recent.length === 0 && <p className='text-muted mb-0'>No recent broadcast activity.</p>}
        {recent.length > 0 && (
          <div className='d-grid gap-2'>
            {recent.map((item) => (
              <div key={item.id} className='border rounded p-2'>
                <p className='mb-1'>{item.message || '-'}</p>
                <small className='text-muted'>{item.time ? new Date(item.time).toLocaleString() : 'Unknown time'}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Broadcast;
