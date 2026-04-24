import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (mode === 'register' && !name)) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { email, password, name };

    try {
      const response = await fetch(`https://mediwise-backend-production.up.railway.app${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `${mode === 'login' ? 'Login' : 'Registration'} failed`);
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
      
      toast.success(mode === 'login' ? 'Successfully logged in!' : 'Account created successfully!');
      onClose();
      
      // Reset state
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="card" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '2.5rem', margin: '1rem', zIndex: 1001, textAlign: 'center' }}
        >
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-tertiary)' }}>
            <X size={24} />
          </button>
          
          <div style={{ marginBottom: '2rem' }}>
            <Activity size={48} color="var(--primary)" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {mode === 'login' ? 'Sign in to access your cabinet.' : 'Join MediWise to save your medicines.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'register' && (
              <div className="input-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Full Name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <div className="input-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                className="input-field" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="input-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                className="input-field" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Activity size={20}/></motion.div> : (mode === 'login' ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setEmail(''); setPassword(''); setName(''); }}
              style={{ color: 'var(--primary)', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
