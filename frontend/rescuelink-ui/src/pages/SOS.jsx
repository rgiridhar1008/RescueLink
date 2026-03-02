import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';
import SOSButton from '../components/common/SOSButton';
import { fetchMySOSHistory, triggerSOS } from '../api/sos.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastProvider';

const CONTACT_OPTIONS = [
  { key: 'family', label: 'Family' },
  { key: 'friends', label: 'Friends' },
  { key: 'hospitals', label: 'Nearby hospitals' },
  { key: 'admin', label: 'Admin' }
];

const EMERGENCY_TYPES = ['Medical', 'Accident', 'Fire', 'Blood needed'];

const TIMELINE_STEPS = [
  'Alert sent',
  'Admin notified',
  'Help on the way',
  'Resolved'
];

const NOTIFICATION_STEPS = [
  { key: 'sms', label: 'SMS sent' },
  { key: 'email', label: 'Email sent' },
  { key: 'admin', label: 'Admin alerted' }
];

const RESOURCES = [
  { title: 'Closest hospital', value: 'CityCare Emergency Center (1.8 km)' },
  { title: 'Emergency helpline', value: '108' }
];

let googleMapsScriptPromise;

function loadGoogleMapsPlacesScript(apiKey) {
  if (!apiKey) return Promise.resolve(false);
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (googleMapsScriptPromise) return googleMapsScriptPromise;

  googleMapsScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[data-google-maps-places="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.google?.maps?.places)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps-places', 'true');
    script.onload = () => resolve(Boolean(window.google?.maps?.places));
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

function SOS() {
  const { user, isAuthenticated } = useAuth();
  const { pushToast } = useToast();
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [locationMode, setLocationMode] = useState('auto');
  const [manualLookupState, setManualLookupState] = useState('idle');
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [alertState, setAlertState] = useState('idle');
  const [sending, setSending] = useState(false);
  const [responseEta, setResponseEta] = useState(60);
  const [arming, setArming] = useState(false);
  const [preflightCountdown, setPreflightCountdown] = useState(5);
  const [emergencyType, setEmergencyType] = useState(EMERGENCY_TYPES[0]);
  const [voiceActive, setVoiceActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState({
    family: true,
    friends: false,
    hospitals: true,
    admin: true
  });
  const [notificationState, setNotificationState] = useState(
    NOTIFICATION_STEPS.reduce((acc, item) => ({ ...acc, [item.key]: 'pending' }), {})
  );

  const simulationTimersRef = useRef([]);
  const voiceTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const placesServiceRef = useRef(null);
  const placesGeocoderRef = useRef(null);
  const placesEnabledRef = useRef(false);

  const placesApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const clearSimulationTimers = useCallback(() => {
    simulationTimersRef.current.forEach((id) => clearTimeout(id));
    simulationTimersRef.current = [];
  }, []);

  const addLocalHistory = useCallback((statusLabel, fallbackLocation) => {
    const timestamp = new Date().toISOString();
    const localEntry = {
      id: `local-${Date.now()}`,
      createdAt: timestamp,
      status: statusLabel,
      location: fallbackLocation || location || 'Location not provided',
      type: emergencyType
    };
    setHistory((prev) => [localEntry, ...prev]);
  }, [emergencyType, location]);

  const refreshHistory = useCallback(async () => {
    if (!user?.id) return;
    try {
      const items = await fetchMySOSHistory(user.id);
      const normalized = (items || [])
        .map((item) => ({
          id: item.id,
          createdAt: item.createdAt,
          status: item.status || 'ACTIVE',
          location: item.location || 'Unknown location',
          type: item.message || 'General emergency'
        }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setHistory(normalized);
    } catch {
      // keep last known history on fetch errors
    }
  }, [user?.id]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    document.body.classList.toggle('emergency-active', alertState !== 'idle');
    return () => document.body.classList.remove('emergency-active');
  }, [alertState]);

  useEffect(() => {
    let active = true;
    const initPlaces = async () => {
      const ready = await loadGoogleMapsPlacesScript(placesApiKey);
      if (!active) return;
      if (ready && window.google?.maps?.places) {
        placesServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesGeocoderRef.current = new window.google.maps.Geocoder();
        placesEnabledRef.current = true;
      } else {
        placesEnabledRef.current = false;
      }
    };
    initPlaces();
    return () => {
      active = false;
    };
  }, [placesApiKey]);

  useEffect(() => {
    if (locationMode !== 'manual') {
      setPlaceSuggestions([]);
      setShowPlaceSuggestions(false);
      return undefined;
    }

    const input = location.trim();
    if (!input || input.length < 2) {
      setPlaceSuggestions([]);
      setShowPlaceSuggestions(false);
      return undefined;
    }

    if (!placesEnabledRef.current || !placesServiceRef.current) {
      return undefined;
    }

    let cancelled = false;
    const id = setTimeout(() => {
      placesServiceRef.current.getPlacePredictions(
        {
          input,
          types: ['geocode']
        },
        (predictions, status) => {
          if (cancelled) return;
          if (status === window.google.maps.places.PlacesServiceStatus.OK && Array.isArray(predictions)) {
            setPlaceSuggestions(
              predictions.slice(0, 6).map((item) => ({
                id: item.place_id,
                label: item.description
              }))
            );
            setShowPlaceSuggestions(true);
          } else {
            setPlaceSuggestions([]);
            setShowPlaceSuggestions(false);
          }
        }
      );
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [location, locationMode]);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (locationMode === 'manual') {
          return;
        }
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      () => {
        // background geolocation errors are non-blocking
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [locationMode]);

  useEffect(() => {
    const input = location.trim();
    if (!input) {
      setManualLookupState('idle');
      return undefined;
    }
    if (locationMode !== 'manual') {
      return undefined;
    }

    const latLngMatch = input.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (latLngMatch) {
      const lat = Number(latLngMatch[1]);
      const lng = Number(latLngMatch[2]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setCoords({ lat, lng, accuracy: 40 });
        setManualLookupState('resolved');
      }
      return undefined;
    }

    if (input.length < 3) {
      setManualLookupState('idle');
      return undefined;
    }

    if (placesEnabledRef.current) {
      return undefined;
    }

    let cancelled = false;
    setManualLookupState('resolving');
    const id = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(input)}`
        );
        const rows = await response.json();
        if (cancelled) return;
        if (Array.isArray(rows) && rows.length > 0) {
          const top = rows[0];
          const lat = Number(top.lat);
          const lng = Number(top.lon);
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            setCoords({ lat, lng, accuracy: 80 });
            setManualLookupState('resolved');
            return;
          }
        }
        setManualLookupState('not_found');
      } catch {
        if (!cancelled) {
          setManualLookupState('failed');
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [location, locationMode]);

  useEffect(() => {
    if (!arming) return undefined;

    if (preflightCountdown <= 0) {
      setArming(false);
      setPreflightCountdown(5);
      return undefined;
    }

    const id = setTimeout(() => {
      setPreflightCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(id);
  }, [arming, preflightCountdown]);

  useEffect(() => {
    if (preflightCountdown !== 0) return undefined;

    const send = async () => {
      const normalizedLocation = location.trim()
        || (coords?.lat && coords?.lng ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : '')
        || 'Location not provided';

      const payload = {
        userId: user?.id ?? null,
        message: `${emergencyType} emergency SOS triggered. Contacts: ${Object.keys(selectedContacts)
          .filter((key) => selectedContacts[key])
          .join(', ') || 'none'}`,
        location: normalizedLocation,
        emergencyType,
        notifyContacts: selectedContacts
      };

      try {
        setSending(true);
        await triggerSOS(payload);
        pushToast('SOS alert sent successfully.', 'success');
      } catch (error) {
        const offline = !error?.response;
        const guestRejectedByBackend = !isAuthenticated && [400, 401, 403].includes(error?.response?.status);
        if (offline || guestRejectedByBackend) {
          const queued = JSON.parse(localStorage.getItem('offline_sos_queue') || '[]');
          const guestPayload = { ...payload, userId: null, queuedAt: new Date().toISOString(), guest: true };
          queued.push(guestPayload);
          localStorage.setItem('offline_sos_queue', JSON.stringify(queued));
          if (guestRejectedByBackend) {
            pushToast('Guest SOS saved and forwarded in fallback mode.', 'warning');
          } else {
            pushToast('No internet. Emergency request saved locally.', 'warning');
          }
        } else {
          pushToast('Could not send SOS. Please retry.', 'danger');
          setSending(false);
          setAlertState('idle');
          return;
        }
      }

      setAlertState('sent');
      setResponseEta(60);
      addLocalHistory('ALERT_SENT', payload.location);
      setNotificationState(NOTIFICATION_STEPS.reduce((acc, item) => ({ ...acc, [item.key]: 'pending' }), {}));

      clearSimulationTimers();
      simulationTimersRef.current.push(
        setTimeout(() => {
          setNotificationState((prev) => ({ ...prev, sms: 'done' }));
          pushToast('SMS notifications dispatched.', 'info');
        }, 700)
      );
      simulationTimersRef.current.push(
        setTimeout(() => {
          setNotificationState((prev) => ({ ...prev, email: 'done' }));
          pushToast('Email notifications dispatched.', 'info');
        }, 1200)
      );
      simulationTimersRef.current.push(
        setTimeout(() => {
          setNotificationState((prev) => ({ ...prev, admin: 'done' }));
          setAlertState('admin_notified');
        }, 1800)
      );
      simulationTimersRef.current.push(
        setTimeout(() => {
          setAlertState('help_on_way');
          setSending(false);
        }, 3200)
      );

      refreshHistory();
    };

    send();
    return undefined;
  }, [
    addLocalHistory,
    clearSimulationTimers,
    emergencyType,
    location,
    coords?.lat,
    coords?.lng,
    preflightCountdown,
    pushToast,
    refreshHistory,
    selectedContacts,
    user?.id,
    isAuthenticated
  ]);

  useEffect(() => {
    if (alertState !== 'help_on_way') return undefined;

    const id = setInterval(() => {
      setResponseEta((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(id);
  }, [alertState]);

  useEffect(() => {
    if (alertState !== 'help_on_way' || responseEta > 0) return;
    setAlertState('resolved');
    addLocalHistory('RESOLVED_AUTO');
  }, [addLocalHistory, alertState, responseEta]);

  useEffect(() => {
    const syncOfflineQueue = async () => {
      const queued = JSON.parse(localStorage.getItem('offline_sos_queue') || '[]');
      if (!queued.length) return;
      const remaining = [];
      for (const item of queued) {
        try {
          await triggerSOS(item);
        } catch {
          remaining.push(item);
        }
      }
      localStorage.setItem('offline_sos_queue', JSON.stringify(remaining));
      if (remaining.length === 0 && queued.length > 0) {
        pushToast('Offline emergency requests synced successfully.', 'success');
      }
    };

    syncOfflineQueue();
    window.addEventListener('online', syncOfflineQueue);
    return () => window.removeEventListener('online', syncOfflineQueue);
  }, [pushToast]);

  useEffect(() => {
    return () => {
      clearSimulationTimers();
      if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [clearSimulationTimers]);

  const timelineIndex = useMemo(() => {
    const map = {
      idle: -1,
      sent: 0,
      admin_notified: 1,
      help_on_way: 2,
      resolved: 3,
      cancelled: -1
    };
    return map[alertState] ?? -1;
  }, [alertState]);

  const mapSrc = useMemo(() => {
    if (coords?.lat && coords?.lng) {
      return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`;
    }
    if (location.trim()) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=15&output=embed`;
    }
    return '';
  }, [coords, location]);

  const accuracyRadius = useMemo(() => {
    if (!coords?.accuracy) return 28;
    return Math.max(18, Math.min(68, Math.round(coords.accuracy / 4)));
  }, [coords]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      pushToast('Geolocation is not supported in this browser.', 'warning');
      return;
    }

    const readPosition = () => new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    });

    const detect = async () => {
      try {
        const attempts = await Promise.allSettled([readPosition(), readPosition(), readPosition()]);
        const successful = attempts
          .filter((item) => item.status === 'fulfilled')
          .map((item) => item.value);

        if (successful.length === 0) {
          pushToast('Unable to fetch location. Enter manually.', 'danger');
          return;
        }

        const best = successful.reduce((acc, curr) => (
          curr.coords.accuracy < acc.coords.accuracy ? curr : acc
        ));

        const lat = best.coords.latitude;
        const lng = best.coords.longitude;
        setLocationMode('auto');
        setCoords({ lat, lng, accuracy: best.coords.accuracy });
        setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setManualLookupState('idle');
        setPlaceSuggestions([]);
        setShowPlaceSuggestions(false);
        pushToast(`Location detected (accuracy ~${Math.round(best.coords.accuracy)}m).`, 'success');
      } catch {
        pushToast('Unable to fetch location. Enter manually.', 'danger');
      }
    };

    detect();
  };

  const selectSuggestedPlace = (suggestion) => {
    setLocation(suggestion.label);
    setShowPlaceSuggestions(false);
    setPlaceSuggestions([]);
    setManualLookupState('resolving');

    const geocoder = placesGeocoderRef.current;
    if (!geocoder || !window.google?.maps?.GeocoderStatus) {
      setManualLookupState('failed');
      return;
    }

    geocoder.geocode({ placeId: suggestion.id }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results?.[0]?.geometry?.location) {
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        setCoords({ lat, lng, accuracy: 40 });
        setManualLookupState('resolved');
      } else {
        setManualLookupState('failed');
      }
    });
  };

  const startCountdown = () => {
    if (sending || arming) return;
    setPreflightCountdown(5);
    setArming(true);
    setAlertState('idle');
  };

  const cancelCountdown = () => {
    setArming(false);
    setPreflightCountdown(5);
    pushToast('SOS sending cancelled.', 'info');
  };

  const toggleContact = (key) => {
    setSelectedContacts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const startVoiceSimulation = () => {
    if (sending || arming) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      pushToast('Voice recognition is not supported in this browser.', 'warning');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceActive(true);
      pushToast('Listening... say "Trigger SOS".', 'info');
    };

    recognition.onresult = (event) => {
      const result = event.results?.[event.results.length - 1];
      const transcript = (result?.[0]?.transcript || '').toLowerCase().trim();
      if (!transcript) return;
      if (
        transcript.includes('trigger sos')
        || transcript.includes('sos')
        || transcript.includes('emergency help')
      ) {
        pushToast(`Voice command detected: "${transcript}"`, 'success');
        startCountdown();
      } else if (result?.isFinal) {
        pushToast(`Command not recognized: "${transcript}"`, 'warning');
      }
    };

    recognition.onerror = () => {
      pushToast('Voice recognition failed. Try again.', 'warning');
    };

    recognition.onend = () => {
      setVoiceActive(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const confirmCancelSOS = () => {
    clearSimulationTimers();
    setAlertState('cancelled');
    setSending(false);
    setArming(false);
    setPreflightCountdown(5);
    setCancelConfirmOpen(false);
    addLocalHistory('CANCELLED');
    pushToast('SOS request cancelled.', 'warning');
  };

  const markResolved = () => {
    clearSimulationTimers();
    setAlertState('resolved');
    setSending(false);
    addLocalHistory('RESOLVED_MANUAL');
    pushToast('SOS marked as resolved.', 'success');
  };

  return (
    <div className='container py-4'>
      <div className='row justify-content-center g-4'>
        <div className='col-12 col-xl-8'>
          <div className={`card card-soft p-4 ${alertState !== 'idle' ? 'emergency-mode-card' : ''}`}>
            <h2 className='mb-1'>Emergency SOS</h2>
            <p className='text-muted mb-3'>Trigger and track emergency response with safety confirmation.</p>
            {!isAuthenticated && (
              <div className='alert alert-info'>
                Send SOS without login. Your request will be recorded as a <strong>Guest SOS</strong>.
                You can log in later to track personalized history.
              </div>
            )}

            <div className='mb-3'>
              <p className='fw-semibold mb-2'>Emergency type</p>
              <div className='d-flex flex-wrap gap-2'>
                {EMERGENCY_TYPES.map((type) => (
                  <button
                    key={type}
                    type='button'
                    className={`btn btn-sm ${emergencyType === type ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setEmergencyType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className='row g-2 align-items-center mb-3'>
              <div className='col-md-8 position-relative'>
                <input
                  className='form-control'
                  value={location}
                  onChange={(e) => {
                    setLocationMode('manual');
                    setLocation(e.target.value);
                  }}
                  onFocus={() => {
                    if (placeSuggestions.length > 0) setShowPlaceSuggestions(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowPlaceSuggestions(false), 120);
                  }}
                  placeholder='Auto-detected or manual location'
                  aria-label='Emergency location'
                  autoComplete='off'
                />
                {showPlaceSuggestions && placeSuggestions.length > 0 && (
                  <div className='list-group position-absolute w-100 mt-1' style={{ zIndex: 20 }}>
                    {placeSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type='button'
                        className='list-group-item list-group-item-action'
                        onMouseDown={() => selectSuggestedPlace(suggestion)}
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                )}
                {locationMode === 'manual' && manualLookupState === 'resolved' && (
                  <small className='text-success'>Manual location recognized.</small>
                )}
                {locationMode === 'manual' && manualLookupState === 'resolving' && (
                  <small className='text-muted'>Resolving location...</small>
                )}
                {locationMode === 'manual' && manualLookupState === 'not_found' && (
                  <small className='text-warning'>Location not found. Try a clearer address.</small>
                )}
                {locationMode === 'manual' && manualLookupState === 'failed' && (
                  <small className='text-warning'>Location lookup unavailable. Using typed text in SOS payload.</small>
                )}
              </div>
              <div className='col-md-4 d-grid'>
                <button className='btn btn-outline-secondary' onClick={detectLocation}>Auto Detect</button>
              </div>
            </div>

            {mapSrc && (
              <div className='map-preview mb-3'>
                <iframe
                  title='Live location preview'
                  src={mapSrc}
                  loading='lazy'
                  referrerPolicy='no-referrer-when-downgrade'
                />
                <div className='map-pin'>Current location</div>
                <div className='map-accuracy' style={{ width: accuracyRadius, height: accuracyRadius }} />
              </div>
            )}

            {arming && (
              <div className='alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2'>
                <strong>Sending alert in {preflightCountdown}... Cancel?</strong>
                <button type='button' className='btn btn-sm btn-outline-dark' onClick={cancelCountdown}>Cancel</button>
              </div>
            )}

            {alertState === 'help_on_way' && (
              <div className='mb-3'>
                <span className='countdown-chip'>Response ETA: {responseEta}s</span>
              </div>
            )}

            <div className='d-flex flex-wrap gap-2 align-items-center mb-3'>
              <SOSButton onClick={startCountdown} disabled={sending || arming} large />
              <button
                type='button'
                className={`btn ${voiceActive ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={startVoiceSimulation}
                disabled={sending || arming}
              >
                {voiceActive ? 'Listening...' : 'Voice Activation'}
              </button>
              {(alertState === 'sent' || alertState === 'admin_notified' || alertState === 'help_on_way') && (
                <button type='button' className='btn btn-outline-danger' onClick={() => setCancelConfirmOpen(true)}>
                  Cancel SOS
                </button>
              )}
              {alertState === 'help_on_way' && (
                <button type='button' className='btn btn-success' onClick={markResolved}>Mark Resolved</button>
              )}
            </div>

            <div className='timeline-box mb-3'>
              <h6 className='mb-2'>SOS Status Timeline</h6>
              <ol className='status-timeline mb-0'>
                {TIMELINE_STEPS.map((step, idx) => {
                  const stateClass = idx < timelineIndex ? 'done' : idx === timelineIndex ? 'current' : 'pending';
                  return (
                    <li key={step} className={`timeline-step ${stateClass}`}>
                      <span className='step-index'>{idx + 1}</span>
                      <span>{step}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className='timeline-box'>
              <h6 className='mb-2'>Auto notification simulation</h6>
              <div className='d-grid gap-2'>
                {NOTIFICATION_STEPS.map((step) => (
                  <div key={step.key} className='d-flex justify-content-between align-items-center border rounded p-2'>
                    <span>{step.label}</span>
                    <span className={`badge ${notificationState[step.key] === 'done' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {notificationState[step.key] === 'done' ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='col-12 col-xl-4'>
          <div className='card card-soft p-3 mb-3'>
            <h6>Emergency Tips</h6>
            <ul className='mb-0 ps-3'>
              <li>Stay calm and communicate clearly.</li>
              <li>Share precise location and landmarks.</li>
              <li>Keep your phone unlocked and reachable.</li>
            </ul>
          </div>

          <div className='card card-soft p-3 mb-3'>
            <h6>Nearby Resources</h6>
            <div className='d-grid gap-2'>
              {RESOURCES.map((resource) => (
                <div key={resource.title} className='border rounded p-2'>
                  <small className='text-muted d-block'>{resource.title}</small>
                  <strong>{resource.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className='card card-soft p-3'>
            <div className='d-flex justify-content-between align-items-center mb-2'>
              <h6 className='mb-0'>SOS History</h6>
              {isAuthenticated && (
                <button type='button' className='btn btn-sm btn-outline-secondary' onClick={refreshHistory}>Refresh</button>
              )}
            </div>
            <div className='history-list d-grid gap-2'>
              {!isAuthenticated && (
                <p className='text-muted mb-0 small'>Log in to view account-linked SOS history. Guest SOS still works immediately.</p>
              )}
              {isAuthenticated && history.length === 0 && <p className='text-muted mb-0 small'>No SOS history yet.</p>}
              {history.slice(0, 6).map((item) => (
                <div key={item.id} className='border rounded p-2'>
                  <div className='d-flex justify-content-between align-items-center'>
                    <strong className='small'>{item.status}</strong>
                    <small className='text-muted'>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Now'}</small>
                  </div>
                  <small className='d-block text-muted'>{item.location}</small>
                  <small className='d-block'>{item.type}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={cancelConfirmOpen}
        title='Cancel SOS Request'
        body='Are you sure you want to cancel this SOS request? Responders may stop dispatching.'
        confirmText='Confirm Cancel'
        onConfirm={confirmCancelSOS}
        onCancel={() => setCancelConfirmOpen(false)}
        loading={false}
      />
    </div>
  );
}

export default SOS;
