import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Forecast' }} />
      <Tabs.Screen name="webcams" options={{ title: 'Cams' }} />
      <Tabs.Screen name="recovery" options={{ title: 'Recovery' }} />
      <Tabs.Screen name="coaches" options={{ title: 'Coaches' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
