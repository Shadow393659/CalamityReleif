import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Radio, ShieldCheck } from 'lucide-react';
import { authenticate } from '../services/auth';

const destinationForRole = (role) => (
  role === 'admin' ? '/admin' : role === 'ngo' ? '/field-feed' : '/'
);

export default function LoginPage({ user, onAuthenticated }) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('citizen');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={destinationForRole(user.accessRole)} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const path = isRegistering ? 'register' : 'login';
      const credentials = isRegistering
        ? { name, email, password, role, organizationName }
        : { email, password, role };
      const auth = await authenticate(path, credentials);
      onAuthenticated(auth);
      navigate(destinationForRole(auth.user.accessRole), { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to authenticate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">NOOR</h1>
            <p className="text-xs text-slate-500">Disaster Coordination Command</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          {isRegistering ? 'Create your account' : 'Sign in'}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Access is based on the role assigned to your account.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Full name
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              {role === 'ngo' && (
                <label className="block text-sm font-medium text-slate-700">
                  NGO / organization name
                  <input
                    required
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              )}
            </>
          )}

          <label className="block text-sm font-medium text-slate-700">
            Sign in as
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="citizen">Citizen</option>
              <option value="ngo">NGO responder</option>
              {!isRegistering && <option value="admin">Administrator</option>}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              required
              type="password"
              minLength={isRegistering ? 6 : undefined}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            {submitting ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          {isRegistering ? 'Already have an account?' : 'Need a citizen or NGO account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setRole('citizen');
              setError('');
            }}
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            {isRegistering ? 'Sign in' : 'Register'}
          </button>
        </p>
      </section>
    </main>
  );
}
