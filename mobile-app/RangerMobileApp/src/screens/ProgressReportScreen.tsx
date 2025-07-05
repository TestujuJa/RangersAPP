import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { sendProgressReport } from '../utils/api';
import { getData, saveData } from '../utils/storage';

export default function ProgressReportScreen({ route, navigation }: any) {
  const { projectId } = route.params;
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!note) {
      Alert.alert('Chyba', 'Vyplňte popis postupu.');
      return;
    }
    setLoading(true);
    try {
      await sendProgressReport(projectId, note);
      // Uložení offline (pro jednoduchost pouze lokálně, bez synchronizace)
      const local = (await getData(`progress_${projectId}`)) || [];
      await saveData(`progress_${projectId}`, [...local, { note, date: new Date().toISOString() }]);
      Alert.alert('Hotovo', 'Hlášení bylo odesláno.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Chyba', 'Nepodařilo se odeslat hlášení.');
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24 }}>Hlášení postupu</Text>
      <Text>Projekt: {projectId}</Text>
      <TextInput
        placeholder="Popis postupu"
        value={note}
        onChangeText={setNote}
        style={{ borderWidth: 1, marginVertical: 12, padding: 8 }}
      />
      <Button title={loading ? 'Odesílám...' : 'Odeslat'} onPress={handleSend} disabled={loading} />
    </View>
  );
}
