import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Project {
  id: number;
  name: string;
  description: string;
}

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = () => {
    fetch('/api/projects/')
      .then(response => response.json())
      .then(data => setProjects(data));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = (projectId: number) => {
    fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          fetchProjects(); // Refresh project list
        }
      });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Seznam Projektů</h2>
      <ul>
        {projects.map(project => (
          <li key={project.id} className="mb-2 p-2 border rounded flex justify-between items-center">
            <Link to={`/projects/${project.id}`} className="flex-grow">
              <h3 className="font-bold">{project.name}</h3>
              <p>{project.description}</p>
            </Link>
            <div>
              <Link to={`/projects/${project.id}/edit`} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Upravit</Link>
              <button onClick={() => handleDelete(project.id)} className="bg-red-500 text-white px-3 py-1 rounded">
                Smazat
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectList;
