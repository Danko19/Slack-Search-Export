chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
    console.log(sender);
	saveFile('report.csv', JSON.stringify(request.messages));
    sendResponse({farewell: "goodbye"});
  }
);

function saveFile(fileName, stringContent){	
	var a = document.createElement("a");
	a.href = window.URL.createObjectURL(new Blob([stringContent], {type: "text/plain"}));
	a.download = fileName;
	a.click();
	a.remove();
}
