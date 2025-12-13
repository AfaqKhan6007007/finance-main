import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { routes } from './routes';

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '0.5rem' }}>
        <Link to="/">Home</Link>
      </nav>
      <Routes>
        {routes.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
