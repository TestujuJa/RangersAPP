import React, { useState } from 'react';
import { View, Text, Button, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadPhoto } from '../utils/api';
import { getData, saveData } from '../utils/storage';

export default function PhotoUploadScreen({ route }: any) {
  const { projectId } = route.params;
  const [photo, setPhoto] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const pickPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0]);
      // Uložení offline
      const local = (await getData(`photos_${projectId}`)) || [];
      await saveData(`photos_${projectId}`, [...local, result.assets[0]]);
    }
  };

  const handleUpload = async () => {
    if (!photo) {
      Alert.alert('Chyba', 'Nejprve vyberte fotku.');
      return;
    }
    setUploading(true);
    try {
      await uploadPhoto(projectId, {
        uri: photo.uri,
        type: photo.type,
        name: photo.fileName || 'photo.jpg',
      });
      Alert.alert('Hotovo', 'Fotka byla nahrána.');
    } catch (e) {
      Alert.alert('Chyba', 'Nepodařilo se nahrát fotku.');
    }
    setUploading(false);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24 }}>Nahrání fotodokumentace</Text>
      <Text>Projekt: {projectId}</Text>
      {photo && (
        <Image source={{ uri: photo.uri }} style={{ width: 200, height: 200, marginVertical: 12 }} />
      )}
      <Button title="Vybrat fotku" onPress={pickPhoto} />
      <Button title={uploading ? 'Nahrávám...' : 'Nahrát na server'} onPress={handleUpload} disabled={uploading} />
    </View>
  );
}
