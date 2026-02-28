# Android Foreground Service Video Guide
**Purpose:** Create a demonstration video showing how ReadingDaily Scripture uses foreground service for media playback
**Required By:** Google Play Console (if requested during review)
**Status:** Optional - Only needed if Google requests it
**Last Updated:** February 28, 2026

---

## Why This is Needed

Google Play requires apps using `FOREGROUND_SERVICE_MEDIA_PLAYBACK` permission to provide a video demonstration showing:
1. How the app uses the foreground service
2. What tasks run in the background
3. Why this permission is necessary for user experience

**ReadingDaily Scripture Use Case:**
- Scripture audio narration continues playing when app is minimized
- Users can listen while using other apps or with screen off
- Essential for spiritual listening experience

---

## Video Requirements

### Technical Specs
- **Duration:** 30-60 seconds
- **Format:** MP4, MOV, or AVI
- **Resolution:** 720p minimum (1080p recommended)
- **Hosting:** YouTube (Unlisted) or Google Drive (public link)
- **Content:** Screen recording of actual app usage

### What to Show
1. **Start:** App opens, navigate to scripture reading
2. **Play Audio:** Tap play button to start narration
3. **Minimize App:** Press home button or switch to another app
4. **Audio Continues:** Show audio still playing (notification visible)
5. **Return to App:** Demonstrate resuming from notification

---

## Step-by-Step Recording Guide

### Option A: Record on iPhone (Recommended)

**Equipment Needed:**
- iPhone with ReadingDaily Scripture installed
- Built-in screen recorder

**Steps:**
1. **Enable Screen Recording:**
   - Settings → Control Center → Add "Screen Recording"

2. **Prepare the App:**
   - Open ReadingDaily Scripture
   - Navigate to a scripture reading with audio

3. **Start Recording:**
   - Swipe down from top-right (or up from bottom on older iPhones)
   - Tap the record button (circle icon)
   - Wait for 3-second countdown

4. **Perform Demo (30-60 seconds):**
   - **0-10s:** Show app home screen
   - **10-20s:** Navigate to today's scripture reading
   - **20-30s:** Tap play button, audio starts
   - **30-40s:** Press home button (audio continues)
   - **40-50s:** Open another app (Safari, Messages) - audio still playing
   - **50-60s:** Tap notification to return to ReadingDaily app

5. **Stop Recording:**
   - Tap red time indicator at top
   - Tap "Stop"

6. **Find Video:**
   - Open Photos app
   - Video saved to Recents

### Option B: Record on Android (After Approval)

**Wait for Google Play approval, then:**
1. Install app from Google Play Store
2. Use built-in screen recorder (Android 11+):
   - Swipe down twice from top
   - Tap "Screen record"
   - Follow same demo steps as iPhone

3. Or use ADB screen recording:
   ```bash
   adb shell screenrecord /sdcard/readingdaily-demo.mp4
   # Perform demo
   # Ctrl+C to stop
   adb pull /sdcard/readingdaily-demo.mp4
   ```

---

## Upload to YouTube

### Steps:
1. Go to https://studio.youtube.com/
2. Click "CREATE" → "Upload videos"
3. Select your screen recording file
4. Fill in details:
   - **Title:** "ReadingDaily Scripture - Background Audio Playback Demo"
   - **Description:**
     ```
     Demonstration of ReadingDaily Scripture app using foreground service
     for media playback. Shows scripture audio narration continuing in the
     background when app is minimized, allowing users to listen while
     multitasking or with screen off.

     This demo video is provided for Google Play Store review purposes.
     ```
   - **Visibility:** **Unlisted** (important - not Public)
5. Click "Next" through options
6. Click "Publish"
7. Copy the video URL

---

## Submit to Google Play

### Where to Add:
1. Go to Google Play Console
2. Navigate to **Publishing overview** → **App content**
3. Click **Foreground service permissions**
4. Under "Media playback" section
5. Paste YouTube URL in "Video link" field
6. Click "Save"

---

## Sample Video Script

**What to say (optional voiceover or text overlay):**

```
[0-5s]
"ReadingDaily Scripture uses foreground service for background audio playback"

[5-15s]
"Users start listening to daily scripture narration"

[15-30s]
"When the app is minimized, audio continues playing in the background"

[30-45s]
"Users can multitask with other apps while listening"

[45-60s]
"Notification allows easy return to app"
```

---

## Alternative: Use App Store Preview

**Quick Option if Short on Time:**
1. Go to App Store listing: https://apps.apple.com/app/readingdaily-scripture/id6753561999
2. Take screenshots showing:
   - Audio playback screen
   - iOS notification showing playback controls
3. Create simple slideshow with text explanations
4. Upload to YouTube as Unlisted

**Note:** This is less ideal than actual screen recording but may be acceptable if Google specifically requests the video.

---

## Example YouTube URL Format

After upload, your link will look like:
```
https://www.youtube.com/watch?v=XXXXXXXXXXX
```

**Make sure it's set to "Unlisted"** - this means:
- ✅ Anyone with the link can view it
- ✅ Google Play reviewers can access it
- ❌ Won't appear in YouTube search results
- ❌ Won't be recommended to random viewers

---

## Troubleshooting

### Video Too Large
- Compress using:
  - **Mac:** QuickTime Player → Export → 720p
  - **Windows:** HandBrake (free tool)
  - **Online:** cloudconvert.com

### Can't Upload to YouTube
- Alternative: Upload to Google Drive
  - Right-click file → Get link → "Anyone with the link"
  - Use that link in Google Play Console

### Google Rejects Video
- Common reasons:
  - Video doesn't show actual app usage
  - Permission usage not clear
  - Poor quality/can't see interface
- **Solution:** Re-record following steps above exactly

---

## When You're Done

- [ ] Video recorded (30-60 seconds)
- [ ] Video uploaded to YouTube (Unlisted)
- [ ] URL copied
- [ ] URL submitted to Google Play Console
- [ ] Foreground service permissions saved

---

## Status: Optional Until Requested

**You do NOT need to create this video immediately.**

Only create and upload this video if:
1. Google Play requests it during review, OR
2. You want to be proactive and have time

The app can be submitted without it, and Google will let you know if they need it.

---

**Questions?** Email: ourenglish2019@gmail.com
**Google Play Console:** https://play.google.com/console
**App Store (for reference):** https://apps.apple.com/app/readingdaily-scripture/id6753561999
