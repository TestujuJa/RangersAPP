import React, { useEffect, useState } from 'react';

interface DashboardStats {
  total_projects: number;
  completed_projects: number;
  active_projects: number;
  average_overall_progress: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard_stats/')
      .then(response => response.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) {
    return <div>Načítám data dashboardu...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-blue-100 p-4 rounded-lg shadow">
        <h3 className="text-lg font-bold">Celkem Projektů</h3>
        <p className="text-3xl">{stats.total_projects}</p>
      </div>
      <div className="bg-green-100 p-4 rounded-lg shadow">
        <h3 className="text-lg font-bold">Dokončené Projekty</h3>
        <p className="text-3xl">{stats.completed_projects}</p>
      </div>
      <div className="bg-yellow-100 p-4 rounded-lg shadow">
        <h3 className="text-lg font-bold">Aktivní Projekty</h3>
        <p className="text-3xl">{stats.active_projects}</p>
      </div>
      <div className="bg-purple-100 p-4 rounded-lg shadow">
        <h3 className="text-lg font-bold">Průměrný Postup</h3>
        <p className="text-3xl">{stats.average_overall_progress.toFixed(2)}%</p>
      </div>
    </div>
  );
};

export default Dashboard;
