import { Link } from 'react-router-dom';
import HospitalCard from '../components/cards/HospitalCard';
import { useAuth } from '../context/AuthContext';
import rescueLinkLogo from '../components/layout/RescueLink_Logo_Cropped.png';

const previewHospitals = [
  { id: 1, name: 'CityCare Emergency Center', address: 'MG Road', city: 'Hyderabad', phone: '+91 98XXXX1200', distance: 1.8 },
  { id: 2, name: 'Apollo Community Hospital', address: 'Banjara Hills', city: 'Hyderabad', phone: '+91 98XXXX9900', distance: 3.2 },
  { id: 3, name: 'LifeLine Trauma Clinic', address: 'KPHB', city: 'Hyderabad', phone: '+91 98XXXX5511', distance: 4.5 }
];

function Home() {
  const { isAuthenticated } = useAuth();
  const tips = [
    'Keep emergency contacts updated in Profile.',
    'Enable location for faster SOS response.',
    'Use blood group filter to find matching donors quickly.'
  ];

  return (
    <div>
      <section className='hero-section py-5'>
        <div className='container py-lg-5'>
          <div className='row align-items-center g-4'>
            <div className='col-lg-7'>
              <span className='badge text-bg-light mb-3'>Smart Emergency Response Platform</span>
              <h1 className='display-5 fw-bold text-white'>RescueLink: Smart Emergency Help & Resource Locator</h1>
              <p className='lead text-white-50 mt-3'>Trigger SOS, locate nearby hospitals, and request blood donors with a fast, accessible workflow.</p>
              <div className='d-flex flex-wrap gap-2 mt-4'>
                <Link className='btn btn-danger btn-lg' to='/sos'>SOS Alert</Link>
                <Link className='btn btn-light btn-lg' to='/hospitals'>Find Hospitals</Link>
                <Link className='btn btn-outline-light btn-lg' to='/donors'>Search Donors</Link>
              </div>
            </div>
            {!isAuthenticated && (
              <div className='col-lg-5'>
                <div className='card card-soft p-4'>
                  <img
                    src={rescueLinkLogo}
                    alt='RescueLink logo'
                    className='home-logo mb-3'
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <h5 className='mb-3'>Get Started</h5>
                  <p className='text-muted mb-4'>Create an account to save emergency contacts and history.</p>
                  <div className='d-grid gap-2'>
                    <Link className='btn btn-danger' to='/register'>Register</Link>
                    <Link className='btn btn-outline-danger' to='/login'>Login</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className='container py-4'>
        <div className='row g-3'>
          <div className='col-md-4'>
            <div className='card card-soft p-3 stat-tile'>
              <p className='text-muted mb-1'>Connected Hospitals</p>
              <h3>120+</h3>
            </div>
          </div>
          <div className='col-md-4'>
            <div className='card card-soft p-3 stat-tile'>
              <p className='text-muted mb-1'>Verified Donors</p>
              <h3>860+</h3>
            </div>
          </div>
          <div className='col-md-4'>
            <div className='card card-soft p-3 stat-tile'>
              <p className='text-muted mb-1'>SOS Avg Response</p>
              <h3>42s</h3>
            </div>
          </div>
        </div>
      </section>

      <section className='container pb-4 how-steps'>
        <h3 className='mb-3'>How It Works</h3>
        <div className='row g-3'>
          <div className='col-md-4'>
            <div className='card card-soft p-3 step'>
              <h6>1. Trigger SOS</h6>
              <p className='text-muted mb-0'>Tap SOS and share live location instantly.</p>
            </div>
          </div>
          <div className='col-md-4'>
            <div className='card card-soft p-3 step'>
              <h6>2. Auto Dispatch</h6>
              <p className='text-muted mb-0'>Nearby hospitals and admins are notified.</p>
            </div>
          </div>
          <div className='col-md-4'>
            <div className='card card-soft p-3 step'>
              <h6>3. Track Response</h6>
              <p className='text-muted mb-0'>Follow timeline updates until assistance arrives.</p>
            </div>
          </div>
        </div>
      </section>

      <section className='container py-5'>
        <div className='d-flex justify-content-between align-items-center mb-3'>
          <h3 className='mb-0'>Nearby Hospitals</h3>
          <Link to='/hospitals' className='btn btn-sm btn-outline-danger'>View All</Link>
        </div>
        <div className='row g-3'>
          {previewHospitals.map((hospital) => (
            <div key={hospital.id} className='col-12 col-md-6 col-lg-4'>
              <HospitalCard hospital={hospital} />
            </div>
          ))}
        </div>
      </section>

      <section className='container pb-5'>
        <div className='card card-soft p-4'>
          <h4 className='mb-3'>Quick Emergency Guide</h4>
          <div className='row g-3'>
            {tips.map((tip) => (
              <div key={tip} className='col-md-4'>
                <div className='p-3 rounded-3 border h-100'>
                  <p className='mb-0'>{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
