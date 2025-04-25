// NoHeaderFooterLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

function NoHeaderFooterLayout() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

export default NoHeaderFooterLayout;
