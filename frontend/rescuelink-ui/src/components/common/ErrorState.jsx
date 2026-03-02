function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className='card card-soft p-4 text-center'>
      <h5 className='text-danger mb-2'>Unable to load</h5>
      <p className='text-muted mb-3'>{message}</p>
      {onRetry && (
        <button type='button' className='btn btn-outline-danger' onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
