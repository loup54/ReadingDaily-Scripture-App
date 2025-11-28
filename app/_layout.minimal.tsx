import React from 'react';
import { View, Text } from 'react-native';

export default function MinimalLayout() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Reading Daily Scripture</Text>
      <Text style={{ marginTop: 10, color: '#666' }}>Build successful!</Text>
    </View>
  );
}
