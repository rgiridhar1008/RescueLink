function DonorCard({ donor, onRequest, onCancel, requested = false }) {
  const availability = donor.availability || (donor.available === false ? 'NOT_AVAILABLE' : 'AVAILABLE');
  const available = availability === 'AVAILABLE';
  const bookedByOther = availability === 'BUSY' && !requested;
  const statusLabel = availability === 'BUSY' ? 'Busy' : available ? 'Available' : 'Not Available';
  const statusClass = availability === 'BUSY'
    ? 'status-busy'
    : available
      ? 'status-available'
      : 'status-unavailable';

  return (
    <div className='card card-soft h-100 p-3'>
      <div className='d-flex justify-content-between align-items-start'>
        <h6 className='mb-0'>{donor.name}</h6>
        <span className='badge text-bg-light border text-dark d-inline-flex align-items-center gap-2'>
          <span className={`status-dot ${statusClass}`} />
          {statusLabel}
        </span>
      </div>
      <div className='d-flex align-items-center gap-2 mt-2 mb-1 flex-wrap'>
        <span className='badge blood-badge'>{donor.bloodGroup}</span>
        <span className='badge distance-tag'>Location {donor.distance || '--'} km</span>
        {donor.verified && <span className='badge text-bg-success'>Verified</span>}
      </div>
      <p className='mb-1'><strong>Location:</strong> {donor.city || donor.location || 'N/A'}</p>
      <p className='mb-3'><strong>Phone:</strong> {donor.phone || 'N/A'}</p>
      {requested ? (
        <div className='d-grid gap-2'>
          <span className='badge text-bg-info'>Booked By You</span>
          <button className='btn btn-outline-secondary' onClick={() => onCancel?.(donor)}>
            Cancel Request
          </button>
          <a className='btn btn-danger mt-auto' href={`tel:${donor.phone || ''}`}>
            Contact Donor
          </a>
        </div>
      ) : (
        <button className='btn btn-outline-danger mt-auto' onClick={() => onRequest(donor)} disabled={!available}>
          {bookedByOther ? 'Already Booked' : 'Request Donor'}
        </button>
      )}
    </div>
  );
}

export default DonorCard;
