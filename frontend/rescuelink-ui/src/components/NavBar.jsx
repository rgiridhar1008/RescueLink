import { Link, useNavigate } from 'react-router-dom';

function NavBar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-danger">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">RescueLink</Link>
        <div className="d-flex gap-2">
          {user ? (
            <>
              <Link className="btn btn-light btn-sm" to="/dashboard">Dashboard</Link>
              <button className="btn btn-outline-light btn-sm" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-light btn-sm" to="/login">Login</Link>
              <Link className="btn btn-outline-light btn-sm" to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
