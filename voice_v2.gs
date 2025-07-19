// ======= CONFIGURATION =======
// Uncomment and fill in your target sheet here:
const SHEET_ID   = 'YOUR_SHEET_ID_HERE';
// const SHEET_ID   = 'YOUR_SHEET_ID_HERE';
const SHEET_NAME = 'Sheet1';
// const SHEET_NAME = 'YOUR_SHEET_NAME_HERE';

// ======= MAIN ENTRY POINT =======
function generateVoiceMessages() {
  if (!SHEET_ID || !SHEET_NAME) {
    throw new Error('Please set SHEET_ID and SHEET_NAME at the top of the script.');
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID)
                              .getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`No sheet named "${SHEET_NAME}" found in spreadsheet ${SHEET_ID}`);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;  // nothing to do

  const rows = sheet.getRange(2, 5, lastRow - 1, 3).getValues();  // columns E (msg), F (url), G (status)
  const folder = getOrCreateFolder_('ElevenLabsMessages');

  rows.forEach((row, idx) => {
    const rowNum   = idx + 2;
    const message  = row[0];
    const audioUrl = row[1];

    // skip if no message or already has a URL
    if (!message || audioUrl) {
      sheet.getRange(rowNum, 7).setValue('Skipped');
      return;
    }

    // call TTS
    const blob = callElevenLabsTTS(message);
    if (!blob) {
      sheet.getRange(rowNum, 7).setValue('Error');
      return;
    }

    // save file, set URL + status
    const filename = `Voice_Row${rowNum}_${Date.now()}.mp3`;
    const file     = folder.createFile(blob.setName(filename));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    sheet.getRange(rowNum, 6).setValue(file.getUrl());
    sheet.getRange(rowNum, 7).setValue('Generated');
  });
}


// ======= ELEVENLABS TTS CALL =======
function callElevenLabsTTS(text) {
  const API_KEY  = 'enter_your_api_key';
  const VOICE_ID = '1SM7GgM6IMuvQlz2BwM3'; //get the voice id from the elevenlabs
  const url      = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

  const payload = {
    text:     text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability:        0.4,
      similarity_boost: 0.7
    }
  };

  const options = {
    method:            'post',
    muteHttpExceptions:true,
    headers: {
      // Use XI-API-KEY exactly like this:
      "xi-api-key":    API_KEY,
      "Content-Type":  "application/json"
    },
    payload: JSON.stringify(payload)
  };

  try {
    const res = UrlFetchApp.fetch(url, options);
    if (res.getResponseCode() === 200) {
      return res.getBlob();
    } else {
      Logger.log(`TTS Error (${res.getResponseCode()}): ${res.getContentText()}`);
      return null;
    }
  } catch (e) {
    Logger.log('TTS Exception: ' + e);
    return null;
  }
}


// ======= DRIVE FOLDER HELPER =======
function getOrCreateFolder_(name) {
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}
