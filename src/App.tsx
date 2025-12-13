import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { routes } from './routes';

export default function App() {
  const links = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <BrowserRouter>
      <nav style={{ padding: '0.5rem', display: 'flex', gap: '0.75rem' }}>
        {links.map((l) => (
          <Link key={l.to} to={l.to}>{l.label}</Link>
        ))}
      </nav>
      <Routes>
        {routes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
