import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// MINIMAL TEST ENTRY POINT - KEEP THIS AS BACKUP
// This bypasses all initialization to test if the app can launch at all

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ReadingDaily Scripture</Text>
      <Text style={styles.subtext}>App is running! ✅</Text>
      <Text style={styles.info}>If you see this, the crash is fixed.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5B6FE8',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
  },
  info: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
});
