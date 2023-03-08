function doPost(e) {
  const {translateText} = JSON.parse(e.postData.contents);
  const translateResult = LanguageApp.translate(translateText, 'ja', 'en');
  return ContentService.createTextOutput(JSON.stringify({
    from: translateText,
    result: translateResult
  })).setMimeType(ContentService.MimeType.JSON);
}
