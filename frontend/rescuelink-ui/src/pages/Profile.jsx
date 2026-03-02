import { useState } from 'react';
import { changePassword as changePasswordUser } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastProvider';

function Profile() {
  const { user, updateUser } = useAuth();
  const { pushToast } = useToast();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || '',
    emergencyContact: user?.emergencyContact || ''
  });
  const [passwords, setPasswords] = useState({ current: '', next: '' });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [securityEnabled, setSecurityEnabled] = useState(false);
  const [contacts, setContacts] = useState(() => {
    const key = `emergency_contacts_${user?.id || 'guest'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [{ id: 1, name: 'Mother', phone: user?.emergencyContact || '' }];
      }
    }
    return [{ id: 1, name: 'Mother', phone: user?.emergencyContact || '' }];
  });
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [editingContactId, setEditingContactId] = useState(null);

  const history = [
    { id: 1001, type: 'SOS', status: 'Resolved', createdAt: new Date().toISOString() },
    { id: 1002, type: 'Donor Request', status: 'Pending', createdAt: new Date(Date.now() - 86400000).toISOString() }
  ];

  const saveProfile = (e) => {
    e.preventDefault();
    updateUser(profile);
    pushToast('Profile updated.', 'success');
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      pushToast('User session missing. Login again.', 'danger');
      return;
    }
    if (!passwords.current) {
      pushToast('Current password is required.', 'danger');
      return;
    }
    if (passwords.next.length < 8) {
      pushToast('New password must be at least 8 characters.', 'danger');
      return;
    }

    try {
      setUpdatingPassword(true);
      await changePasswordUser({
        email: user.email,
        currentPassword: passwords.current,
        newPassword: passwords.next
      });
      setPasswords({ current: '', next: '' });
      pushToast('Password changed successfully.', 'success');
    } catch (error) {
      pushToast(error?.response?.data?.error || 'Password change failed', 'danger');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const addContact = (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    const next = [...contacts, { ...newContact, id: Date.now() }];
    setContacts(next);
    localStorage.setItem(`emergency_contacts_${user?.id || 'guest'}`, JSON.stringify(next));
    setNewContact({ name: '', phone: '' });
  };

  const saveContact = (id) => {
    setEditingContactId(null);
    localStorage.setItem(`emergency_contacts_${user?.id || 'guest'}`, JSON.stringify(contacts));
    if (contacts[0]?.name === 'Mother') {
      setProfile((prev) => ({ ...prev, emergencyContact: contacts[0].phone }));
      updateUser({ emergencyContact: contacts[0].phone });
    }
    pushToast('Contact updated.', 'success');
  };

  const removeContact = (id) => {
    const next = contacts.filter((c) => c.id !== id);
    setContacts(next);
    localStorage.setItem(`emergency_contacts_${user?.id || 'guest'}`, JSON.stringify(next));
  };

  return (
    <div className='container py-4'>
      <div className='card card-soft p-3 mb-3'>
        <div className='d-flex align-items-center gap-3'>
          <div className='rounded-circle d-flex align-items-center justify-content-center text-white fw-bold' style={{ width: 62, height: 62, background: 'linear-gradient(135deg, #ef4444, #2563eb)' }}>
            {(profile.name || 'U').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className='mb-0'>Profile Management</h2>
            <p className='text-muted mb-0'>Keep identity, security, and emergency data current.</p>
          </div>
        </div>
      </div>
      <div className='row g-3'>
        <div className='col-lg-6'>
          <div className='card card-soft p-3 h-100'>
            <h5>Edit Profile</h5>
            <form onSubmit={saveProfile} className='row g-2'>
              <div className='col-md-6'><input className='form-control' placeholder='Name' value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className='col-md-6'><input className='form-control' placeholder='Email' value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></div>
              <div className='col-md-6'><input className='form-control' placeholder='Phone' value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></div>
              <div className='col-md-6'><input className='form-control' placeholder='Blood Group' value={profile.bloodGroup} onChange={(e) => setProfile((p) => ({ ...p, bloodGroup: e.target.value }))} /></div>
              <div className='col-12'><input className='form-control' placeholder='Emergency Contact' value={profile.emergencyContact} onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: e.target.value }))} /></div>
              <div className='col-12 d-grid'><button className='btn btn-danger'>Save Profile</button></div>
            </form>
          </div>
        </div>

        <div className='col-lg-6'>
          <div className='card card-soft p-3 h-100'>
            <h5>Change Password</h5>
            <form onSubmit={changePassword} className='row g-2'>
              <div className='col-12'>
                <label className='form-label mb-1'>Current password</label>
                <input type='password' className='form-control' placeholder='Current password' value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} />
              </div>
              <div className='col-12'>
                <label className='form-label mb-1'>New password</label>
                <input type='password' className='form-control' placeholder='New password' value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} />
              </div>
              <div className='col-12 d-grid'><button className='btn btn-outline-danger' disabled={updatingPassword}>{updatingPassword ? 'Updating...' : 'Update Password'}</button></div>
            </form>

            <hr />
            <h6>Security</h6>
            <div className='d-flex justify-content-between align-items-center border rounded p-2 mb-3'>
              <div>
                <p className='mb-0 fw-semibold'>Two-step verification</p>
                <small className='text-muted'>Recommended for emergency accounts</small>
              </div>
              <div className='d-flex align-items-center gap-2'>
                <span className={`badge ${securityEnabled ? 'text-bg-success' : 'text-bg-warning'}`}>{securityEnabled ? 'Enabled' : 'Pending'}</span>
                <button className='btn btn-sm btn-outline-secondary' type='button' onClick={() => setSecurityEnabled((prev) => !prev)}>
                  {securityEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>

            <h6>Emergency Contacts</h6>
            <form onSubmit={addContact} className='row g-2 mb-2'>
              <div className='col-6'><input className='form-control' placeholder='Name' value={newContact.name} onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className='col-4'><input className='form-control' placeholder='Phone' value={newContact.phone} onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))} /></div>
              <div className='col-2 d-grid'><button className='btn btn-danger'>Add</button></div>
            </form>

            <ul className='list-group'>
              {contacts.map((c) => (
                <li className='list-group-item d-flex justify-content-between align-items-center' key={c.id}>
                  <div className='d-flex gap-2 align-items-center flex-grow-1'>
                    <input
                      className='form-control form-control-sm'
                      value={c.name}
                      disabled={editingContactId !== c.id}
                      onChange={(e) => setContacts((prev) => prev.map((item) => (item.id === c.id ? { ...item, name: e.target.value } : item)))}
                    />
                    <input
                      className='form-control form-control-sm'
                      value={c.phone}
                      disabled={editingContactId !== c.id}
                      onChange={(e) => setContacts((prev) => prev.map((item) => (item.id === c.id ? { ...item, phone: e.target.value } : item)))}
                    />
                  </div>
                  <div className='d-flex gap-1 ms-2'>
                    {editingContactId === c.id ? (
                      <button className='btn btn-sm btn-success' type='button' onClick={() => saveContact(c.id)}>Save</button>
                    ) : (
                      <button className='btn btn-sm btn-outline-primary' type='button' onClick={() => setEditingContactId(c.id)}>Edit</button>
                    )}
                    <button className='btn btn-sm btn-outline-danger' type='button' onClick={() => removeContact(c.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className='card card-soft p-3 mt-3'>
        <h5>Request History</h5>
        <div className='table-responsive'>
          <table className='table'>
            <thead><tr><th>ID</th><th>Type</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{h.id}</td>
                  <td>{h.type}</td>
                  <td>{h.status}</td>
                  <td>{new Date(h.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Profile;
