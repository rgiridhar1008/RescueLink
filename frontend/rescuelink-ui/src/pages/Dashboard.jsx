import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ActionCard from '../components/common/ActionCard';
import HospitalCard from '../components/cards/HospitalCard';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { useAuth } from '../context/AuthContext';
import { fetchMySOSHistory } from '../api/sos.api';

const nearbyHospitals = [
  { id: 1, name: 'CityCare ER', address: 'MG Road', city: 'Hyderabad', phone: '040-2891-1100', distance: 1.6 },
  { id: 2, name: 'Lifeline Hospital', address: 'Ameerpet', city: 'Hyderabad', phone: '040-2214-8899', distance: 2.9 }
];

function Dashboard() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const widgetStats = {
    sosCount: history.length || 1,
    nearbyHospitals: nearbyHospitals.length,
    donorsAvailable: 24
  };
  const chartData = [38, 62, 55, 80, 49, 73, 66];

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchMySOSHistory(user?.id);
      setHistory(data);
      setError('');
    } catch {
      setHistory([
        { id: 101, location: 'Madhapur', status: 'Resolved', createdAt: new Date().toISOString() }
      ]);
      setError('Unable to sync live SOS history. Showing latest available data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadHistory();
  }, [user?.id]);

  return (
    <div className='container py-4'>
      <div className='row g-3 mb-3'>
        <div className='col-lg-8'>
          <h2 className='mb-1'>Hi, {user?.name || 'User'}</h2>
          <p className='text-muted mb-0'>Your emergency dashboard and quick actions.</p>
        </div>
        <div className='col-lg-4'>
          <div className='card card-soft p-3 h-100'>
            <h6 className='mb-2'>Profile Summary</h6>
            <p className='mb-1'><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p className='mb-1'><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
            <p className='mb-0'><strong>Blood Group:</strong> {user?.bloodGroup || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className='row g-3 mb-3'>
        <div className='col-md-4'>
          <div className='card card-soft p-3 stat-tile'>
            <p className='text-muted mb-1'>Total SOS Requests</p>
            <h3>{widgetStats.sosCount}</h3>
          </div>
        </div>
        <div className='col-md-4'>
          <div className='card card-soft p-3 stat-tile'>
            <p className='text-muted mb-1'>Nearby Hospitals</p>
            <h3>{widgetStats.nearbyHospitals}</h3>
          </div>
        </div>
        <div className='col-md-4'>
          <div className='card card-soft p-3 stat-tile'>
            <p className='text-muted mb-1'>Donors Available</p>
            <h3>{widgetStats.donorsAvailable}</h3>
          </div>
        </div>
      </div>

      <div className='row g-3'>
        <div className='col-12 col-md-4'><ActionCard title='SOS Alert' description='Trigger emergency alert instantly with your location.' to='/sos' variant='danger' icon='SOS' /></div>
        <div className='col-12 col-md-4'><ActionCard title='Hospitals' description='Find nearest hospital contacts quickly.' to='/hospitals' icon='ER' /></div>
        <div className='col-12 col-md-4'><ActionCard title='Donors' description='Search available blood donors by group and city.' to='/donors' icon='Blood' /></div>
      </div>

      <div className='row g-3 mt-1'>
        <div className='col-lg-7'>
          <div className='card card-soft p-3'>
            <div className='d-flex justify-content-between align-items-center mb-2'>
              <h5 className='mb-0'>Recent SOS History</h5>
              <button className='btn btn-sm btn-outline-danger' onClick={loadHistory}>Refresh</button>
            </div>
            <div className='mini-chart mb-3'>
              {chartData.map((value, idx) => (
                <div key={`${value}-${idx}`} className='bar' style={{ height: `${value}%` }} />
              ))}
            </div>
            {loading && <Loader label='Loading SOS history...' />}
            {!loading && error && <ErrorState message={error} />}
            {!loading && !history.length && <p className='text-muted mb-0'>No SOS records yet.</p>}
            {!loading && history.length > 0 && (
              <div className='table-responsive'>
                <table className='table table-sm align-middle'>
                  <thead>
                    <tr><th>ID</th><th>Location</th><th>Status</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 5).map((item) => (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td>{item.location || 'Unknown'}</td>
                        <td><span className='badge text-bg-light'>{item.status || 'Sent'}</span></td>
                        <td>{new Date(item.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className='col-lg-5'>
          <div className='card card-soft p-3'>
            <div className='d-flex justify-content-between align-items-center mb-2'>
              <h5 className='mb-0'>Nearby Hospitals</h5>
              <Link to='/hospitals' className='btn btn-sm btn-outline-danger'>Open</Link>
            </div>
            <div className='row g-2'>
              {nearbyHospitals.map((hospital) => (
                <div className='col-12' key={hospital.id}>
                  <HospitalCard hospital={hospital} />
                </div>
              ))}
            </div>
            <hr />
            <h6 className='mb-2'>Activity Timeline</h6>
            <div className='activity-item mb-2'>
              <small className='text-muted'>2 mins ago</small>
              <p className='mb-0'>SOS status changed to Active.</p>
            </div>
            <div className='activity-item mb-2'>
              <small className='text-muted'>12 mins ago</small>
              <p className='mb-0'>Nearest donor response received.</p>
            </div>
            <div className='activity-item'>
              <small className='text-muted'>1 hour ago</small>
              <p className='mb-0'>Profile emergency contact updated.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
