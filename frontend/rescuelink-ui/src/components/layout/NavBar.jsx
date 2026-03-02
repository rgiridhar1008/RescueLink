import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminAlerts, fetchMySOSHistory } from '../../api/sos.api';
import rescueLinkLogo from './RescueLink_Logo_Cropped.png';

function NavBar() {
  const { isAuthenticated, role, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    const loadNotifications = async ({ markRead } = { markRead: false }) => {
      try {
        setNotifLoading(true);
        const rawItems = role === 'ADMIN'
          ? await fetchAdminAlerts()
          : await fetchMySOSHistory(user.id);
        const items = role === 'ADMIN'
          ? (Array.isArray(rawItems) ? rawItems : [])
          : (Array.isArray(rawItems) ? rawItems.filter((item) => Number(item.userId) === Number(user.id)) : []);

        const normalized = (items || []).slice(0, 6).map((item) => ({
          id: item.id,
          title: role === 'ADMIN' ? 'New SOS Alert' : 'SOS Status Update',
          message: role === 'ADMIN'
            ? `Alert from user ${item.userId ?? 'Guest'} at ${item.location || 'Unknown location'}`
            : `Status: ${item.status || 'ACTIVE'} at ${item.location || 'Unknown location'}`,
          createdAt: item.createdAt
        }));
        setNotifications(normalized);
        if (!markRead) {
          setUnreadCount(normalized.length);
        }
      } catch {
        // keep silent; bell should not break navigation
      } finally {
        setNotifLoading(false);
      }
    };

    loadNotifications();
    const id = setInterval(() => {
      if (!notifOpen) {
        loadNotifications();
      }
    }, 10000);

    return () => clearInterval(id);
  }, [isAuthenticated, notifOpen, role, user?.id]);

  const toggleNotifications = async () => {
    const nextOpen = !notifOpen;
    setNotifOpen(nextOpen);
    if (nextOpen) {
      setUnreadCount(0);
      try {
        setNotifLoading(true);
        const rawItems = role === 'ADMIN'
          ? await fetchAdminAlerts()
          : await fetchMySOSHistory(user?.id);
        const items = role === 'ADMIN'
          ? (Array.isArray(rawItems) ? rawItems : [])
          : (Array.isArray(rawItems) ? rawItems.filter((item) => Number(item.userId) === Number(user?.id)) : []);
        const normalized = (items || []).slice(0, 6).map((item) => ({
          id: item.id,
          title: role === 'ADMIN' ? 'New SOS Alert' : 'SOS Status Update',
          message: role === 'ADMIN'
            ? `Alert from user ${item.userId ?? 'Guest'} at ${item.location || 'Unknown location'}`
            : `Status: ${item.status || 'ACTIVE'} at ${item.location || 'Unknown location'}`,
          createdAt: item.createdAt
        }));
        setNotifications(normalized);
      } catch {
        // keep previously loaded notifications
      } finally {
        setNotifLoading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={`navbar navbar-expand-lg navbar-light sticky-top bg-white border-bottom ${scrolled ? 'nav-scrolled' : 'shadow-sm'}`}>
      <div className='container'>
        <Link className='navbar-brand fw-bold text-danger' to='/'>
          <span className='d-flex align-items-center'>
            <img
              src={rescueLinkLogo}
              alt='RescueLink logo'
              className='brand-logo'
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </span>
        </Link>

        <button
          className='navbar-toggler'
          type='button'
          aria-controls='mainNav'
          aria-expanded={navOpen}
          aria-label='Toggle navigation'
          onClick={() => setNavOpen((prev) => !prev)}
        >
          <span className='navbar-toggler-icon' />
        </button>

        <div className={`navbar-collapse mt-2 mt-lg-0 collapse ${navOpen ? 'show' : ''}`} id='mainNav'>
          <div className='navbar-nav ms-auto align-items-lg-center gap-lg-2 mobile-nav'>
            <NavLink className='nav-link' to='/' onClick={() => setNavOpen(false)}>Home</NavLink>
            <NavLink className='nav-link' to='/hospitals' onClick={() => setNavOpen(false)}>Hospitals</NavLink>
            <NavLink className='nav-link' to='/donors' onClick={() => setNavOpen(false)}>Donors</NavLink>
            <NavLink className='nav-link' to='/broadcast' onClick={() => setNavOpen(false)}>Broadcast</NavLink>
            <NavLink className='nav-link' to='/about' onClick={() => setNavOpen(false)}>About</NavLink>

            {isAuthenticated ? (
              <>
                <NavLink className='nav-link' to={role === 'ADMIN' ? '/admin' : '/dashboard'} onClick={() => setNavOpen(false)}>
                  Dashboard
                </NavLink>
                <div className='position-relative d-inline-block' ref={notifRef}>
                  <button
                    type='button'
                    className='btn btn-sm btn-outline-secondary notif-btn'
                    aria-label='Notifications'
                    onClick={toggleNotifications}
                  >
                    <svg width='16' height='16' viewBox='0 0 16 16' aria-hidden='true'>
                      <path
                        d='M8 1a3 3 0 0 0-3 3v1.4c0 .6-.2 1.2-.6 1.7L3 9v1h10V9l-1.4-1.9a3 3 0 0 1-.6-1.7V4a3 3 0 0 0-3-3zM6 11a2 2 0 0 0 4 0H6z'
                        fill='currentColor'
                      />
                    </svg>
                  </button>
                  {unreadCount > 0 && (
                    <span className='position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger'>
                      {unreadCount}
                    </span>
                  )}
                  {notifOpen && (
                    <div className='position-absolute end-0 mt-2 card card-soft p-2 nav-notif-popover' style={{ minWidth: 320, zIndex: 1081 }}>
                      <p className='fw-semibold mb-2'>Notifications</p>
                      {notifLoading && <p className='small text-muted mb-0'>Loading...</p>}
                      {!notifLoading && notifications.length === 0 && (
                        <p className='small text-muted mb-0'>No notifications yet.</p>
                      )}
                      {!notifLoading && notifications.length > 0 && (
                        <div className='d-grid gap-2'>
                          {notifications.map((item) => (
                            <div key={item.id} className='border rounded p-2'>
                              <p className='mb-1 fw-semibold small'>{item.title}</p>
                              <p className='mb-1 small'>{item.message}</p>
                              <small className='text-muted'>
                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                              </small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type='button'
                  className={`theme-toggle ${darkMode ? 'is-dark' : ''}`}
                  onClick={() => setDarkMode((prev) => !prev)}
                  aria-label='Toggle dark mode'
                >
                  <span className='theme-toggle-thumb' aria-hidden='true'>
                    {darkMode ? (
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
                        <path d='M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z' fill='currentColor' />
                      </svg>
                    ) : (
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
                        <circle cx='12' cy='12' r='5' fill='currentColor' />
                        <path d='M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                      </svg>
                    )}
                  </span>
                </button>
                <div className='position-relative'>
                  <button className='btn btn-outline-secondary btn-sm rounded-pill' onClick={() => setMenuOpen((prev) => !prev)}>
                    {user?.name?.split(' ')[0] || 'User'}
                  </button>
                  {menuOpen && (
                    <div className='position-absolute end-0 mt-2 card card-soft p-2 nav-user-menu' style={{ minWidth: 180, zIndex: 1081 }}>
                      <NavLink className='dropdown-item' to='/profile' onClick={() => setMenuOpen(false)}>Profile</NavLink>
                      <button className='dropdown-item text-danger' onClick={handleLogout}>Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  type='button'
                  className={`theme-toggle ${darkMode ? 'is-dark' : ''}`}
                  onClick={() => setDarkMode((prev) => !prev)}
                  aria-label='Toggle dark mode'
                >
                  <span className='theme-toggle-thumb' aria-hidden='true'>
                    {darkMode ? (
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
                        <path d='M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z' fill='currentColor' />
                      </svg>
                    ) : (
                      <svg width='14' height='14' viewBox='0 0 24 24' fill='none'>
                        <circle cx='12' cy='12' r='5' fill='currentColor' />
                        <path d='M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                      </svg>
                    )}
                  </span>
                </button>
                <NavLink className='btn btn-outline-danger btn-sm' to='/login' onClick={() => setNavOpen(false)}>Login</NavLink>
                <NavLink className='btn btn-danger btn-sm' to='/register' onClick={() => setNavOpen(false)}>Register</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
