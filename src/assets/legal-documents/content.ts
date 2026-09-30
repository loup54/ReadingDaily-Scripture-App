/**
 * Legal document text, keyed by the `filename` in index.json.
 * Metro can't require() .md files, so the text lives here as strings.
 * Documents not listed here fall back to the generated placeholder in
 * LegalDocumentService.loadMarkdownFile.
 *
 * The viewer's renderer is minimal: no tables, text before the first
 * heading is dropped, and any line containing ** is rendered fully bold.
 */

const PRIVACY_POLICY = `# Privacy Policy

## About this policy
ReadingDaily Scripture is made by OurEnglish.info Pty Ltd, an Australian company. This policy explains what the app collects, why, who else handles it, and how to ask us to delete it.
In short: we collect what the app needs to show you the day's readings, play audio, save your progress, and run subscriptions. We don't sell your data, we don't show ads, and we don't track you across other apps.
Last updated: 30 September 2026. Version 2.0.0.

## 1. What we collect
If you create an account:
- Your email address and password. The password is handled by Firebase Authentication; we never see it.
- A display name, if you set one.
As you use the app:
- Your reading progress, history, bookmarks, and highlights.
- Your settings: language, translation language, theme, and notification preferences.
- A record of when you accepted our terms and this policy.
Pronunciation practice, only if you use it:
- Your voice while you read a passage aloud, and the pronunciation scores that come back. Recordings are not stored.
Subscriptions:
- Whether you have an active subscription and which plan. Apple or Google handle the payment itself; we never see your card details.
Automatically:
- Crash reports and error logs: device model, operating system, app version, and what the app was doing when it failed.
- App usage events, such as which screens and features get used, through Firebase Analytics.
We don't collect advertising identifiers, and we don't track your location.

## 2. Why we use it
- To show you the daily readings, play audio, and keep your place.
- To score your pronunciation when you ask for it.
- To translate readings into your chosen language.
- To manage your subscription or gift subscription.
- To find and fix crashes.
- To see which features get used, so we know what to improve.
- To send notifications you've turned on.

## 3. Who else handles your data
We use these service providers. Each gets only what it needs to do its job.
- Google Firebase (United States): sign-in, database, cloud functions, and usage analytics. Receives your account, progress, settings, and usage events.
- Microsoft Azure Speech (Australia): pronunciation scoring and reading audio. Receives your practice recording and the reading text.
- Google Cloud Text-to-Speech (United States): word timing for audio highlighting. Receives reading text only.
- Google Translate (United States): translating readings. Receives reading text only.
- Sentry (United States): crash reporting. Receives crash and device details.
- Apple App Store and Google Play: subscriptions and payment, under their own privacy policies.
We don't sell, rent, or trade your personal information, and we don't share it with anyone for their own marketing.

## 4. How long we keep it
- Account, progress, and settings: until you delete your account or ask us to.
- Practice recordings: sent to Azure for scoring and not kept afterwards.
- Crash reports: deleted automatically by Sentry, within 90 days.
- Analytics: deleted automatically by Firebase, within 14 months.

## 5. Automated decisions
The app uses software to score your pronunciation when you practise. That score is feedback for you only. It isn't used to decide anything about you, and it doesn't affect your access to the app, your subscription, or anything else.
We don't use software to make decisions that could significantly affect your rights or interests.

## 6. Overseas disclosure
We're based in Australia. Some of our service providers store and process data overseas, mainly in the United States (see section 3). We choose providers with established security and privacy practices.

## 7. Security
Data travels over encrypted connections (TLS), and Firebase encrypts stored data. Access to our systems is limited, and our server endpoints use authentication and rate limiting.
No system is perfectly secure. If a data breach is likely to cause you serious harm, we'll tell you and the Office of the Australian Information Commissioner, as the law requires.

## 8. Your rights
Wherever you live, you can ask us to tell you what personal information we hold about you, correct it, delete it, or give you a copy. Email ourenglish2019@gmail.com and we'll reply within 30 days.
Australia: we handle personal information in line with the Australian Privacy Principles. If you're not satisfied with our response, you can complain to the Office of the Australian Information Commissioner at oaic.gov.au.
European Union and United Kingdom: you can also restrict or object to processing, and complain to your local data protection authority. We rely on our contract with you (running the app) and our legitimate interest in fixing crashes and improving the app.
California: we don't sell or share personal information as the CCPA defines it.

## 9. Children
The app isn't aimed at children under 13, and we don't knowingly collect information from them. If you think a child under 13 has created an account, email us and we'll delete it.
A parent or guardian of a user aged 13 to 17 can ask us to access or delete that account.

## 10. Changes to this policy
If we change this policy, we'll update the date in "About this policy". If the change is significant, we'll also tell you in the app.

## 11. Contact
OurEnglish.info Pty Ltd, Australia
Email: ourenglish2019@gmail.com
In the app: Settings, then Legal & Compliance
`;

export const LEGAL_CONTENT: Record<string, string> = {
  'privacy-policy.md': PRIVACY_POLICY,
};
