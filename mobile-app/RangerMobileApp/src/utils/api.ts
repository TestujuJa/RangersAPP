import axios from 'axios';

const API_URL = 'http://10.0.2.2:8000'; // Pro Android emulátor, upravte dle potřeby

export const getProjects = async () => {
  const res = await axios.get(`${API_URL}/projects/`);
  return res.data;
};

export const getProjectDetail = async (id: string) => {
  const res = await axios.get(`${API_URL}/projects/${id}`);
  return res.data;
};

export const addProject = async (data: { name: string; description: string }) => {
  const res = await axios.post(`${API_URL}/projects/`, data);
  return res.data;
};

export const sendProgressReport = async (projectId: string, note: string) => {
  const res = await axios.post(`${API_URL}/projects/${projectId}/progress/`, { notes: note });
  return res.data;
};

export const uploadPhoto = async (projectId: string, photo: any) => {
  const formData = new FormData();
  formData.append('file', photo);
  const res = await axios.post(`${API_URL}/projects/${projectId}/photos/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
