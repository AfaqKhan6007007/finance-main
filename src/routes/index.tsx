import React from 'react';
import Home from '../pages/Home';

export type AppRoute = {
  path: string;
  element: React.ReactElement;
};

export const routes: AppRoute[] = [
  { path: '/', element: <Home /> },
];
