import React from 'react';
import { Dashboard as DashboardContent } from './AppPages.jsx';
import './DashboardPage.css';

/** Premium dashboard entry point; the existing component remains API-driven. */
export default function DashboardPage() {
  return (
    <div className="securetrack-dashboard-page" aria-label="Security overview dashboard">
      <DashboardContent />
    </div>
  );
}
