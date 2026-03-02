function HospitalCard({ hospital }) {
  const rating = hospital.emergencyRating ?? hospital.rating;
  const available = hospital.emergencyAvailable ?? true;

  return (
    <div className='card card-soft h-100 p-3'>
      <div className='d-flex justify-content-between align-items-start gap-2'>
        <h6 className='mb-2'>{hospital.name}</h6>
        <span className={`badge ${available ? 'text-bg-success' : 'text-bg-secondary'}`}>
          {available ? 'ER Open' : 'ER Busy'}
        </span>
      </div>
      <p className='text-muted mb-2'>{hospital.address}, {hospital.city}</p>
      {hospital.location && (
        <p className='mb-1'><strong>Location:</strong> {hospital.location}</p>
      )}
      <p className='mb-1'><strong>Contact:</strong> {hospital.phone || 'N/A'}</p>
      <p className='mb-0'><strong>Distance:</strong> {hospital.distance || '--'} km</p>
      <p className='mb-0'><strong>Emergency Rating:</strong> {rating ? Number(rating).toFixed(1) : '--'}/5</p>
      <div className='d-flex gap-2 mt-3'>
        <a className='btn btn-sm btn-outline-danger' href={`tel:${hospital.phone || ''}`}>
          📞 Call
        </a>
        <a
          className='btn btn-sm btn-outline-primary'
          href={`https://maps.google.com/?q=${encodeURIComponent(hospital.location || `${hospital.name} ${hospital.address || ''} ${hospital.city || ''}`)}`}
          target='_blank'
          rel='noreferrer'
        >
          🧭 Directions
        </a>
      </div>
    </div>
  );
}

export default HospitalCard;
