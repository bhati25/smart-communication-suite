/**
 * Main function to check for duplicate emails in all Google Sheets in My Drive.
 * It considers the most recently created file as the new file,
 * and all other files as old files.
 * this take recent file and then compare with the reset of files.
 */
function checkDuplicatesAcrossSheets() {
  // Get all Google Sheets files in My Drive.
  var filesIterator = DriveApp.getFilesByType(MimeType.GOOGLE_SHEETS);
  var files = [];
  while (filesIterator.hasNext()) {
    files.push(filesIterator.next());
  }
  
  if (files.length < 2) {
    Logger.log("Need at least 2 files (new + old) to perform duplicate check.");
    return;
  }
  
  // Sort files by creation date (most recent first).
  files.sort(function(a, b) {
    return b.getDateCreated() - a.getDateCreated();
  });
  
  // Assume the most recent file is the "new" file.
  var newFile = files[0];
  var oldFiles = files.slice(1);
  
  // Build a dictionary of emails found in old files.
  // The key is the email (in lowercase) and the value is an array of file names where it appears.
  var emailDict = {};
  for (var i = 0; i < oldFiles.length; i++) {
    var ssOld = SpreadsheetApp.open(oldFiles[i]);
    var sheetsOld = ssOld.getSheets();
    for (var j = 0; j < sheetsOld.length; j++) {
      var sheetOld = sheetsOld[j];
      var dataOld = sheetOld.getDataRange().getValues();
      for (var r = 0; r < dataOld.length; r++) {
        for (var c = 0; c < dataOld[r].length; c++) {
          var cellValue = dataOld[r][c];
          if (isValidEmail(cellValue)) {
            var email = cellValue.toString().trim().toLowerCase();
            if (!emailDict[email]) {
              emailDict[email] = [];
            }
            // Save the file name (avoid duplicates in the array).
            if (emailDict[email].indexOf(oldFiles[i].getName()) === -1) {
              emailDict[email].push(oldFiles[i].getName());
            }
          }
        }
      }
    }
  }
  
  // Open the new file and process each sheet.
  var ssNew = SpreadsheetApp.open(newFile);
  var sheetsNew = ssNew.getSheets();
  
  // Create a report spreadsheet with a random suffix in the name.
  var randomSuffix = Math.random().toString(36).substring(2, 7); // 5-character random string
  var reportName = "duplicate_" + randomSuffix;
  var reportSS = SpreadsheetApp.create(reportName);
  var reportSheet = reportSS.getActiveSheet();
  reportSheet.appendRow(["Email", "Sheet Name", "Cell Position", "Duplicate Found In"]);
  
  // Loop over each sheet and cell in the new file.
  for (var j = 0; j < sheetsNew.length; j++) {
    var sheetNew = sheetsNew[j];
    var dataRangeNew = sheetNew.getDataRange();
    var dataNew = dataRangeNew.getValues();
    var numRows = dataNew.length;
    var numCols = (numRows > 0) ? dataNew[0].length : 0;
    
    for (var r = 0; r < numRows; r++) {
      for (var c = 0; c < numCols; c++) {
        var cellValue = dataNew[r][c];
        if (isValidEmail(cellValue)) {
          var email = cellValue.toString().trim().toLowerCase();
          if (email in emailDict) {
            // Construct the new cell value: list the old file name(s) followed by "_alreadysend"
            var duplicateFiles = emailDict[email].join(", ");
            var newCellValue = duplicateFiles + "_alreadysend";
            // Update the cell in the new file.
            sheetNew.getRange(r + 1, c + 1).setValue(newCellValue);
            
            // Log this duplicate in the report.
            var cellPos = sheetNew.getRange(r + 1, c + 1).getA1Notation();
            reportSheet.appendRow([email, sheetNew.getName(), cellPos, duplicateFiles]);
          }
        }
      }
    }
  }
  
  Logger.log("Duplicate check complete. Report created: " + reportSS.getUrl());
}

/**
 * Helper function to validate if a string is in email format.
 *
 * @param {string} email - The string to test.
 * @return {boolean} True if the string is a valid email.
 */
function isValidEmail(email) {
  if (typeof email !== "string") return false;
  email = email.trim();
  if (email === "") return false;
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
