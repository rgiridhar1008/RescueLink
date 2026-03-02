function ToastMessage({ message, type = 'success' }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type} mt-3`} role="alert">
      {message}
    </div>
  );
}

export default ToastMessage;
