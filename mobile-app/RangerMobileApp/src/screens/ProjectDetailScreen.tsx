import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { getProjectDetail } from '../utils/api';
import { getData } from '../utils/storage';

export default function ProjectDetailScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let data;
        try {
          data = await getProjectDetail(projectId);
        } catch {
          // fallback offline
          const local = (await getData('projects')) || [];
          data = local.find((p: any) => p.id?.toString() === projectId?.toString());
        }
        setProject(data);
      } catch (e) {
        Alert.alert('Chyba', 'Nepodařilo se načíst detail projektu.');
      }
      setLoading(false);
    };
    load();
  }, [projectId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!project) return <Text>Projekt nenalezen</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24 }}>{project.name}</Text>
      <Text style={{ marginBottom: 16 }}>{project.description}</Text>
      <Button title="Hlášení postupu" onPress={() => navigation.navigate('ProgressReport', { projectId })} />
      <Button title="Fotodokumentace" onPress={() => navigation.navigate('PhotoUpload', { projectId })} />
    </View>
  );
}
