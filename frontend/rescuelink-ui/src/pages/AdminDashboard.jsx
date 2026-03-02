import { useEffect, useMemo, useRef, useState } from 'react';
import AdminSidebar from '../components/layout/AdminSidebar';
import Loader from '../components/common/Loader';
import { useToast } from '../components/common/ToastProvider';
import {
  fetchUsers,
  fetchPendingDonors,
  fetchAllDonors,
  verifyDonor,
  addHospital,
  updateHospital,
  removeHospital,
  updateSOSStatus,
  deleteSOSAlert,
  fetchAdminSummary,
  updateUserRole,
  updateUserActive,
  sendBroadcast,
  fetchLatestBroadcast,
  fetchActivityLog
} from '../api/admin.api';
import { fetchAdminAlerts } from '../api/sos.api';
import { fetchHospitals } from '../api/hospitals.api';

const statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CRITICAL'];
const roleOptions = ['USER', 'MODERATOR', 'HOSPITAL_MANAGER', 'ADMIN'];

function AdminDashboard() {
  const [active, setActive] = useState('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pendingDonors, setPendingDonors] = useState([]);
  const [allDonors, setAllDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ totalUsers: 0, activeDonors: 0, hospitalsRegistered: 0, sosToday: 0, pendingVerifications: 0 });
  const [broadcast, setBroadcast] = useState('');
  const [latestBroadcast, setLatestBroadcast] = useState('');
  const [activityLog, setActivityLog] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [hospitalForm, setHospitalForm] = useState({ name: '', city: '', address: '', location: '', phone: '' });
  const [editingHospitalId, setEditingHospitalId] = useState(null);

  const [userQuery, setUserQuery] = useState('');
  const [hospitalCityFilter, setHospitalCityFilter] = useState('');
  const [sosStatusFilter, setSosStatusFilter] = useState('ALL');
  const [sosDateFilter, setSosDateFilter] = useState('');

  const [highlightAlertId, setHighlightAlertId] = useState(null);
  const lastAlertIdRef = useRef(null);

  const { pushToast } = useToast();

  const logLocal = (action, details) => {
    setActivityLog((prev) => [{ action, details, time: new Date().toISOString() }, ...prev].slice(0, 30));
  };

  const playAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 900;
      gain.gain.value = 0.02;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {
      // ignore
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [u, d, allD, h, a, s, latestCast, logs] = await Promise.all([
        fetchUsers().catch(() => []),
        fetchPendingDonors().catch(() => []),
        fetchAllDonors().catch(() => []),
        fetchHospitals().catch(() => []),
        fetchAdminAlerts().catch(() => []),
        fetchAdminSummary().catch(() => ({})),
        fetchLatestBroadcast().catch(() => ({})),
        fetchActivityLog().catch(() => [])
      ]);

      setUsers(u.length ? u : [
        { id: 1, name: 'Anita', email: 'anita@mail.com', role: 'USER', active: true },
        { id: 2, name: 'Suresh', email: 'suresh@mail.com', role: 'ADMIN', active: true }
      ]);
      setPendingDonors(Array.isArray(d) ? d : []);
      setAllDonors(Array.isArray(allD) ? allD : []);
      setHospitals(h.length ? h : [{ id: 21, name: 'CityCare ER', city: 'Hyderabad', address: 'MG Road', phone: '040-2100-1234' }]);
      setAlerts(a.length ? a : [{ id: 31, userId: 1, location: 'Madhapur', createdAt: new Date().toISOString(), status: 'OPEN' }]);
      setSummary({
        totalUsers: s.totalUsers ?? u.length,
        activeDonors: s.activeDonors ?? allD.filter((x) => x.availability === 'AVAILABLE' && x.verified).length,
        hospitalsRegistered: s.hospitalsRegistered ?? h.length,
        sosToday: s.sosToday ?? a.length,
        pendingVerifications: s.pendingVerifications ?? d.length
      });
      setLatestBroadcast(latestCast.message || '');
      if (logs.length) {
        setActivityLog(logs.map((x) => ({ action: x.action, details: x.details, time: x.time })));
      }
    } finally {
      setLoading(false);
    }
  };

  const pollAlerts = async () => {
    try {
      const nextAlerts = await fetchAdminAlerts();
      if (!Array.isArray(nextAlerts) || nextAlerts.length === 0) return;
      setAlerts(nextAlerts);

      const newest = [...nextAlerts].sort((a, b) => (b.id || 0) - (a.id || 0))[0];
      if (lastAlertIdRef.current == null) {
        lastAlertIdRef.current = newest.id;
        return;
      }
      if (newest.id !== lastAlertIdRef.current) {
        lastAlertIdRef.current = newest.id;
        setHighlightAlertId(newest.id);
        pushToast(`New SOS alert received (#${newest.id}).`, 'danger');
        playAlertSound();
        setTimeout(() => setHighlightAlertId(null), 4500);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!alerts.length) return;
    const newest = [...alerts].sort((a, b) => (b.id || 0) - (a.id || 0))[0];
    lastAlertIdRef.current = newest.id;
  }, [alerts]);

  useEffect(() => {
    const id = setInterval(pollAlerts, 10000);
    return () => clearInterval(id);
  }, []);

  const verify = async (id) => {
    try {
      await verifyDonor(id);
      setPendingDonors((prev) => prev.filter((d) => d.id !== id));
      pushToast('Donor verified.', 'success');
      logLocal('Verified donor', `Donor #${id} marked verified`);
      loadAll();
    } catch {
      pushToast('Verification endpoint unavailable. Updated locally.', 'warning');
    }
  };

  const addHospitalEntry = async (e) => {
    e.preventDefault();
    if (!hospitalForm.name || !hospitalForm.city) return;
    const isEdit = editingHospitalId != null;
    try {
      if (isEdit) {
        await updateHospital(editingHospitalId, hospitalForm);
        pushToast('Hospital updated.', 'success');
        logLocal('Updated hospital', `Hospital #${editingHospitalId}`);
      } else {
        await addHospital(hospitalForm);
        pushToast('Hospital added.', 'success');
        logLocal('Added hospital', `${hospitalForm.name} (${hospitalForm.city})`);
      }
    } catch {
      pushToast(isEdit ? 'Unable to update hospital right now.' : 'Hospital API unavailable. Added locally.', isEdit ? 'danger' : 'warning');
    }
    setHospitalForm({ name: '', city: '', address: '', location: '', phone: '' });
    setEditingHospitalId(null);
    loadAll();
  };

  const startEditHospital = (hospital) => {
    setEditingHospitalId(hospital.id);
    setHospitalForm({
      name: hospital.name || '',
      city: hospital.city || '',
      address: hospital.address || '',
      location: hospital.location || '',
      phone: hospital.phone || ''
    });
  };

  const cancelEditHospital = () => {
    setEditingHospitalId(null);
    setHospitalForm({ name: '', city: '', address: '', location: '', phone: '' });
  };

  const deleteHospitalEntry = async (id) => {
    try {
      await removeHospital(id);
      pushToast('Hospital removed.', 'success');
      logLocal('Deleted hospital', `Hospital #${id}`);
    } catch {
      pushToast('Delete API unavailable. Removed locally.', 'warning');
    }
    loadAll();
  };

  const changeAlertStatus = async (id, status) => {
    try {
      await updateSOSStatus(id, status);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      pushToast(`SOS #${id} status updated to ${status}.`, 'success');
      logLocal('Updated SOS status', `Alert #${id} -> ${status}`);
    } catch {
      pushToast('Unable to update SOS status right now.', 'danger');
    }
  };

  const removeAlert = async (id) => {
    try {
      await deleteSOSAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      pushToast(`SOS #${id} deleted.`, 'success');
      logLocal('Deleted SOS alert', `Alert #${id}`);
    } catch {
      pushToast('Unable to delete SOS alert right now.', 'danger');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      pushToast('User role updated.', 'success');
      logLocal('Updated user role', `User #${userId} -> ${role}`);
    } catch {
      pushToast('Unable to update role.', 'danger');
    }
  };

  const toggleUserActive = async (userId, active) => {
    try {
      await updateUserActive(userId, active);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active } : u)));
      pushToast(active ? 'Account activated.' : 'Account deactivated.', 'success');
      logLocal(active ? 'Activated account' : 'Deactivated account', `User #${userId}`);
    } catch {
      pushToast('Unable to update account status.', 'danger');
    }
  };

  const publishBroadcast = async () => {
    if (!broadcast.trim()) return;
    try {
      await sendBroadcast(broadcast.trim());
      setLatestBroadcast(broadcast.trim());
      pushToast('Emergency broadcast sent.', 'success');
      logLocal('Broadcast sent', broadcast.trim());
      setBroadcast('');
    } catch {
      pushToast('Could not send broadcast.', 'danger');
    }
  };

  const exportCsv = (filename, rows) => {
    if (!rows.length) {
      pushToast('No data to export.', 'warning');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')]
      .concat(rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => String(u.name || '').toLowerCase().includes(q) || String(u.email || '').toLowerCase().includes(q));
  }, [users, userQuery]);

  const filteredHospitals = useMemo(() => {
    const q = hospitalCityFilter.trim().toLowerCase();
    if (!q) return hospitals;
    return hospitals.filter((h) => String(h.city || '').toLowerCase().includes(q));
  }, [hospitals, hospitalCityFilter]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const statusOk = sosStatusFilter === 'ALL' || (a.status || 'OPEN') === sosStatusFilter;
      const dateOk = !sosDateFilter || String(a.createdAt || '').startsWith(sosDateFilter);
      return statusOk && dateOk;
    });
  }, [alerts, sosDateFilter, sosStatusFilter]);

  const userNameById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      map.set(Number(u.id), u.name || `User ${u.id}`);
    });
    return map;
  }, [users]);

  const selectedUserSos = useMemo(() => {
    if (!selectedUser?.id) return [];
    return alerts.filter((a) => Number(a.userId) === Number(selectedUser.id));
  }, [alerts, selectedUser]);

  const trend = useMemo(() => {
    const bucket = {};
    alerts.forEach((a) => {
      const d = String(a.createdAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
      bucket[d] = (bucket[d] || 0) + 1;
    });
    const keys = Object.keys(bucket).sort().slice(-7);
    return keys.map((k) => ({ day: k.slice(5), value: bucket[k] }));
  }, [alerts]);

  const maxTrendValue = useMemo(() => Math.max(...trend.map((x) => x.value), 1), [trend]);
  const sosMapQuery = useMemo(() => {
    const latestLocation = filteredAlerts
      .map((a) => String(a.location || '').trim())
      .find((loc) => loc && loc !== 'Location not provided');
    return latestLocation || 'Hyderabad emergency';
  }, [filteredAlerts]);

  const content = useMemo(() => {
    const mapUrlForLocation = (loc) => `https://maps.google.com/?q=${encodeURIComponent(loc || '')}`;

    if (active === 'users') {
      return (
        <div className='card card-soft p-3'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h5 className='mb-0'>Users & Permissions</h5>
            <div className='d-flex gap-2'>
              <input className='form-control form-control-sm' placeholder='Search name/email' value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
              <button className='btn btn-sm btn-outline-primary' onClick={() => exportCsv('users.csv', filteredUsers)}>Export Users</button>
            </div>
          </div>
          <div className='table-responsive'>
            <table className='table align-middle'>
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th /></tr></thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select className='form-select form-select-sm' value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                        {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.active === false ? 'text-bg-danger' : 'text-bg-success'}`}>{u.active === false ? 'Inactive' : 'Active'}</span>
                    </td>
                    <td>
                      <div className='d-flex gap-2'>
                        <button className='btn btn-sm btn-outline-secondary' onClick={() => setSelectedUser(u)}>View</button>
                        <button className='btn btn-sm btn-outline-danger' onClick={() => toggleUserActive(u.id, !(u.active === false))}>{u.active === false ? 'Activate' : 'Deactivate'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedUser && (
            <div className='mt-3 border rounded p-3'>
              <h6>User Profile: {selectedUser.name}</h6>
              <p className='mb-1'><strong>Email:</strong> {selectedUser.email}</p>
              <p className='mb-1'><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
              <p className='mb-1'><strong>Emergency Contact:</strong> {selectedUser.emergencyContact || 'N/A'}</p>
              <p className='mb-2'><strong>Last Login:</strong> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'N/A'}</p>
              <h6 className='mt-2'>SOS History</h6>
              {selectedUserSos.length === 0 && <p className='text-muted mb-1'>No SOS history.</p>}
              {selectedUserSos.slice(0, 5).map((x) => (
                <p key={x.id} className='mb-1 small'>#{x.id} - {x.status || 'OPEN'} - {x.location}</p>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (active === 'donors') {
      return (
        <div className='card card-soft p-3'>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h5 className='mb-0'>Donor Verification</h5>
            <button className='btn btn-sm btn-outline-primary' onClick={() => exportCsv('donors-report.csv', allDonors)}>Donor Report</button>
          </div>
          {pendingDonors.length === 0 && <p className='text-muted mb-0'>No pending donors.</p>}
          <div className='row g-2'>
            {pendingDonors.map((d) => (
              <div className='col-md-6' key={d.id}>
                <div className='border rounded p-2'>
                  <p className='mb-1 fw-semibold'>{d.name} ({d.bloodGroup})</p>
                  <p className='mb-2 text-muted'>{d.city}</p>
                  <button className='btn btn-sm btn-danger' onClick={() => verify(d.id)}>Verify</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (active === 'hospitals') {
      return (
        <div className='card card-soft p-3'>
          <h5>Hospital Management</h5>
          <form className='row g-2 mb-3' onSubmit={addHospitalEntry}>
            <div className='col-md-2'><input className='form-control' placeholder='Name' value={hospitalForm.name} onChange={(e) => setHospitalForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className='col-md-2'><input className='form-control' placeholder='City' value={hospitalForm.city} onChange={(e) => setHospitalForm((p) => ({ ...p, city: e.target.value }))} /></div>
            <div className='col-md-2'><input className='form-control' placeholder='Address' value={hospitalForm.address} onChange={(e) => setHospitalForm((p) => ({ ...p, address: e.target.value }))} /></div>
            <div className='col-md-3'><input className='form-control' placeholder='Location (coords or area)' value={hospitalForm.location} onChange={(e) => setHospitalForm((p) => ({ ...p, location: e.target.value }))} /></div>
            <div className='col-md-2'><input className='form-control' placeholder='Phone' value={hospitalForm.phone} onChange={(e) => setHospitalForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            <div className='col-md-1 d-grid'><button className='btn btn-danger'>{editingHospitalId ? 'Update' : 'Add'}</button></div>
            {editingHospitalId && (
              <div className='col-md-2 d-grid'>
                <button type='button' className='btn btn-outline-secondary' onClick={cancelEditHospital}>Cancel Edit</button>
              </div>
            )}
          </form>

          <div className='d-flex justify-content-between align-items-center mb-2'>
            <input className='form-control form-control-sm' style={{ maxWidth: 240 }} placeholder='Filter by city' value={hospitalCityFilter} onChange={(e) => setHospitalCityFilter(e.target.value)} />
            <button className='btn btn-sm btn-outline-primary' onClick={() => exportCsv('hospitals.csv', filteredHospitals)}>Export Hospitals</button>
          </div>

          <div className='table-responsive'>
            <table className='table align-middle'>
              <thead><tr><th>Name</th><th>City</th><th>Location</th><th>Contact</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredHospitals.map((h) => (
                  <tr key={h.id}>
                    <td>{h.name}</td>
                    <td>{h.city}</td>
                    <td>{h.location || `${h.latitude ?? ''}${h.latitude != null && h.longitude != null ? ', ' : ''}${h.longitude ?? ''}` || 'N/A'}</td>
                    <td>{h.phone || 'N/A'}</td>
                    <td>
                      <div className='d-flex gap-2'>
                        <button className='btn btn-sm btn-outline-primary' onClick={() => startEditHospital(h)}>Edit</button>
                        <button className='btn btn-sm btn-outline-danger' onClick={() => deleteHospitalEntry(h.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className='card card-soft p-3'>
        <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2'>
          <h5 className='mb-0'>SOS Monitoring</h5>
          <div className='d-flex gap-2 align-items-center'>
            <select className='form-select form-select-sm' value={sosStatusFilter} onChange={(e) => setSosStatusFilter(e.target.value)}>
              <option value='ALL'>All Statuses</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type='date' className='form-control form-control-sm' value={sosDateFilter} onChange={(e) => setSosDateFilter(e.target.value)} />
            <button className='btn btn-sm btn-outline-primary' onClick={() => exportCsv('sos-logs.csv', filteredAlerts)}>Export SOS Logs</button>
          </div>
        </div>

        <div className='table-responsive'>
          <table className='table align-middle'>
            <thead><tr><th>Alert ID</th><th>User</th><th>Location</th><th>Status</th><th>Time</th><th>Action</th></tr></thead>
            <tbody>
              {filteredAlerts.map((a) => (
                <tr key={a.id} className={highlightAlertId === a.id ? 'table-danger anim-float' : ''}>
                  <td>#{a.id}</td>
                  <td>
                    {a.userId != null
                      ? `${userNameById.get(Number(a.userId)) || `User ${a.userId}`} (#${a.userId})`
                      : 'Guest SOS'}
                  </td>
                  <td>
                    <div className='d-grid gap-1'>
                      <span>{a.location || 'Location not provided'}</span>
                      {a.location && a.location !== 'Location not provided' && (
                        <a
                          href={mapUrlForLocation(a.location)}
                          target='_blank'
                          rel='noreferrer'
                          className='small text-decoration-none'
                        >
                          View Map
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <select className='form-select form-select-sm' value={a.status || 'OPEN'} onChange={(e) => changeAlertStatus(a.id, e.target.value)}>
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>{new Date(a.createdAt).toLocaleString()}</td>
                  <td>
                    <button className='btn btn-sm btn-outline-danger' onClick={() => removeAlert(a.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='mt-3'>
          <h6>SOS Map View (Live Alerts)</h6>
          <div className='ratio ratio-16x9 rounded overflow-hidden border'>
            <iframe
              title='SOS map'
              src={`https://maps.google.com/maps?q=${encodeURIComponent(sosMapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            />
          </div>
          <small className='text-muted d-block mt-2'>Centered on latest SOS location from current filtered alerts.</small>
        </div>
      </div>
    );
  }, [
    active, alerts, allDonors, filteredAlerts, filteredHospitals, filteredUsers, highlightAlertId,
    hospitalCityFilter, hospitalForm, pendingDonors, selectedUser, selectedUserSos, sosDateFilter,
    sosStatusFilter, sosMapQuery, userNameById, userQuery
  ]);

  if (loading) {
    return <Loader label='Loading admin dashboard...' />;
  }

  return (
    <div className='container py-4'>
      <h2 className='mb-3'>Admin Dashboard</h2>

      <div className='row g-3 mb-3'>
        <div className='col-md-4 col-lg-2'><div className='card card-soft p-3'><small className='text-muted'>Total Users</small><h4 className='mb-0'>{summary.totalUsers}</h4></div></div>
        <div className='col-md-4 col-lg-2'><div className='card card-soft p-3'><small className='text-muted'>Active Donors</small><h4 className='mb-0'>{summary.activeDonors}</h4></div></div>
        <div className='col-md-4 col-lg-2'><div className='card card-soft p-3'><small className='text-muted'>Hospitals</small><h4 className='mb-0'>{summary.hospitalsRegistered}</h4></div></div>
        <div className='col-md-6 col-lg-3'><div className='card card-soft p-3'><small className='text-muted'>SOS Requests Today</small><h4 className='mb-0'>{summary.sosToday}</h4></div></div>
        <div className='col-md-6 col-lg-3'><div className='card card-soft p-3'><small className='text-muted'>Pending Verification</small><h4 className='mb-0'>{summary.pendingVerifications}</h4></div></div>
      </div>

      <div className='row g-3 mb-3'>
        <div className='col-lg-6'>
          <div className='card card-soft p-3 h-100'>
            <h6>Emergency Broadcast</h6>
            <textarea className='form-control mb-2' rows='2' placeholder='Blood needed O+ at XYZ Hospital' value={broadcast} onChange={(e) => setBroadcast(e.target.value)} />
            <button className='btn btn-danger btn-sm' onClick={publishBroadcast}>Send Broadcast</button>
            {latestBroadcast && <p className='small mt-2 mb-0'><strong>Latest:</strong> {latestBroadcast}</p>}
          </div>
        </div>
        <div className='col-lg-6'>
          <div className='card card-soft p-3 h-100'>
            <h6>Trends (SOS / day)</h6>
            {trend.length ? (
              <div className='mini-chart-wrap'>
                <div className='mini-chart'>
                  {trend.map((t) => {
                    const barHeight = Math.max(14, Math.round((t.value / maxTrendValue) * 100));
                    return (
                      <div key={t.day} className='chart-col' title={`${t.day}: ${t.value}`}>
                        <div className='bar' style={{ height: `${barHeight}%` }} />
                        <small className='chart-label'>{t.day}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <p className='small text-muted'>No trend data</p>}
            <small className='text-muted'>Emergency alerts counter: {alerts.length}</small>
          </div>
        </div>
      </div>

      <div className='row g-3'>
        <div className='col-lg-3'>
          <AdminSidebar active={active} onChange={setActive} />
        </div>
        <div className='col-lg-9'>
          {content}

          <div className='card card-soft p-3 mt-3'>
            <h6>Activity Log / Audit Trail</h6>
            {activityLog.length === 0 && <p className='text-muted mb-0'>No actions logged yet.</p>}
            {activityLog.slice(0, 8).map((x, idx) => (
              <div key={`${x.time}-${idx}`} className='activity-item mb-1'>
                <small className='text-muted'>{new Date(x.time).toLocaleString()}</small>
                <p className='mb-0 small'><strong>{x.action}</strong> - {x.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
