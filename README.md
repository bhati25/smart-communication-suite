# smart-communication-suite
Built a full-stack automation pipeline combining Google Workspace tools and LLM APIs to deliver personalized outreach at scale — including email, SMS, voice, follow-ups, and smart inbox organization.
# Smart Communication Suite 🚀

A modular suite of Google Apps Script tools integrated with GPT and ElevenLabs APIs for automating personalized email, SMS, voice messages, and Gmail workflows — all directly from Google Sheets.

---

## 🔧 Features

### 1. 📧 Personalized Email & SMS Generator
- Uses GPT-4o-mini via Azure API to generate personalized email or text messages.
- Pulls dynamic data from Google Sheets (e.g., client info, product, context).
- Outputs emails and text messages in separate columns.

### 2. 🔊 Text-to-Speech Voice Message Generator
- Converts generated text into realistic audio using **ElevenLabs TTS API**.
- Auto-uploads `.mp3` to Google Drive and stores shareable links in the sheet.
- Two versions available:
  - **V1:** Basic embedded implementation.
  - **V2:** Configurable version for scalable use across multiple sheets.

### 3. 📨 Create Gmail Drafts from Google Sheets
- Reads recipient, subject, and email body from a sheet.
- Formats body (bolds keywords, adds line breaks, appends custom HTML signature).
- Drafts are created in Gmail and marked as “moved” in the sheet.

### 4. ⏰ Time-Controlled Email Sending
- Sends Gmail drafts in batches (up to 5 at a time).
- Only active between 6:00 PM and 2:00 AM to optimize delivery times.
- Runs every 30 minutes via a time-based trigger.

### 5. 🔁 AI-Powered Follow-Up Email Generator
- Scans Gmail threads labeled as `'1st'`.
- Uses the last sent message as context to generate a follow-up with GPT.
- Replies are created as drafts in Gmail and original labels are removed.

### 6. 🏷️ Gmail Thread Labeling by Message Count
- Analyzes sent threads and applies numeric labels (`1`, `2`, `3`, etc.).
- Helps track engagement depth across threads and organize inbox efficiently.

---

## 💡 Use Cases

- High-volume sales or client outreach
- Automated follow-up campaigns
- Personalized voice-based marketing
- CRM and relationship-focused communication
- Inbox intelligence and email engagement tracking

---

## 📁 Structure

