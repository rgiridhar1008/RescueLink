function SOSButton({ onClick, disabled = false, large = false }) {
  return (
    <button
      type='button'
      className={`btn btn-danger ${large ? 'btn-lg px-5 py-3 rounded-pill emergency-pulse' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label='Trigger emergency SOS alert'
    >
      {disabled ? 'Sending...' : 'TRIGGER SOS'}
    </button>
  );
}

export default SOSButton;
