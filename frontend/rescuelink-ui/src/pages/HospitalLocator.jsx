import { useEffect, useMemo, useState } from 'react';
import { fetchHospitals } from '../api/hospitals.api';
import HospitalCard from '../components/cards/HospitalCard';
import ErrorState from '../components/common/ErrorState';
import SkeletonCard from '../components/common/SkeletonCard';

const sampleHospitals = [
  { id: 1, name: 'CityCare ER', address: 'Madhapur Main Rd', city: 'Hyderabad', phone: '040-2800-1001', latitude: 17.4486, longitude: 78.3908, emergencyRating: 4.7, emergencyAvailable: true },
  { id: 2, name: 'Global Health Hospital', address: 'Banjara Hills', city: 'Hyderabad', phone: '040-2800-1002', latitude: 17.4120, longitude: 78.4293, emergencyRating: 4.5, emergencyAvailable: true },
  { id: 3, name: 'Apollo Clinic', address: 'Gachibowli', city: 'Hyderabad', phone: '040-2800-1003', latitude: 17.4401, longitude: 78.3489, emergencyRating: 4.3, emergencyAvailable: false },
  { id: 4, name: 'Lifeline Trauma Center', address: 'Kukatpally', city: 'Hyderabad', phone: '040-2800-1004', latitude: 17.4948, longitude: 78.3996, emergencyRating: 4.6, emergencyAvailable: true },
  { id: 5, name: 'Care 24x7', address: 'Ameerpet', city: 'Hyderabad', phone: '040-2800-1005', latitude: 17.4375, longitude: 78.4482, emergencyRating: 4.1, emergencyAvailable: true },
  { id: 6, name: 'Community MedPoint', address: 'Hitech City', city: 'Hyderabad', phone: '040-2800-1006', latitude: 17.4504, longitude: 78.3816, emergencyRating: 3.9, emergencyAvailable: false }
];

const pageSize = 4;

function HospitalLocator() {
  const [city, setCity] = useState('');
  const [query, setQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState(25);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [userCoords, setUserCoords] = useState(null);
  const [liveTracking, setLiveTracking] = useState(false);
  const [onlyErOpen, setOnlyErOpen] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [showMap, setShowMap] = useState(true);

  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const data = await fetchHospitals({ city: city || undefined });
      setItems(data.length ? data : sampleHospitals);
      setError('');
    } catch {
      setItems(sampleHospitals);
      setError('Live hospital data unavailable. Showing demo data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    if (!liveTracking || !navigator.geolocation) return undefined;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        setLiveTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 12000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [liveTracking]);

  const detectNow = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    });
  };

  const filtered = useMemo(() => {
    return items
      .filter((h) => !city || (h.city || '').toLowerCase().includes(city.toLowerCase()))
      .filter((h) => !query || (h.name || '').toLowerCase().includes(query.toLowerCase()))
      .map((h) => {
        let distance = Number(h.distance || 0);
        if (userCoords && h.latitude && h.longitude) {
          distance = haversineKm(userCoords.latitude, userCoords.longitude, Number(h.latitude), Number(h.longitude));
        }
        return { ...h, distance: Number(distance.toFixed(1)) };
      })
      .filter((h) => Number(h.distance || 0) <= maxDistance)
      .filter((h) => !onlyErOpen || h.emergencyAvailable)
      .filter((h) => Number(h.emergencyRating || 0) >= minRating)
      .sort((a, b) => {
        const availabilityScoreA = a.emergencyAvailable ? 1 : 0;
        const availabilityScoreB = b.emergencyAvailable ? 1 : 0;
        if (availabilityScoreA !== availabilityScoreB) return availabilityScoreB - availabilityScoreA;
        const distanceA = Number.isFinite(a.distance) ? a.distance : 999;
        const distanceB = Number.isFinite(b.distance) ? b.distance : 999;
        if (distanceA !== distanceB) return distanceA - distanceB;
        const ratingA = a.emergencyRating || 0;
        const ratingB = b.emergencyRating || 0;
        return ratingB - ratingA;
      });
  }, [items, city, maxDistance, minRating, onlyErOpen, query, userCoords]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [city, query, maxDistance]);

  return (
    <div className='container py-4'>
      <h2 className='mb-3'>Hospital Locator</h2>
      <div className='card card-soft p-3 mb-3 admin-sidebar'>
        <div className='row g-2'>
          <div className='col-md-4'>
            <input className='form-control' placeholder='Search hospital name' value={query} onChange={(e) => setQuery(e.target.value)} aria-label='Search hospital' />
          </div>
          <div className='col-md-3'>
            <input className='form-control' placeholder='City filter' value={city} onChange={(e) => setCity(e.target.value)} aria-label='Filter by city' />
          </div>
          <div className='col-md-3'>
            <label className='form-label small mb-1'>Distance: {maxDistance} km</label>
            <input type='range' className='form-range' min='1' max='50' value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} aria-label='Maximum distance' />
          </div>
          <div className='col-md-2 d-grid'>
            <button className='btn btn-danger' onClick={loadHospitals}>Refresh</button>
          </div>
          <div className='col-md-2 d-grid'>
            <button className='btn btn-outline-secondary' onClick={detectNow}>Use GPS</button>
          </div>
          <div className='col-md-2 d-grid'>
            <button className='btn btn-outline-secondary' onClick={() => setLiveTracking((prev) => !prev)}>
              {liveTracking ? 'Stop Live' : 'Live Track'}
            </button>
          </div>
          <div className='col-md-2'>
            <label className='form-label small mb-1'>Min Rating</label>
            <select className='form-select' value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
              <option value={0}>All</option>
              <option value={3}>3+</option>
              <option value={4}>4+</option>
              <option value={4.5}>4.5+</option>
            </select>
          </div>
          <div className='col-md-2 d-flex align-items-end'>
            <div className='form-check mb-2'>
              <input className='form-check-input' type='checkbox' id='erOnly' checked={onlyErOpen} onChange={(e) => setOnlyErOpen(e.target.checked)} />
              <label className='form-check-label' htmlFor='erOnly'>ER Open Only</label>
            </div>
          </div>
          <div className='col-md-2 d-grid'>
            <button className='btn btn-outline-primary' onClick={() => setShowMap((prev) => !prev)}>
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>
        </div>
        {userCoords && (
          <p className='small text-muted mb-0 mt-2'>
            Your location: {userCoords.latitude.toFixed(5)}, {userCoords.longitude.toFixed(5)}
          </p>
        )}
      </div>

      {loading && (
        <div className='row g-3 mb-3'>
          {[1, 2, 3, 4].map((i) => (
            <div className='col-md-6' key={i}><SkeletonCard /></div>
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} />}

      {!loading && (
        <div className='row g-3'>
          {visible.map((hospital) => (
            <div className='col-12 col-md-6' key={hospital.id}>
              <HospitalCard hospital={hospital} />
            </div>
          ))}
          {!visible.length && <p className='text-muted'>No hospitals found with current filters.</p>}
        </div>
      )}

      {!loading && pages > 1 && (
        <div className='d-flex justify-content-center align-items-center gap-2 mt-3'>
          <button className='btn btn-outline-secondary btn-sm' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span className='small'>Page {page} of {pages}</span>
          <button className='btn btn-outline-secondary btn-sm' onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>Next</button>
        </div>
      )}

      {showMap && (
        <div className='ratio ratio-16x9 mt-4 card-soft overflow-hidden'>
          <iframe
            title='Hospital map preview'
            src={userCoords
              ? `https://maps.google.com/maps?q=${userCoords.latitude},${userCoords.longitude}%20hospitals&t=&z=12&ie=UTF8&iwloc=&output=embed`
              : 'https://maps.google.com/maps?q=Hyderabad%20hospitals&t=&z=11&ie=UTF8&iwloc=&output=embed'}
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

export default HospitalLocator;
