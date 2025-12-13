import React from 'react';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';

export type AppRoute = { path: string; element: React.ReactElement };

export const routes: AppRoute[] = [
  { path: '/', element: <Home /> },
  { path: '/dashboard', element: <Dashboard /> },
];
