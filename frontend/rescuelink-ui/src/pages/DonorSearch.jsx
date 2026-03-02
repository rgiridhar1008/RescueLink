import { useEffect, useMemo, useState } from 'react';
import { cancelDonorBooking, fetchDonors, requestDonorBooking } from '../api/donors.api';
import DonorCard from '../components/cards/DonorCard';
import Loader from '../components/common/Loader';
import { useToast } from '../components/common/ToastProvider';
import { useAuth } from '../context/AuthContext';

const bloodGroups = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function DonorSearch() {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bloodGroup, setBloodGroup] = useState('ALL');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('ALL');
  const { pushToast } = useToast();

  const loadDonors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (bloodGroup !== 'ALL') params.bloodGroup = bloodGroup;
      if (location.trim()) params.city = location.trim();
      if (availability !== 'ALL') params.availability = availability;
      const data = await fetchDonors(params);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
      pushToast('Live donor list unavailable. Please try again.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonors();
  }, [bloodGroup, availability]);

  const filtered = useMemo(() => {
    return items
      .filter((d) => bloodGroup === 'ALL' || d.bloodGroup === bloodGroup)
      .filter((d) => !location || (d.city || '').toLowerCase().includes(location.toLowerCase()))
      .filter((d) => {
        if (availability === 'ALL') return true;
        const status = d.availability || (d.available === false ? 'NOT_AVAILABLE' : 'AVAILABLE');
        return status === availability;
      });
  }, [availability, bloodGroup, items, location]);

  const requestDonor = (donor) => {
    if (!isAuthenticated || !user?.id) {
      pushToast('Please login to request a donor.', 'warning');
      return;
    }
    const doRequest = async () => {
      try {
        await requestDonorBooking(donor.id, user.id);
        pushToast(`Donor booked successfully: ${donor.name}.`, 'success');
        loadDonors();
      } catch (error) {
        const msg = error?.response?.data?.error || 'Unable to request donor right now.';
        pushToast(msg, 'danger');
      }
    };
    doRequest();
  };

  const cancelDonorRequest = (donor) => {
    if (!isAuthenticated || !user?.id) {
      pushToast('Please login to cancel a donor request.', 'warning');
      return;
    }
    const confirmed = window.confirm(`Cancel request for ${donor.name}?`);
    if (!confirmed) return;
    const doCancel = async () => {
      try {
        await cancelDonorBooking(donor.id, user.id);
        pushToast(`Request cancelled for ${donor.name}.`, 'warning');
        loadDonors();
      } catch (error) {
        const msg = error?.response?.data?.error || 'Unable to cancel request right now.';
        pushToast(msg, 'danger');
      }
    };
    doCancel();
  };

  return (
    <div className='container py-4'>
      <h2 className='mb-3'>Blood Donor Search</h2>

      <div className='card card-soft p-3 mb-3'>
        <div className='row g-2'>
          <div className='col-md-4'>
            <label className='form-label mb-1'>Blood Group</label>
            <select className='form-select' value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} aria-label='Filter donor by blood group'>
              {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
          <div className='col-md-4'>
            <label className='form-label mb-1'>Location</label>
            <input className='form-control' placeholder='City' value={location} onChange={(e) => setLocation(e.target.value)} aria-label='Filter donor by location' />
          </div>
          <div className='col-md-2'>
            <label className='form-label mb-1'>Status</label>
            <select className='form-select' value={availability} onChange={(e) => setAvailability(e.target.value)} aria-label='Filter donor by availability'>
              <option value='ALL'>All</option>
              <option value='AVAILABLE'>Available</option>
              <option value='BUSY'>Busy</option>
              <option value='NOT_AVAILABLE'>Not Available</option>
            </select>
          </div>
          <div className='col-md-2 d-grid align-items-end'>
            <button className='btn btn-danger mt-md-4' onClick={loadDonors}>Refresh</button>
          </div>
        </div>
      </div>

      {loading && <Loader label='Loading donors...' />}

      {!loading && (
        <div className='row g-3'>
          {filtered.map((donor) => (
            <div key={donor.id} className='col-12 col-md-6 col-lg-4'>
              <DonorCard
                donor={donor}
                onRequest={() => requestDonor(donor)}
                onCancel={() => cancelDonorRequest(donor)}
                requested={Boolean(user?.id) && Number(donor.bookedByUserId) === Number(user.id)}
              />
            </div>
          ))}
          {!filtered.length && <p className='text-muted'>No donors found for selected filters.</p>}
        </div>
      )}
    </div>
  );
}

export default DonorSearch;
