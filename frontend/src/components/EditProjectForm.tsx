import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Project {
  id: number;
  name: string;
  description: string;
}

const EditProjectForm: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(response => response.json())
      .then((data: Project) => {
        setName(data.name);
        setDescription(data.description);
      });
  }, [projectId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, description }),
    })
      .then(response => {
        if (response.ok) {
          navigate(`/projects/${projectId}`);
        }
      });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Upravit Projekt</h2>
      <div className="mb-4">
        <label htmlFor="name" className="block mb-1">Název</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="block mb-1">Popis</label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Uložit Změny
      </button>
    </form>
  );
};

export default EditProjectForm;
