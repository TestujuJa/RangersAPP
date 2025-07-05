import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { syncProjects } from '../utils/sync';

export default function ProjectListScreen({ navigation }: any) {
  const [projects, setProjects] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = async () => {
    setRefreshing(true);
    try {
      const data = await syncProjects();
      setProjects(data);
    } catch (e) {
      Alert.alert('Chyba', 'Nepodařilo se načíst projekty.');
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Seznam projektů</Text>
      <FlatList
        data={projects}
        keyExtractor={item => item.id?.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}>
            <Text style={{ fontSize: 18, marginVertical: 8 }}>{item.name}</Text>
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProjects} />}
        ListEmptyComponent={<Text>Žádné projekty</Text>}
      />
      <Button title="Přidat projekt" onPress={() => navigation.navigate('AddProject', { onGoBack: loadProjects })} />
    </View>
  );
}
