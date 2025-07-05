import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ProjectListScreen from '../screens/ProjectListScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import AddProjectScreen from '../screens/AddProjectScreen';
import ProgressReportScreen from '../screens/ProgressReportScreen';
import PhotoUploadScreen from '../screens/PhotoUploadScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ProjectList">
        <Stack.Screen name="ProjectList" component={ProjectListScreen} options={{ title: 'Projekty' }} />
        <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Detail projektu' }} />
        <Stack.Screen name="AddProject" component={AddProjectScreen} options={{ title: 'Přidat projekt' }} />
        <Stack.Screen name="ProgressReport" component={ProgressReportScreen} options={{ title: 'Hlášení postupu' }} />
        <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} options={{ title: 'Fotodokumentace' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
