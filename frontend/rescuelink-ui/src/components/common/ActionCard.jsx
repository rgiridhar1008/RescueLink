import { Link } from 'react-router-dom';

function ActionCard({ title, description, to, variant = 'outline-danger', icon }) {
  return (
    <div className='card card-soft p-3 h-100'>
      <div className='d-flex justify-content-between align-items-start mb-2'>
        <h5 className='mb-0'>{title}</h5>
        {icon && <span className='badge text-bg-light'>{icon}</span>}
      </div>
      <p className='text-muted flex-grow-1'>{description}</p>
      <Link to={to} className={`btn btn-${variant}`} aria-label={`Open ${title}`}>
        Open
      </Link>
    </div>
  );
}

export default ActionCard;
