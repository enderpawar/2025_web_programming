import React, { useState } from 'react';
import { api } from '../api.js';

const AuthModal = ({ open, onClose, onAuthed }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      let resp;
      if (mode === 'signup') resp = await api.signup({ email, password, name });
      else resp = await api.login({ email, password });
      onAuthed(resp.user);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f2135] rounded-xl border border-white/10 p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">{mode === 'signup' ? 'Sign Up' : 'Log In'}</h3>
        <div className="space-y-3">
          {mode === 'signup' && (
            <input className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10" placeholder="Name"
                   value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10" placeholder="Email" type="email"
                 value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full bg-white/5 rounded-lg px-3 py-2 outline-none border border-white/10" placeholder="Password" type="password"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="text-red-400 text-sm mt-3">{error}</div>}
        <div className="mt-5 flex items-center justify-between">
          <button className="text-white/70 hover:text-white" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
            {mode === 'signup' ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20" onClick={onClose}>Cancel</button>
            <button className="px-3 py-2 rounded-md bg-teal-500 hover:bg-teal-400 text-black font-semibold" disabled={loading} onClick={submit}>
              {loading ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
