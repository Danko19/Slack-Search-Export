var onBeforeRequestListener = function(details) {
	if (!details.requestBody.formData?.module?.includes('messages') 
		|| details.requestBody.formData?.automatic?.includes('true'))
		return;
	console.log(details);

	const apiUrl = details.url.match('.*(?=search\.modules)')[0];
	console.log(apiUrl);

	const formData = new FormData();
	formData.append('token', details.requestBody.formData.token[0]);
	formData.append('query', details.requestBody.formData.query[0]);
	formData.append('extra_message_data', '1');
	formData.append('module', 'messages');
	formData.append('automatic', true);
	formData.append('count', 100);
	
	var messages = [];
	var total = 0;
	var page = 1;
	
	FetchAllMessages().then(() => console.log(messages));
	
	function FetchAllMessages(){
		formData.set('page', page++);
		return fetch(apiUrl + 'search.modules', {
			method: 'POST',
			body: formData,
			credentials: 'include'
		}).then(function(r) {
			return r.json();
		}).then(function(data) {
			for(var item of data.items)
				messages.push(item.messages[0]);
			if (messages.length < data.pagination.total_count)
				return FetchAllMessages();
		});		
	}
	
	function 
}

chrome.webRequest.onBeforeRequest.addListener(
	onBeforeRequestListener,
	{urls: ["https://*.slack.com/api/search.modules*"]},
	["requestBody"]
)