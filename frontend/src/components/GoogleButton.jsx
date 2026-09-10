import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../api';

const GoogleButton = ({ onSuccess, onError, label = 'Continue with Google' }) => {
  const buttonRef = useRef(null);
  const [clientId, setClientId] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/auth/config`)
      .then((response) => response.json())
      .then((config) => { if (active) { setClientId(config.clientId || ''); setConfigLoaded(true); } })
      .catch(() => { if (active) { setClientId(''); setConfigLoaded(true); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!clientId || !buttonRef.current) return undefined;
    const render = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: (response) => onSuccess(response.credential) });
      window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large', width: 360, text: 'signin_with', shape: 'rectangular' });
    };
    if (window.google?.accounts?.id) render();
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = render;
      script.onerror = () => onError('Google sign-in could not load.');
      document.head.appendChild(script);
    }
    return undefined;
  }, [clientId, onError, onSuccess]);

  if (!configLoaded) return <div className="w-full border border-gray-200 px-4 py-3 text-center text-sm text-gray-400">Loading Google sign-in...</div>;
  if (!clientId) return <button type="button" onClick={() => onError('Google sign-in needs GOOGLE_CLIENT_ID configured on the backend.')} className="w-full border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50">{label}</button>;
  return <div ref={buttonRef} className="flex min-h-10 justify-center" />;
};

export default GoogleButton;
