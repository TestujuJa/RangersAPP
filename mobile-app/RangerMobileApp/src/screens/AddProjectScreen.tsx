import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { addProject } from '../utils/api';
import { saveData, getData } from '../utils/storage';

export default function AddProjectScreen({ navigation, route }: any) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Chyba', 'Zadejte název projektu.');
      return;
    }
    setLoading(true);
    try {
      const newProject = await addProject({ name, description: desc });
      // Uložení do offline úložiště
      const local = (await getData('projects')) || [];
      await saveData('projects', [...local, newProject]);
      Alert.alert('Hotovo', 'Projekt byl přidán.');
      navigation.goBack();
      if (route?.params?.onGoBack) route.params.onGoBack();
    } catch (e) {
      Alert.alert('Chyba', 'Nepodařilo se uložit projekt.');
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24 }}>Přidat projekt</Text>
      <TextInput
        placeholder="Název projektu"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, marginVertical: 8, padding: 8 }}
      />
      <TextInput
        placeholder="Popis projektu"
        value={desc}
        onChangeText={setDesc}
        style={{ borderWidth: 1, marginVertical: 8, padding: 8 }}
      />
      <Button title={loading ? 'Ukládám...' : 'Uložit'} onPress={handleSave} disabled={loading} />
    </View>
  );
}
