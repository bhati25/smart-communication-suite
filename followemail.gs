/**
 * Processes all Gmail threads labeled '1':
 * - Finds the last sent message in the thread.
 * - Uses that message's plain text as context for generating a follow-up email.
 * - Calls an external LLM API to get the follow-up content.
 * - Constructs a MIME message for the reply that uses lastSentMsg.getTo() for the "To:" header.
 * - Creates a draft reply using the advanced Gmail API (so the recipient is preserved).
 * - Removes the label '1' so the thread isn't reprocessed.
 * - Implements rate limiting for API calls.
 */

// Configuration variables
var API_RATE_LIMIT = 14; // API calls per minute
// Modify the Signature as per needed
var EMAIL_SIGNATURE = `
    <br><br>
    <span style="font-family: Comic Sans MS, cursive; font-size: 15pt;">Thank You so much</span>
    <br>
    <span style="font-family: Comic Sans MS, cursive; font-size: 14pt;"><b>Enter Your Name</b></span>
    <br><br>
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

function processFollowUpsDraft() {
  var label = GmailApp.getUserLabelByName('1st');
  if (!label) {
    Logger.log("Label '1st' not found.");
    return;
  }
  
  var threads = label.getThreads();
  var userEmail = Session.getActiveUser().getEmail();
  
  // Rate limiting variables
  var apiCallCount = 0;
  var startTime = new Date().getTime();
  var timeThreshold = 60000; // 1 minute in milliseconds
  
  threads.forEach(function(thread) {
    var currentTime = new Date().getTime();
    if (currentTime - startTime > timeThreshold) {
      apiCallCount = 0;
      startTime = currentTime;
    }
    if (apiCallCount >= API_RATE_LIMIT) {
      Logger.log("Rate limit reached. Skipping thread: " + thread.getId());
      return;
    }
    
    var messages = thread.getMessages();
    var lastSentMsg = null;
    // Find the last message sent by you
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].getFrom().indexOf(userEmail) !== -1) {
        lastSentMsg = messages[i];
        break;
      }
    }
    if (!lastSentMsg) {
      Logger.log("No sent message found in thread: " + thread.getId());
      return;
    }
    
    var context = lastSentMsg.getPlainBody();
    var followUpContent = getFollowUpContent(context);
    apiCallCount++;
    if (!followUpContent) {
      Logger.log("No follow-up content generated for thread: " + thread.getId());
      return;
    }
    
    // Convert newlines to <br> for proper HTML display
    var formattedContent = followUpContent.content.replace(/\n/g, "<br>");
    var emailBody = formattedContent + "<br><br>" + EMAIL_SIGNATURE;
    
    // Use lastSentMsg.getTo() to preserve the original recipient.
    var toAddress = lastSentMsg.getTo();
    var subject = "Re: " + thread.getFirstMessageSubject();
    var messageId = lastSentMsg.getId();
    
    // Construct the MIME message with proper headers.
    var rawEmail =
      "MIME-Version: 1.0\r\n" +
      "Content-Type: text/html; charset=UTF-8\r\n" +
      "Content-Transfer-Encoding: base64\r\n" +
      "To: " + toAddress + "\r\n" +
      "Subject: " + subject + "\r\n" +
      "In-Reply-To: " + messageId + "\r\n" +
      "References: " + messageId + "\r\n\r\n" +
      emailBody;

    // Convert rawEmail to a Blob with UTF-8 encoding, then encode its bytes.
    var encodedEmail = Utilities.base64EncodeWebSafe(
      Utilities.newBlob(rawEmail, "text/html", "utf-8").getBytes()
    );


    try {
      // Create a draft reply using the advanced Gmail API.
      var draft = Gmail.Users.Drafts.create(
        {
          message: {
            threadId: thread.getId(),
            raw: encodedEmail
          }
        },
        "me"
      );
      
      Logger.log("Draft reply created for thread: " + thread.getId());
      thread.removeLabel(label);
    } catch (e) {
      Logger.log("Error creating draft reply for thread " + thread.getId() + ": " + e);
    }
  });
}

/**
 * Calls an external LLM API to generate a follow-up email body.
 * The API is expected to return a JSON response.
 * This version extracts only the "content" field from the API response and returns it.
 */
function getFollowUpContent(context) {
  var token = "enter_your_token_here"; 

  var payload = {
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates professional follow-up email content. I don't receive the response yet, that's the reason for writing follow-up again. You have to Write the next follow up, don't copy and paste my last follow-up email, Generate the new one, use the context of previously send emails. Bold the Impotant words. Please generate the email body text that includes a greeting on the first line (for example, 'Hey John,'), followed by a blank line, then the main body text, and finally a blank line followed by a closing sentence (for example, 'Looking forward to your response.'). Do not include any subject line, closing salutations like 'Best regards,' or any signature block. add these details into followup “It should be professional, clear, and direct while keeping a polite tone. In the beginning of email one personalised question based upon the last email to boost engagement. I’m also open to working on commission if that’s easier. I’m genuinely trying to break into the luxury. Start with this line I know you're incredibly busy and probably get a lot of messages, so I’ll keep this to 60 seconds, and ends with this I completely understand you may not have time to respond — but even a one- or two-line reply would genuinely make my day."
      },
      { role: "user", content: context }
    ],
    temperature: 1.0,
    top_p: 1.0,
    max_tokens: 1000,
    model: "gpt-4.1-mini" //change to model which you want to use
  };
  
  var url = "https://models.inference.ai.azure.com/chat/completions";
  
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + token
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
  var response = UrlFetchApp.fetch(url, options);
  var result = JSON.parse(response.getContentText());
  if (result.choices && result.choices.length > 0) {
    var content = result.choices[0].message.content;
    
    // Process text between asterisks:
    // - If fewer than 3 words, wrap in <b> tags.
    // - If 3 or more words, simply remove the asterisks.
    content = content.replace(/\*([^*]+)\*/g, function(match, p1) {
      var innerWords = p1.trim().split(/\s+/);
      if (innerWords.length < 3) {
        return "<b>" + p1 + "</b>";
      } else {
        return p1;
      }
    });
    
    // Remove any stray asterisks that might remain
    content = content.replace(/\*/g, "");
    
    // Bold specific words from a predefined list.
    var wordsToBold = ["SBA loans", "Unsecured working capital", "Asset-based", "US Government Grants", 
    "tax credits"]; // Add any words you want to bold.
    wordsToBold.forEach(function(word) {
      // Use word boundaries and ignore case
      // var regex = new RegExp("\\b(" + word + ")\\b", "gi");
      var regex = new RegExp("(?<!<b>)\\b(" + word + ")\\b(?!</b>)", "gi");
      content = content.replace(regex, "<b>$1</b>");
    });
    
    return { content: content };
  } else {
    return { content: "No email body generated." };
  }
} catch(e) {
  return { content: "Error calling AI model: " + e.toString() };
  }
}