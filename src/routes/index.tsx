import React from 'react';
import Home from '../pages/Home';
// These imports will succeed only if files exist; keep inputs true to generate them.
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';

export type AppRoute = { path: string; element: React.ReactElement };

export const routes: AppRoute[] = [
  { path: '/', element: <Home /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/login', element: <Login /> },
];
