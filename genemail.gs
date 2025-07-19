function Gen(M2, I2, J2, K2, N2, O2, P2, Q2, R2, S2, T2, U2, V2, W2, X2, Y2, Z2) {
  var token = "enter your github token"; 
  
  var promptText = 
    "" //Enter the prompt, prompt needs to change as per the requirements. Also the change Coloum row as per requirements, based upon your google sheets
    // "Use the following client details to personalize the email/text message: " +
    // M2 + ", " + I2 + ", " + J2 + ", " + K2 + ", " + N2 + ", " + O2 + ", " + P2 + ", " + Q2 + ", " + R2 + ", " + S2 + ", " + T2 + ", " + U2 + ", " + V2 + ", " + W2 + ", " + X2 + ", " + Y2 + ", " + Z2 + ". " +
    // ""
  
  var payload = {
    messages: [
      { role: "system", content: "You are a helpful assistant that generates professional Human like and more relationship-focused email content." },
      { role: "user", content: promptText }
    ],
    temperature: 1.0,
    top_p: 1.0,
    max_tokens: 1000,
    model: "gpt-4o-mini"
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
      return result.choices[0].message.content;
    } else {
      return "Nothing generated.";
    }
  } catch(e) {
    return "Error calling AI model: " + e.toString();
  }
}
