import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import ProjectList from './components/ProjectList';
import AddProjectForm from './components/AddProjectForm';
import ProjectDetail from './components/ProjectDetail';
import EditProjectForm from './components/EditProjectForm';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <div className="container mx-auto p-4">
        <nav className="mb-8 p-4 bg-gray-800 text-white rounded-lg flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">Ranger App</Link>
          <div>
            <Link to="/" className="mr-4 hover:underline">Projekty</Link>
            {/* Další navigační odkazy zde */}
          </div>
        </nav>
        <div className="mb-4">
          <a href="/api/export/projects" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Export Projektů</a>
          <a href="/api/export/documents" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Export Dokumentů</a>
          <a href="/api/export/progress_logs" className="bg-blue-500 text-white px-4 py-2 rounded">Export Postupu</a>
        </div>
        <Routes>
          <Route path="/" element={<>
            <Dashboard />
            <AddProjectForm />
            <ProjectList />
          </>} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/projects/:projectId/edit" element={<EditProjectForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
