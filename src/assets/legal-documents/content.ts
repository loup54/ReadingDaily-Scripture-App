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
In short: we collect what the app needs to show you the day's readings, play audio, save your progress, and handle purchases. We don't sell your data, we don't show ads, and we don't track you across other apps.
Last updated: 30 September 2026. Version 2.0.1.

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
Purchases and gifts:
- Whether you've bought Archive access. Apple or Google handle the payment itself; we never see your card details.
- If you send a gift: the recipient's email address and your optional message, kept until the gift is redeemed or expires.
Automatically:
- Crash reports and error logs: device model, operating system, app version, and what the app was doing when it failed.
- App usage events, such as which screens and features get used, through Firebase Analytics.
We don't collect advertising identifiers, and we don't track your location.

## 2. Why we use it
- To show you the daily readings, play audio, and keep your place.
- To score your pronunciation when you ask for it.
- To translate readings into your chosen language.
- To manage your purchase, and to deliver gifts you send.
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
- Apple App Store and Google Play: purchases and payment, under their own privacy policies.
We don't sell, rent, or trade your personal information, and we don't share it with anyone for their own marketing.

## 4. How long we keep it
- Account, progress, and settings: until you delete your account or ask us to.
- Practice recordings: sent to Azure for scoring and not kept afterwards.
- Crash reports: deleted automatically by Sentry, within 90 days.
- Analytics: deleted automatically by Firebase, within 14 months.

## 5. Automated decisions
The app uses software to score your pronunciation when you practise. That score is feedback for you only. It isn't used to decide anything about you, and it doesn't affect your access to the app, your purchases, or anything else.
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

const TERMS_OF_SERVICE = `# Terms of Service

## About these terms
These terms are an agreement between you and OurEnglish.info Pty Ltd, the Australian company that makes ReadingDaily Scripture. By using the app, you agree to them. If you don't agree, please don't use the app.
Last updated: 30 September 2026. Version 2.0.0.

## 1. What the app does
- Shows the daily Catholic Mass readings, following the liturgical calendar.
- Plays the readings aloud, with word-by-word highlighting.
- Offers pronunciation practice, with feedback on how you read aloud.
- Translates readings into other languages.
- Saves your reading progress, bookmarks, and settings.
- Offers an Archive of past readings, which you can unlock with a one-time purchase.

## 2. Your account
You can use much of the app without an account. If you create one:
- You must be at least 13 years old.
- Give us an email address you can access, and keep your password to yourself.
- Tell us at ourenglish2019@gmail.com if you think someone else has used your account.
You can delete your account at any time with Delete Account in the app's settings, or by emailing us. We may suspend or close an account that's used to break the law, attack the app, or abuse other people. If we do, and it wasn't for one of those reasons, we'll refund any purchase you haven't had the use of.

## 3. Using the app fairly
Please don't:
- use the app for anything unlawful,
- try to break into, overload, or disrupt the app or its servers,
- copy the app's content in bulk, or scrape it with automated tools, or
- use someone else's account without their permission.

## 4. Purchases and gifts
- The daily readings are free. Archive access is a one-time purchase, not a subscription, so nothing renews and nothing needs cancelling.
- The price is shown in the app before you buy. Apple or Google process the payment, under their own terms.
- To restore a purchase on a new device, use Restore Purchase in the app's settings, signed in to the same Apple or Google account.
- Gift codes expire on the date shown with the gift, and can't be exchanged for cash.

## 5. Refunds and your consumer rights
Refunds for purchases are handled by Apple or Google. Request one through your App Store or Google Play account.
Our goods and services come with guarantees that can't be excluded under the Australian Consumer Law, and you may have similar rights where you live. Nothing in these terms limits those rights. If something you bought doesn't work as it should, email us and we'll help, including by arranging a refund where the law requires it.

## 6. Scripture and other content
The scripture texts belong to their copyright owners and are shown for your personal, non-commercial reading and prayer. See Copyright in Legal & Compliance for the details of each source.
The app's own design, code, audio, and text belong to OurEnglish.info Pty Ltd. You may use them within the app, but please don't copy, resell, or redistribute them.
If you send us feedback, we may use your ideas to improve the app, without owing you anything for them.

## 7. Accuracy
We work hard to show the correct readings for each day, but mistakes can happen, such as a wrong reading, a translation error, or audio that mispronounces a word. For liturgical use, check your parish's official lectionary.
Translations are produced by software and may be imperfect. Pronunciation scores are guidance for practice, not a formal assessment.
The app isn't spiritual direction or professional language teaching.

## 8. Availability and changes
We aim to keep the app running at all times, but it may sometimes be unavailable, for example during maintenance or an outage at one of our providers.
We may add, change, or remove features. If we remove something you paid for, we'll offer you a fair alternative or a refund.

## 9. Our liability
We're not responsible for losses you suffer that we couldn't reasonably have foreseen, or that weren't caused by our failure to meet these terms or the law.
Where the law lets us limit our liability for a failure to meet a consumer guarantee, our liability is limited to supplying the service again, or paying the cost of having it supplied again.
Nothing in these terms limits liability that can't legally be limited.

## 10. Privacy
Our Privacy Policy explains what information we collect and how we use it. You can read it in Legal & Compliance.

## 11. Changes to these terms
If we change these terms, we'll update the date in "About these terms". If a change is significant, we'll tell you in the app before it takes effect. If you don't agree with a change, you can stop using the app and ask us to delete your account.

## 12. Disputes and governing law
If you have a problem with the app, please email us first at ourenglish2019@gmail.com. Most problems can be sorted out quickly that way.
These terms are governed by the laws of Queensland, Australia. If you're a consumer living in another country, you also keep any rights your local law gives you, and you can bring a claim in your local courts.

## 13. Contact
OurEnglish.info Pty Ltd, Australia
Email: ourenglish2019@gmail.com
In the app: Settings, then Legal & Compliance
`;

const COPYRIGHT = `# Copyright & Attribution

## About this page
This page lists who owns the content in ReadingDaily Scripture, and the sources and software the app uses.
Last updated: 30 September 2026. Version 2.0.0.

## 1. Scripture readings
The daily readings follow the Lectionary for Mass used in the Catholic dioceses of the United States.
Scripture texts are from the New American Bible, Revised Edition, copyright 2010, 1991, 1986, 1970 Confraternity of Christian Doctrine, Washington, D.C. All rights reserved.
Lectionary texts are copyright Confraternity of Christian Doctrine. All rights reserved.
We have applied to the copyright owner for a licence covering digital use in this app. That application is pending.
The readings are here for your personal reading, prayer, and study. Please don't copy them out of the app for other uses. For permission, contact the Confraternity of Christian Doctrine through the United States Conference of Catholic Bishops at usccb.org.

## 2. Audio
The reading audio is computer-generated speech, produced with Microsoft Azure and Google Cloud text-to-speech. It isn't a human recording, and some words, especially names, may be mispronounced.
When you practise pronunciation, your recording is scored and not kept. It stays yours.

## 3. Translations
Translations of the readings are produced by Google Translate. They're machine translations for study, not approved liturgical translations.

## 4. The app itself
The app's design, code, artwork, and original text are copyright 2025-2026 OurEnglish.info Pty Ltd. All rights reserved.
You're welcome to share screenshots of the app in reviews, posts, and articles, as long as you don't alter them to misrepresent the app.

## 5. Open-source software
The app is built with open-source software, including React Native, Expo, Firebase, Zustand, React Navigation, and Sentry. We use each under its licence: MIT, or Apache 2.0 for Firebase. Our thanks to their authors.

## 6. Reporting a copyright concern
If you believe something in the app infringes your copyright, email ourenglish2019@gmail.com. Tell us what the work is, where it appears in the app, and how to contact you. We'll look into it promptly, and remove the content if it infringes.

## 7. Contact
OurEnglish.info Pty Ltd, Australia
Email: ourenglish2019@gmail.com
`;

const CONSUMER_RIGHTS = `# Consumer Rights Guide

## About this guide
This guide explains your rights when you use or buy something in ReadingDaily Scripture, and how to get help if something goes wrong. It's a plain summary. Your actual rights come from the law where you live, and nothing here reduces them.
Last updated: 30 September 2026. Version 2.0.0.

## 1. What you pay for
- The daily readings, audio, translation, and pronunciation practice are free.
- Archive access, for past readings, is a one-time purchase. It isn't a subscription, so it never renews and there's nothing to cancel.
- You always see the price in the app before you buy. Apple or Google take the payment.
- If you change devices, use Restore Purchase in the app's settings, signed in to the same Apple or Google account.

## 2. Your rights in Australia
Under the Australian Consumer Law, what you buy from us comes with guarantees that can't be excluded. It must:
- work as described, and match what we told you about it,
- be of acceptable quality: free from defects, safe, and reasonably durable, and
- be fit for any purpose we said it was for.
If there's a major failure, such as Archive access that doesn't work at all and we can't fix, you can choose a refund.
If the problem is minor, we'll fix it within a reasonable time. If we don't, you can ask for a refund.

## 3. Your rights elsewhere
If you live outside Australia, you keep the consumer rights your own law gives you.
In the European Union and the United Kingdom, digital content must be as described, fit for purpose, and of satisfactory quality, and you can ask for a repair or a refund if it isn't.
Apple and Google also have their own refund policies, which may be more generous than the law requires.

## 4. How to get a refund
1. Request it through the store you bought from. On iPhone, go to reportaproblem.apple.com. On Android, go to your Google Play order history.
2. If the store declines, or you're not sure, email us at ourenglish2019@gmail.com with your purchase date and what went wrong. We'll help, including by supporting your refund request where the law entitles you to one.

## 5. If something isn't working
Email ourenglish2019@gmail.com and tell us what happened, on which device, and roughly when. We aim to reply within 5 business days.
If a daily reading looks wrong, tell us the date. We check these quickly because they affect everyone.

## 6. If you're not satisfied
If we can't resolve your problem, you can contact an independent body:
- Australia, purchases: your state or territory consumer protection agency. In Queensland, that's the Office of Fair Trading. The ACCC (accc.gov.au) also has information on your rights.
- Australia, privacy: the Office of the Australian Information Commissioner (oaic.gov.au).
- Elsewhere: your national or local consumer protection body.

## 7. Your data
You can ask to see, correct, get a copy of, or delete the personal information we hold about you. Delete your account with Delete Account in the app's settings, or email us. Our Privacy Policy has the details.

## 8. Accessibility
If something in the app is hard to use because of a disability, please tell us. We'll try to fix it, or find another way to give you what you need.

## 9. Contact
OurEnglish.info Pty Ltd, Australia
Email: ourenglish2019@gmail.com
In the app: Settings, then Legal & Compliance
`;

const ACCESSIBILITY = `# Accessibility Statement

## About this statement
We want everyone to be able to pray and read with ReadingDaily Scripture, including people who are blind or have low vision, are hard of hearing, or find reading difficult. This statement says what works today, what doesn't yet, and how to tell us about a problem.
Last updated: 30 September 2026. Version 2.0.1.

## 1. What helps today
- Listen instead of read: every reading can be played aloud.
- Follow along: words are highlighted as they're spoken, which helps readers with dyslexia and English learners.
- Choose your pace: play audio at 0.5x, 0.75x, 1x, 1.25x, or 1.5x speed.
- Read in your language: translate readings into 18 other languages.
- Dark mode: turn it on in the app's settings, under Appearance.
- Reduced motion: the app respects your phone's Reduce Motion setting.
- Screen readers: the main buttons and controls have labels for VoiceOver and TalkBack.

## 2. What doesn't work well yet
- Text size: the scripture text now grows with your phone's text size setting, up to one and a half times its normal size. At the very largest accessibility sizes, the heading at the top of the reading screen grows too, and it can push the reading off the screen. We're working on that.
- Screen reader coverage: some screens and controls may not be labelled yet.
- Audio: reading audio is computer-generated. Some words, especially names, may be mispronounced.
- Captions: the reading text works as the transcript for the audio, but there are no separate captions.

## 3. Our aim
We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA, as they apply to mobile apps. We aren't there yet, and we'll keep fixing the gaps above.

## 4. Tell us about a problem
If something in the app is hard to use, email ourenglish2019@gmail.com. Tell us what you were trying to do, what got in the way, your device, and any assistive technology you use.
We aim to reply within 5 business days. If we can't fix a problem quickly, we'll try to find another way to give you what you need.

## 5. Contact
OurEnglish.info Pty Ltd, Australia
Email: ourenglish2019@gmail.com
`;

const HELP_FAQ = `# Help & FAQ

## Getting started
ReadingDaily Scripture gives you each day's Catholic Mass readings, read aloud with the words highlighted as you listen.
You can start reading straight away as a guest. Create an account if you want your progress saved across devices.
Can't find an answer here? Email ourenglish2019@gmail.com.

## Readings
**Which readings does the app show?**
The daily Mass readings from the Lectionary used in the Catholic dioceses of the United States: first reading, psalm, gospel, and a second reading on Sundays and major feasts.
**A reading looks wrong or is missing. What should I do?**
Tap Retry if the app shows a sample-content notice, or close and reopen the app. If it's still wrong, email us the date, and we'll fix it for everyone.
**Can I read past days?**
Yes, with Archive access, a one-time purchase.
**Can I read without an internet connection?**
Yes. The app can download readings, audio, and translations ahead of time, so you can use them offline.

## Audio
**Why does the voice sometimes mispronounce a word?**
The audio is computer-generated. It handles most words well, but some names and places can come out wrong.
**Can I slow it down?**
Yes. Change the speed on the audio player, from 0.5x to 1.5x.
**The audio won't play. What can I try?**
Check that your phone isn't on silent, that the volume is up, and that you're online, or that you've downloaded the reading. Then close and reopen the app.

## Translation
**How do I read in my own language?**
Choose a translation language in the app's settings. There are 18 to choose from, including Spanish, Vietnamese, Chinese, Tamil, and Arabic.
**Is the translation official?**
No. It's a machine translation to help you understand the English text, not an approved liturgical translation.

## Pronunciation practice
**How does it work?**
Read a passage aloud, and the app scores your pronunciation word by word, so you can see which words to practise.
**Is my voice recorded and kept?**
No. Your recording is sent for scoring and then discarded.

## Purchases and gifts
**Is the app free?**
Yes. The daily readings, audio, translation, and pronunciation practice are free. Only Archive access costs money.
**Is Archive a subscription?**
No. It's a one-time purchase, so nothing renews and there's nothing to cancel.
**I bought Archive, but it isn't showing on my new phone.**
Use Restore Purchase in the app's settings, signed in to the same Apple or Google account you bought with.
**How do I get a refund?**
Request it through the App Store or Google Play. If that doesn't work, email us. The Consumer Rights Guide has the details.
**Can I give the app to someone?**
Yes. Use Send Gift to send someone a gift code. They redeem it with Redeem Gift.

## Account and privacy
**Do I need an account?**
No. You can read as a guest. An account saves your progress and settings across devices.
**How do I delete my account?**
Use Delete Account in the app's settings, or email us.
**What do you do with my data?**
Only what the app needs to work. We don't sell data or show ads. The Privacy Policy has the details.

## Reminders and widget
**Can the app remind me to read each day?**
Yes. Turn on daily reminders in the app's settings.
**Is there a home-screen widget?**
Yes. Add the ReadingDaily widget from your phone's widget gallery to see today's reading at a glance.

## Contact
Email: ourenglish2019@gmail.com
We aim to reply within 5 business days.
`;

export const LEGAL_CONTENT: Record<string, string> = {
  'accessibility.md': ACCESSIBILITY,
  'help-faq.md': HELP_FAQ,
  'consumer-rights.md': CONSUMER_RIGHTS,
  'copyright.md': COPYRIGHT,
  'privacy-policy.md': PRIVACY_POLICY,
  'terms-of-service.md': TERMS_OF_SERVICE,
};
