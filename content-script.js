chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	saveFile(request.fileName, request.fileContent);
	sendResponse({success: true});
  }
);

function saveFile(fileName, stringContent){	
	var a = document.createElement("a");
	a.href = window.URL.createObjectURL(new Blob([stringContent], {type: "text/plain"}));
	a.download = fileName;
	a.click();
	a.remove();
}

var wakeup = function(){
    setTimeout(function(){
        chrome.runtime.sendMessage('ping', function(response){
            console.log(response);
        });
        wakeup();
    }, 1000);
}
wakeup();