const ELEVENLABS_API_KEY = 'enter_api_key';
const ELEVENLABS_VOICE_ID = '1SM7GgM6IMuvQlz2BwM3';  // e.g. 'EXAVITQu4vr4xnSDxMaL'

function generateVoiceMessages() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(2, 5, lastRow - 1, 3).getValues();  // From row 2, columns E-G

  const folder = getOrCreateFolder_("ElevenLabsMessages");
// changes as per needed
  for (let i = 0; i < data.length; i++) {
    const rowIndex = i + 2;  // Row in sheet
    const message = data[i][0];   // Column E
    const audioUrl = data[i][1];  // Column F
    const status = data[i][2];    // Column G

    if (!message || audioUrl) {
      sheet.getRange(rowIndex, 7).setValue("Skipped");  // G
      continue;
    }

    const audioBlob = callElevenLabsTTS(message);
    if (!audioBlob) {
      sheet.getRange(rowIndex, 7).setValue("Error");  // G
      continue;
    }

    const filename = `VoiceMessage_Row${rowIndex}_${new Date().getTime()}.mp3`;
    const file = folder.createFile(audioBlob.setName(filename));
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const publicUrl = file.getUrl();

    sheet.getRange(rowIndex, 6).setValue(publicUrl);  // F
    sheet.getRange(rowIndex, 7).setValue("Generated");  // G
  }
}

function callElevenLabsTTS(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;

  const payload = {
    text: text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.4,
      similarity_boost: 0.7
    }
  };

  const options = {
    method: "post",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      return response.getBlob();
    } else {
      Logger.log("Error: " + response.getContentText());
      return null;
    }
  } catch (e) {
    Logger.log("Exception: " + e);
    return null;
  }
}

function getOrCreateFolder_(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}
