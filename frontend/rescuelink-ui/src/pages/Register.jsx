import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth.api';
import { useToast } from '../components/common/ToastProvider';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  city: '',
  password: '',
  bloodGroup: '',
  emergencyContact: ''
};

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function Register() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Valid email required';
    if (!/^\d{10}$/.test(form.phone)) next.phone = 'Enter 10 digit phone';
    if (!form.city.trim()) next.city = 'City is required';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (!form.bloodGroup) next.bloodGroup = 'Select blood group';
    if (!/^\d{10}$/.test(form.emergencyContact)) next.emergencyContact = 'Emergency contact must be 10 digits';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      await registerUser(form);
      pushToast('Registration successful. Please login.', 'success');
      navigate('/login');
    } catch (error) {
      pushToast(error?.response?.data?.error || 'Registration failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='container py-5'>
      <div className='row justify-content-center'>
        <div className='col-12 col-md-10 col-lg-7'>
          <div className='card card-soft p-4 p-lg-5'>
            <h3 className='mb-1'>Create Account</h3>
            <p className='text-muted mb-4'>Set up your emergency profile in under 2 minutes.</p>

            <form onSubmit={submit} noValidate>
              <div className='row g-3'>
                <div className='col-md-6'>
                  <label className='form-label'>Name</label>
                  <input className='form-control' value={form.name} onChange={(e) => update('name', e.target.value)} aria-label='Name' />
                  {errors.name && <small className='text-danger'>{errors.name}</small>}
                </div>
                <div className='col-md-6'>
                  <label className='form-label'>Email</label>
                  <input type='email' className='form-control' value={form.email} onChange={(e) => update('email', e.target.value)} aria-label='Email' />
                  {errors.email && <small className='text-danger'>{errors.email}</small>}
                </div>
                <div className='col-md-6'>
                  <label className='form-label'>Phone</label>
                  <input className='form-control' value={form.phone} onChange={(e) => update('phone', e.target.value)} aria-label='Phone' />
                  {errors.phone && <small className='text-danger'>{errors.phone}</small>}
                </div>
                <div className='col-md-6'>
                  <label className='form-label'>City</label>
                  <input className='form-control' value={form.city} onChange={(e) => update('city', e.target.value)} aria-label='City' />
                  {errors.city && <small className='text-danger'>{errors.city}</small>}
                </div>
                <div className='col-md-6'>
                  <label className='form-label'>Blood Group</label>
                  <select className='form-select' value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)} aria-label='Blood Group'>
                    <option value=''>Select group</option>
                    {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
                  {errors.bloodGroup && <small className='text-danger'>{errors.bloodGroup}</small>}
                </div>
                <div className='col-md-6'>
                  <label className='form-label'>Password</label>
                  <input type='password' className='form-control' value={form.password} onChange={(e) => update('password', e.target.value)} aria-label='Password' />
                  <div className='progress mt-2' style={{ height: 6 }}>
                    <div className={`progress-bar ${strength >= 3 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${(strength / 4) * 100}%` }} />
                  </div>
                  <small className='text-muted'>Password strength: {['Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'][strength]}</small>
                  {errors.password && <small className='d-block text-danger'>{errors.password}</small>}
                </div>
                <div className='col-md-6'>
                  <label className='form-label'>Emergency Contact</label>
                  <input className='form-control' value={form.emergencyContact} onChange={(e) => update('emergencyContact', e.target.value)} aria-label='Emergency Contact' />
                  {errors.emergencyContact && <small className='text-danger'>{errors.emergencyContact}</small>}
                </div>
              </div>

              <button className='btn btn-danger w-100 mt-4' type='submit' disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className='text-center mt-3 mb-0'>Already registered? <Link to='/login'>Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
