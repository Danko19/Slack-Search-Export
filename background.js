async function onBeforeRequestListener(details) {
	if (!details.requestBody.formData?.module?.includes('messages') 
		|| details.requestBody.formData?.automatic?.includes('true'))
		return;

	const messages = await fetchAllMessages(details);
	console.log(messages);
}

async function fetchAllMessages(details){
	const apiUrl = details.url.match('.*(?=search\.modules)')[0];
	
	const formData = new FormData();
	formData.append('token', details.requestBody.formData.token[0]);
	formData.append('query', details.requestBody.formData.query[0]);
	formData.append('extra_message_data', '1');
	formData.append('module', 'messages');
	formData.append('automatic', true);
	formData.append('count', 100);
	
	var messages = [];
	var total = 0;
	var pageNumber = 1;
	
	do{
		formData.set('page', pageNumber++);
		var page = await fetch(apiUrl + 'search.modules', {
			method: 'POST',
			body: formData,
			credentials: 'include'
		}).then(function(r) {
			return r.json();
		}).then(function(data) {
			total = data.pagination.total_count;
			return data.items.map(item => item.messages[0]);
		});		
		messages = messages.concat(page);
	} while (messages.length < total);
	
	return messages;
}

chrome.webRequest.onBeforeRequest.addListener(
	onBeforeRequestListener,
	{urls: ["https://*.slack.com/api/search.modules*"]},
	["requestBody"]
)