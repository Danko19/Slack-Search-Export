async function onBeforeRequestListener(details) {
	if (!details.requestBody.formData?.module?.includes('messages') 
		|| details.requestBody.formData?.automatic?.includes('true'))
		return;

	const apiUrl = details.url.match('.*(?=search\.modules)')[0];
	const token = details.requestBody.formData.token[0];
	const query = details.requestBody.formData.query[0];
	
	const messages = await fetchAllMessages(apiUrl, token, query);
	const users = getReactionUsers(messages);
	const userNames = await fetchUserNames(apiUrl, token, users);
	const reportContent = buildReport(messages, userNames);
	await saveFileRequest('search_export.csv', reportContent);
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
		for (const reaction of message.reactions ?? new Array())
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
			return data.user.name;
		});
		userNames.set(user, userName);
	}
	
	return userNames;
}

function buildReport(messages, userNames){
	const lineBreak = '\n';
	const separator = ';';	
	const report = [];
	
	appendLine('UserName', 'MessageText', 'MessageDate', 'MessageLink', 'ReactionsCount', 'ReactionsUsers');
	
	for(var message of messages){
		var userName = message.username;
		var messageText = message.text;
		var messageDate = getDateTimeString(message.ts.split('.')[0]);
		var messageLink = message.permalink;
		var reactionsUsers = message.reactions
			.filter(reaction => reaction.name.startsWith('muscle') || reaction.name === 'mechanical_arm')
			.map(reaction => reaction.users)
			.reduce((a, b) => a.concat(b))
			.filter((item, pos, self) => self.indexOf(item) == pos)
			.map(user => userNames.get(user));
		var reactionsCount = reactionsUsers.length.toString();
		appendLine(userName, messageText, messageDate, messageLink, reactionsCount, reactionsUsers.join(','));
	}
	
	return report.map(line => line.map(value => value.replaceAll(separator, '').replaceAll(lineBreak, '')).join(separator)).join(lineBreak);
	
	function appendLine(userName, messageText, messageDate, messageLink, reactionsCount, reactionsUsers){
		report.push([userName, messageText, messageDate, messageLink, reactionsCount, reactionsUsers]);
	}
}

function getDateTimeString(unixTimestamp){
	return new Date(unixTimestamp * 1000).toISOString();
}

function saveFileRequest(fileName, fileContent){
	return chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {fileName: fileName, fileContent: fileContent});
	});
}

chrome.webRequest.onBeforeRequest.addListener(
	onBeforeRequestListener,
	{urls: ["https://*.slack.com/api/search.modules*"]},
	["requestBody"]
)