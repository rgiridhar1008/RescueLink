function ConfirmModal({
  open,
  title,
  body,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false
}) {
  if (!open) return null;

  return (
    <>
      <div className='modal-backdrop fade show' />
      <div className='modal d-block' role='dialog' aria-modal='true' aria-labelledby='confirm-title'>
        <div className='modal-dialog modal-dialog-centered'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 id='confirm-title' className='modal-title'>{title}</h5>
              <button className='btn-close' aria-label='Close modal' onClick={onCancel} />
            </div>
            <div className='modal-body'>
              <p className='mb-0'>{body}</p>
            </div>
            <div className='modal-footer'>
              <button className='btn btn-outline-secondary' onClick={onCancel} disabled={loading}>{cancelText}</button>
              <button className='btn btn-danger' onClick={onConfirm} disabled={loading}>{loading ? 'Please wait...' : confirmText}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmModal;
