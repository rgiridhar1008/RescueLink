import { useMemo, useState } from 'react';
import { useToast } from '../components/common/ToastProvider';
import { submitSupportFeedback } from '../api/support.api';

function Support() {
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    type: 'ISSUE',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => form.email.trim() && form.subject.trim() && form.message.trim(),
    [form.email, form.message, form.subject]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      await submitSupportFeedback(form);
      pushToast('Support request submitted successfully.', 'success');
      setForm({ type: 'ISSUE', email: '', subject: '', message: '' });
    } catch (error) {
      const message = error?.response?.data?.error || error?.response?.data?.message || 'Unable to submit right now. Please try again.';
      pushToast(message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container py-4'>
      <div className='card card-soft p-4 mb-3'>
        <h2>About RescueLink</h2>
        <p>
          RescueLink is a smart emergency coordination platform that helps users trigger SOS alerts,
          connect with nearby hospitals and donors, and track response updates quickly.
        </p>
      </div>

      <div className='row g-3 mb-3'>
        <div className='col-lg-6'>
          <div className='card card-soft p-3 h-100'>
            <h4>How SOS Works</h4>
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
            <h4>Emergency Tips / Safety Guide</h4>
            <ul className='mb-0'>
              <li><strong>In an accident:</strong> move to a safe area, call for help, avoid crowding.</li>
              <li><strong>CPR basics:</strong> call emergency services, 100-120 chest compressions/minute, keep airway open.</li>
              <li><strong>Bleeding:</strong> apply firm direct pressure with clean cloth.</li>
              <li><strong>Stay connected:</strong> keep phone charged and location services enabled.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className='card card-soft p-3 mb-3'>
        <h3>Emergency Numbers</h3>
        <div className='row g-2'>
          <div className='col-12 col-md-6 col-lg-3'>
            <div className='border rounded p-3 h-100'>
              <small className='text-muted d-block'>National Emergency</small>
              <strong>112</strong>
            </div>
          </div>
          <div className='col-12 col-md-6 col-lg-3'>
            <div className='border rounded p-3 h-100'>
              <small className='text-muted d-block'>Ambulance</small>
              <strong>108</strong>
            </div>
          </div>
          <div className='col-12 col-md-6 col-lg-3'>
            <div className='border rounded p-3 h-100'>
              <small className='text-muted d-block'>Police</small>
              <strong>100</strong>
            </div>
          </div>
          <div className='col-12 col-md-6 col-lg-3'>
            <div className='border rounded p-3 h-100'>
              <small className='text-muted d-block'>Fire</small>
              <strong>101</strong>
            </div>
          </div>
        </div>
      </div>

      <div className='card card-soft p-4 mb-3'>
        <h3>Key Features</h3>
        <ul className='mb-0'>
          <li>One-tap SOS alert with location sharing</li>
          <li>Hospital and donor discovery</li>
          <li>Real-time status tracking</li>
          <li>Admin verification and monitoring</li>
          <li>Notifications and updates</li>
        </ul>
      </div>

      <div className='card card-soft p-4 mb-3'>
        <h3>Quick Start Guide</h3>
        <ol className='mb-0'>
          <li>Register or open the app.</li>
          <li>Tap the SOS button in an emergency.</li>
          <li>Share your location.</li>
          <li>Track updates in dashboard.</li>
        </ol>
      </div>

      <div className='card card-soft p-4 mb-3'>
        <h3>Privacy Notice</h3>
        <p className='mb-0'>
          RescueLink collects only essential information such as location and contact details to
          provide emergency assistance. Data is used solely for improving response coordination and
          is not shared with unauthorized parties.
        </p>
      </div>

      <div className='card card-soft p-4 mb-3'>
        <h3>Disclaimer</h3>
        <p className='mb-0'>
          RescueLink is a support platform designed to assist during emergencies and should not replace
          official emergency services. Users are advised to contact local emergency numbers for immediate
          life-threatening situations.
        </p>
      </div>

      <div className='card card-soft p-4'>
        <h2>Support / Contact</h2>
        <p className='text-muted'>Submit issues and feedback to improve RescueLink.</p>
        <form className='row g-3' onSubmit={submit}>
          <div className='col-md-4'>
            <label className='form-label'>Type</label>
            <select
              className='form-select'
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value='ISSUE'>Issue</option>
              <option value='FEEDBACK'>Feedback</option>
            </select>
          </div>
          <div className='col-md-8'>
            <label className='form-label'>Email</label>
            <input
              type='email'
              className='form-control'
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder='name@example.com'
            />
          </div>
          <div className='col-12'>
            <label className='form-label'>Subject</label>
            <input
              className='form-control'
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder='Short summary'
            />
          </div>
          <div className='col-12'>
            <label className='form-label'>Message</label>
            <textarea
              className='form-control'
              rows='5'
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder='Describe your issue or suggestion...'
            />
          </div>
          <div className='col-12 d-grid d-md-flex justify-content-md-end'>
            <button className='btn btn-danger' disabled={!canSubmit || loading}>
              {loading ? 'Submitting...' : 'Send'}
            </button>
          </div>
          <div className='col-12'>
            <p className='text-muted mb-0'>
              We value your feedback. Your suggestions help improve RescueLink and enhance emergency support services.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Support;
