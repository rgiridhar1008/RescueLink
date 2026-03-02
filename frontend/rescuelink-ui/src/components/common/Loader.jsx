function Loader({ label = 'Loading...' }) {
  return (
    <div className='d-flex justify-content-center align-items-center py-4' role='status' aria-live='polite'>
      <div className='spinner-border text-danger me-2' />
      <span className='text-muted'>{label}</span>
    </div>
  );
}

export default Loader;
