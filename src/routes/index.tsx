import React from 'react';

// Example placeholder pages
const Home: React.FC = () => <h1>Home</h1>;

export type AppRoute = {
  path: string;
  element: React.ReactElement;
  // You can add route meta here (e.g., authRequired, title) later
};

export const routes: AppRoute[] = [
  { path: '/', element: <Home /> },
  // Add more routes as pages are migrated:
  // { path: '/dashboard', element: <Dashboard /> },
  // { path: '/login', element: <Login /> },
];
