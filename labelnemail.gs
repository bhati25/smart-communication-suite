function labelAllSentThreadsByTotalMessageCount() { 
  var query = "in:sent";
  var batchSize = 100; // Number of threads to process per iteration.
  var start = 0;
  var threads;

  do {
    threads = GmailApp.search(query, start, batchSize);
    
    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];
      var messages = thread.getMessages();
      var messageCount = messages.length; // Total messages (sent and received)
      var correctLabelName = messageCount.toString();

      // Retrieve or create the correct label based on the message count.
      var correctLabel = GmailApp.getUserLabelByName(correctLabelName);
      if (!correctLabel) {
        correctLabel = GmailApp.createLabel(correctLabelName);
      }
      
      // Check current labels and remove any numeric labels that don't match.
      var currentLabels = thread.getLabels();
      var correctLabelApplied = false;
      for (var j = 0; j < currentLabels.length; j++) {
        var existingLabel = currentLabels[j];
        var labelName = existingLabel.getName();
        
        // Process only labels that are purely numeric.
        if (/^\d+$/.test(labelName)) {
          if (labelName !== correctLabelName) {
            // Remove the incorrect numeric label.
            thread.removeLabel(existingLabel);
          } else {
            // The correct label is already applied.
            correctLabelApplied = true;
          }
        }
      }
      
      // If the correct label was not applied, add it.
      if (!correctLabelApplied) {
        thread.addLabel(correctLabel);
      }
    }
    
    start += batchSize;
  } while (threads.length === batchSize);
}
