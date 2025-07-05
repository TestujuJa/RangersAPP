import { getData, saveData } from './storage';
import { getProjects } from './api';

export const syncProjects = async () => {
  // Získání projektů z backendu a uložení do offline úložiště
  try {
    const projects = await getProjects();
    await saveData('projects', projects);
    return projects;
  } catch (e) {
    // Pokud selže, použij lokální data
    const local = await getData('projects');
    return local || [];
  }
};
