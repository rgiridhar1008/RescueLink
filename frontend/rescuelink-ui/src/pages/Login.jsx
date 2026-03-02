import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { forgotPassword, loginUser } from '../api/auth.api';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastProvider';

function Login() {
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [forgotForm, setForgotForm] = useState({ email: '', newPassword: '' });
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { pushToast } = useToast();

  const submit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const data = await loginUser({ email: form.email, password: form.password });

      const payload = {
        token: data.token || '',
        user: {
          id: data.id || data.user?.id,
          name: data.name || data.user?.name || 'User',
          email: data.email || data.user?.email || form.email,
          phone: data.phone || data.user?.phone || '',
          bloodGroup: data.bloodGroup || data.user?.bloodGroup || '',
          emergencyContact: data.emergencyContact || data.user?.emergencyContact || '',
          role: data.role || data.user?.role || 'USER'
        }
      };

      login(payload, form.rememberMe);
      pushToast('Login successful', 'success');

      const fromPath = location.state?.from;
      const defaultPath = payload.user.role === 'ADMIN' ? '/admin' : '/dashboard';
      navigate(fromPath || defaultPath, { replace: true });
    } catch (error) {
      pushToast(error?.response?.data?.error || 'Invalid credentials', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (forgotForm.newPassword.length < 8) {
      pushToast('New password must be at least 8 characters.', 'danger');
      return;
    }
    try {
      setResetting(true);
      await forgotPassword(forgotForm);
      pushToast('Password reset successful. Please login.', 'success');
      setShowForgot(false);
      setForm((prev) => ({ ...prev, email: forgotForm.email }));
      setForgotForm({ email: '', newPassword: '' });
    } catch (error) {
      pushToast(error?.response?.data?.error || 'Password reset failed', 'danger');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className='container py-5'>
      <div className='row justify-content-center'>
        <div className='col-12 col-md-8 col-lg-5'>
          <div className='card card-soft p-4'>
            <h3 className='mb-1'>Welcome Back</h3>
            <p className='text-muted mb-4'>Login to continue emergency tracking and requests.</p>

            <form onSubmit={submit}>
              <label className='form-label'>Email / Username</label>
              <input
                className='form-control mb-3'
                type='text'
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                aria-label='Email or username'
                required
              />

              <label className='form-label'>Password</label>
              <input
                className='form-control mb-3'
                type='password'
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                aria-label='Password'
                required
              />

              <div className='d-flex justify-content-between align-items-center mb-3'>
                <div className='form-check'>
                  <input
                    className='form-check-input'
                    type='checkbox'
                    id='rememberMe'
                    checked={form.rememberMe}
                    onChange={(e) => setForm((prev) => ({ ...prev, rememberMe: e.target.checked }))}
                  />
                  <label className='form-check-label' htmlFor='rememberMe'>Remember me</label>
                </div>
                <button
                  type='button'
                  className='btn btn-link p-0 small text-decoration-none'
                  onClick={() => setShowForgot((prev) => !prev)}
                >
                  Forgot password?
                </button>
              </div>

              <button className='btn btn-danger w-100' type='submit' disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            {showForgot && (
              <form onSubmit={resetPassword} className='mt-3 border-top pt-3'>
                <h6 className='mb-2'>Reset Password</h6>
                <input
                  className='form-control mb-2'
                  type='email'
                  placeholder='Registered email'
                  value={forgotForm.email}
                  onChange={(e) => setForgotForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                <input
                  className='form-control mb-2'
                  type='password'
                  placeholder='New password'
                  value={forgotForm.newPassword}
                  onChange={(e) => setForgotForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
                <button className='btn btn-outline-danger w-100' type='submit' disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            {loading && <Loader label='Authenticating...' />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
