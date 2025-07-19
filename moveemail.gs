function createDraftEmailsFromSheet() {
  // Set your spreadsheet ID and sheet name here
  // var sheetId = "Sheet_ID"; // Replace with your sheet ID
  var sheetName = "Sheet1"; // Replace with your sheet name
  
  // Open the spreadsheet by its ID and select the sheet by name
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log("Sheet with name '" + sheetName + "' not found.");
    return;
  }
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return; // Exit if there's no data (only header present)
  
  // Retrieve all rows of data starting from row 2 (skip header row)
  var dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  var data = dataRange.getValues();
  
  var draftsCreated = 0;
  
  // Define your custom signature using HTML:
  // The text "Best regards, or Thank you" your name, and your position appear first,
  // then a table displays clickable images in a row with centered captions.
  // modify as needed
  var signature = `
    <br><br>
    <br><br>
    <span style="font-family: Comic Sans MS, cursive; font-size: 15pt;">Thank You so much</span>
    <br>
    <span style="font-family: Comic Sans MS, cursive; font-size: 14pt;"><b>Enter Your Name</b></span>
    <br>
    <table align="left">
      <tr>
        <td style="text-align: center;">
          <a href="https://www.linkedin.com/in/" target="_blank">
            <img src="https://drive.google.com/uc?export=view&id=1IIoEQI8Cp7oYtvXcE30Ai2YNMcLSIMmP" width="48" height="48" alt="LinkedIn" style="display: block; margin: 0 auto;"/>
            <div style="font-family: Arial, sans-serif; font-size: 10pt; text-align: center;">LinkedIn</div>
          </a>
        </td>
        <td style="text-align: center;">
          <a href="mailto:email@gmail.com" target="_blank">
            <img src="https://drive.google.com/uc?export=view&id=1XU05XerED19vwj_T_uLVxvi1oDkcyqAg" width="48" height="48" alt="Email" style="display: block; margin: 0 auto;"/>
            <div style="font-family: Arial, sans-serif; font-size: 10pt; text-align: center;">Email</div>
          </a>
        </td>
      </tr>
    </table>
  `;
  
  // Process each row (up to your desired limit) that hasn't been marked as "moved"
  for (var i = 0; i < data.length && draftsCreated < 20; i++) {
    var row = data[i];
    
    // Check if the row has already been processed (column E, index 4)
    if (row[7].toString().toLowerCase() === "moved") {
      continue;
    }
    
    var email = row[5];    // Column C: recipient email
    var content = row[6];  // Column F: combined subject and body
    
    if (email && content) {
      // Split the content by newlines
      var lines = content.split('\n');
      
      // The first line is assumed to be the subject, possibly starting with "Subject:"
      var subjectLine = lines[0].trim();
      var subject = subjectLine;
      if (subjectLine.toLowerCase().startsWith("subject:")) {
        subject = subjectLine.substring("subject:".length).trim();
      }
      
      // The remaining lines form the body
      var body = lines.slice(1).join('\n').trim();
      if (!body) {
        body = content;
      }
      
      // Remove all asterisks
      body = body.replace(/\*/g, "");
      
      // Bold any text between the "✅" emoji and the next colon.
      body = body.replace(/✅(.*?):/g, "✅<b>$1</b>:");
      
      // Bold specific keywords if found.
      // modify as needed
      var keywords = [
        "Sales",
        "Real Estate",
        "Real Estate Sales",
      ];
      
      for (var j = 0; j < keywords.length; j++) {
        var kw = keywords[j];
        // Escape special regex characters in the keyword.
        var escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re = new RegExp(escapedKw, "g");
        body = body.replace(re, "<b>" + kw + "</b>");
      }
      
      // Append the signature to the body and replace newline characters with <br>
      var formattedBody = body.replace(/\n/g, "<br>") + signature;
      var htmlBody = "<html><body>" + formattedBody + "</body></html>";
      
      // Create a draft email in Gmail with the HTML content
      GmailApp.createDraft(email, subject, body, { htmlBody: htmlBody });
      
      // Mark the row in column E (5th column) as "moved"
      sheet.getRange(i + 2, 8).setValue("moved");
      
      draftsCreated++;
    }
  }
}
