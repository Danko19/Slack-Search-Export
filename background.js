async function onBeforeRequestListener(details) {
	if (!details.requestBody.formData?.module?.includes('messages') 
		|| details.requestBody.formData?.automatic?.includes('true'))
		return;

	const apiUrl = details.url.match('.*(?=search\.modules)')[0];
	const token = details.requestBody.formData.token[0];
	const query = details.requestBody.formData.query[0];
	
	const messages = await fetchAllMessages(apiUrl, token, query);
	console.log(messages);
	const users = getReactionUsers(messages);
	console.log(users);
	const userNames = await fetchUserNames(apiUrl, token, users);
	console.log(userNames);

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		console.log(tabs);
		chrome.tabs.sendMessage(tabs[0].id, {messages: messages}, function(response) {
			console.log(response.farewell);
		});
	});
}

async function fetchAllMessages(apiUrl, token, query){
	const formData = new FormData();
	formData.append('token', token);
	formData.append('query', query);
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

function getReactionUsers(messages){
	const users = new Set();
	for (const message of messages)
		for (const reaction of message.reactions)
			for (const user of reaction.users)
				users.add(user);
	return Array.from(users);
}

async function fetchUserNames(apiUrl, token, users){
	const userNames = new Map();
	const formData = new FormData();
	formData.append('token', token);
	
	for (const user of users){
		formData.set('user', user);
		var userName = await fetch(apiUrl + 'users.info', {
			method: 'POST',
			body: formData,
			credentials: 'include'
		}).then(function(r) {
			return r.json();
		}).then(function(data) {
			console.log(data);
			return data.user.name;
		});
		userNames.set(user, userName);
	}
	
	return userNames;
}

chrome.webRequest.onBeforeRequest.addListener(
	onBeforeRequestListener,
	{urls: ["https://*.slack.com/api/search.modules*"]},
	["requestBody"]
)