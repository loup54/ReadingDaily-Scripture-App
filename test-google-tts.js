#!/usr/bin/env node

/**
 * Google Cloud TTS API Test Script
 *
 * Tests the Google Cloud Text-to-Speech API to diagnose configuration issues
 */

const GOOGLE_CLOUD_API_KEY = 'AIzaSyB0uezCk4ERGIPn8VssFjZdWT7H83uiBXo';
const API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

async function testGoogleTTS() {
  console.log('\n=== Google Cloud TTS API Test ===\n');
  console.log('API Key:', GOOGLE_CLOUD_API_KEY.substring(0, 20) + '...');
  console.log('API URL:', API_URL);
  console.log('\nTesting API call...\n');

  try {
    const response = await fetch(`${API_URL}?key=${GOOGLE_CLOUD_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: 'Hello world' },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Standard-A',
          ssmlGender: 'NEUTRAL',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 1.0,
          pitch: 0.0,
        },
      }),
    });

    console.log('Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();

    if (!response.ok) {
      console.log('\n❌ API Error:');
      console.log(JSON.stringify(data, null, 2));

      // Provide helpful diagnosis
      if (data.error?.status === 'PERMISSION_DENIED') {
        console.log('\n🔍 Diagnosis: Text-to-Speech API not enabled');
        console.log('\n📋 To fix:');
        console.log('1. Go to: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com');
        console.log('2. Select your project');
        console.log('3. Click "ENABLE"');
        console.log('4. Wait a few minutes for the API to activate');
      } else if (data.error?.status === 'INVALID_ARGUMENT') {
        console.log('\n🔍 Diagnosis: Request format issue');
      } else if (data.error?.message?.includes('API key')) {
        console.log('\n🔍 Diagnosis: API key issue');
        console.log('\n📋 To fix:');
        console.log('1. Check API key restrictions in Google Cloud Console');
        console.log('2. Ensure key has permission for Text-to-Speech API');
      }

      return false;
    }

    if (data.audioContent) {
      console.log('\n✅ Success! API is working correctly');
      console.log('Audio content received:', data.audioContent.substring(0, 50) + '...');
      return true;
    } else {
      console.log('\n⚠️ Unexpected: No audio content in response');
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('\n❌ Network Error:');
    console.log(error.message);
    return false;
  }
}

testGoogleTTS()
  .then(success => {
    console.log('\n=== Test Complete ===\n');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test Failed:', error);
    process.exit(1);
  });
