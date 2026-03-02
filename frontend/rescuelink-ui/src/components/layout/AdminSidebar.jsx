const links = [
  { id: 'users', label: 'Users' },
  { id: 'donors', label: 'Donor Verification' },
  { id: 'hospitals', label: 'Hospital Management' },
  { id: 'sos', label: 'SOS Monitor' }
];

function AdminSidebar({ active, onChange }) {
  return (
    <aside className='card card-soft p-3 admin-sidebar'>
      <h6 className='text-uppercase text-muted mb-3'>Admin</h6>
      <div className='d-grid gap-2'>
        {links.map((item) => (
          <button
            key={item.id}
            className={`btn ${active === item.id ? 'btn-danger' : 'btn-outline-secondary'} text-start`}
            onClick={() => onChange(item.id)}
            aria-label={`Open ${item.label}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

export default AdminSidebar;
