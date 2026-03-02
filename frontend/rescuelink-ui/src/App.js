import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import AppFooter from './components/layout/AppFooter';
import SOSButton from './components/common/SOSButton';
import ProtectedRoute from './components/routing/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SOS from './pages/SOS';
import HospitalLocator from './pages/HospitalLocator';
import DonorSearch from './pages/DonorSearch';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Broadcast from './pages/Broadcast';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/common/ToastProvider';
import { fetchAdminAlerts, fetchMySOSHistory } from './api/sos.api';
import { useLocation, useNavigate } from 'react-router-dom';

function App() {
  const { isAuthenticated, user, role } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const lastSeenIdRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      lastSeenIdRef.current = null;
      return undefined;
    }

    const loadNotifications = async () => {
      try {
        const rawItems = role === 'ADMIN'
          ? await fetchAdminAlerts()
          : await fetchMySOSHistory(user?.id);
        const items = role === 'ADMIN'
          ? (Array.isArray(rawItems) ? rawItems : [])
          : (Array.isArray(rawItems) ? rawItems.filter((item) => Number(item.userId) === Number(user?.id)) : []);
        if (items.length === 0) return;
        const latest = items[0];
        if (lastSeenIdRef.current === null) {
          lastSeenIdRef.current = latest.id;
          return;
        }
        if (latest.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = latest.id;
          pushToast(
            role === 'ADMIN'
              ? `New SOS alert received (#${latest.id}).`
              : `Your SOS status updated (${latest.status || 'ACTIVE'}).`,
            'info'
          );
        }
      } catch {
        // Silent failure for periodic polling
      }
    };

    loadNotifications();
    const id = setInterval(loadNotifications, 10000);
    return () => clearInterval(id);
  }, [isAuthenticated, pushToast, role, user?.id]);

  return (
    <>
      <NavBar />
      <main className='app-shell'>
        <div key={location.pathname} className='page-fade'>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />
            <Route path='/sos' element={<SOS />} />
            <Route path='/about' element={<Support />} />
            <Route path='/support' element={<Support />} />
            <Route path='/broadcast' element={<Broadcast />} />

            <Route element={<ProtectedRoute allowedRoles={['USER', 'ADMIN', 'MODERATOR', 'HOSPITAL_MANAGER']} />}>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/hospitals' element={<HospitalLocator />} />
              <Route path='/donors' element={<DonorSearch />} />
              <Route path='/profile' element={<Profile />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path='/admin' element={<AdminDashboard />} />
            </Route>

            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>
      </main>
      <AppFooter />
      {location.pathname !== '/sos' && (
        <div className='floating-sos-wrap'>
          <SOSButton onClick={() => navigate('/sos')} />
        </div>
      )}
    </>
  );
}

export default App;
