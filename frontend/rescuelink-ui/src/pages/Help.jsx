import { useMemo } from 'react';

function Help() {
  const emergencyNumbers = useMemo(() => [
    { name: 'National Emergency', number: '112' },
    { name: 'Ambulance', number: '108' },
    { name: 'Police', number: '100' },
    { name: 'Fire', number: '101' }
  ], []);

  return (
    <div className='container py-4'>
      <div className='card card-soft p-4 mb-3'>
        <h2>About RescueLink</h2>
        <p className='mb-0'>
          RescueLink is a smart emergency coordination platform that helps users trigger SOS alerts,
          connect with nearby hospitals and donors, and track response updates quickly.
        </p>
      </div>

      <div className='row g-3'>
        <div className='col-lg-6'>
          <div className='card card-soft p-3 h-100'>
            <h5>How SOS Works</h5>
            <ol className='mb-0'>
              <li>Open SOS and share your location.</li>
              <li>Confirm alert with a countdown to avoid accidental triggers.</li>
              <li>Admins and responders get notified instantly.</li>
              <li>Track status from alert sent to resolution.</li>
            </ol>
          </div>
        </div>
        <div className='col-lg-6'>
          <div className='card card-soft p-3 h-100'>
            <h5>Emergency Tips / Safety Guide</h5>
            <ul className='mb-0'>
              <li><strong>In an accident:</strong> move to a safe area, call for help, avoid crowding.</li>
              <li><strong>CPR basics:</strong> call emergency services, 100-120 chest compressions/minute, keep airway open.</li>
              <li><strong>Bleeding:</strong> apply firm direct pressure with clean cloth.</li>
              <li><strong>Stay connected:</strong> keep phone charged and location services enabled.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className='card card-soft p-3 mt-3'>
        <h5>Emergency Numbers</h5>
        <div className='row g-2'>
          {emergencyNumbers.map((item) => (
            <div key={item.number} className='col-12 col-md-6 col-lg-3'>
              <a className='d-block border rounded p-3 text-decoration-none text-reset' href={`tel:${item.number}`}>
                <small className='text-muted d-block'>{item.name}</small>
                <strong>{item.number}</strong>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Help;
