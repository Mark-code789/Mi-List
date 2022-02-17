let version = "63";
let cacheName = "Mi List-v:" + version;
let timer;
let list = [];
let showNotification = false;
let appShellFiles = [
	"./src/images/black logo.png",
	"./src/images/white logo.png",
	"./src/images/menu.png",
	"./src/images/edit.png",
	"./src/images/delete.png",
	"./src/images/check.png",
	"./src/images/checked.png", 
	"./src/images/check icon.png", 
	"./src/images/delete icon.png", 
	"./src/images/arrow head.png", 
	"./src/images/white arrow.png",
	"./src/images/black arrow.png",
	"./src/images/black favicon512.png", 
	"./src/images/black favicon256.png", 
	"./src/images/black favicon192.png", 
	"./src/images/black favicon144.png", 
	"./src/images/black favicon96.png", 
	"./src/images/black favicon48.png", 
	"./src/images/black favicon32.png", 
	"./src/images/black favicon16.png", 
	"./src/images/favicon badge.ico", 
	"./src/images/badge500.png", 
	"./index.js",
	"./index.css", 
	"./index.html", 
	"./manifest.webmanifest", 
	"./"
];

self.addEventListener("install", (e) => {
	e.waitUntil(
		caches.open(cacheName).then((cache) => {
			return cache.addAll(appShellFiles);
		})
	)
});

self.addEventListener("fetch", (e) => {
	e.respondWith (
		caches.match(e.request, {cacheName, ignoreSearch: true}).then((res) => {
			if(res) {
            	return res;
            }
            else {
            	console.log(e.request.url);
            } 
            
            return fetch(e.request).then((res2) => {
            	if(!res2 || res2.status != 200) {
            		return res2;
            	} 
            	
                caches.open(cacheName).then((cache) => {
                    cache.put(e.request, res2.clone());
                }).cstch((error) => {
					console.log(error);
				});
                
                return res2;
            }).catch((error) => {
            	return res;
            });
		})
	)
});

self.addEventListener("activate", (e) => {
    const keepList = [cacheName];
    
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if(keepList.indexOf(key) === -1) {
                    return caches.delete(key);
                } 
            }))
        })
    )
    
    //self.clients.claim();
});

self.addEventListener("message", (e) => {
	if(e.data && e.data.type == "skip-waiting") {
		self.skipWaiting();
	} 
	else if(e.data && e.data.type == "update-list") {
		list = e.data.list;
		//sendMsg({type: "report", content: showNotification});
	} 
	else if(e.data && e.data.type == "notification") {
		showNotification = e.data.notification;
	} 
	else if(e.data && e.data.type == "start-timer") {
		startTimer();
	} 
	else if(e.data && e.data.type == "get-list") {
		sendMsg({type: "list", list});
	} 
});

self.addEventListener("notificationclick", (e) => {
	let notification = e.notification;
	let action = e.action;
	notification.close();
	
	if(action == "check") {
		let event = notification.data.event;
		let tag = notification.tag;
		list[tag].checked = true;
		sendMsg({type: "check", list, event, tag});
	} 
	else if(action == "delete") {
		let event = notification.data.event;
		let tag = notification.tag;
		list.splice(tag, 1);
		sendMsg({type: "delete", list, event, tag});
	} 
	else {
		let event = notification.data.event;
		let tag = notification.tag;
		list[tag].notified = true;
		sendMsg({type: "check", list, event, tag});
		
		e.waitUntil(self.clients.matchAll({type: "window"}).
		then((clients) => {
			for(let client of clients) {
				if(client.url == '/' && 'focus' in client) 
					return client.focus();
			} 
			if(clients.openWindow)
				return clients.openWindow('/');
		}));
	} 
});

self.addEventListener("notificationclose", (e) => {
	let notification = e.notification;
	let event = notification.data.event;
});

function sendMsg(msg) {
	self.clients.matchAll({type: 'window'}).
	then((clients) => {
		for(let client of clients) {
			client.postMessage(msg);
		} 
	});
} 

function startTimer () {
	clearInterval(timer);
	timer = setInterval(() => {
		sendMsg({type: "report", content: "counting"});
		for(let event of list) {
			let diff = event.ms - Date.now();
			let tag = list.indexOf(event);
			if(diff <= 0 && diff >= -600000 && !event.notified && !event.checked) {// 10 mins 
				let desc = event.desc.length? event.desc: "Event time is up.";
				let options = {
					body: desc, 
					icon: './src/images/black favicon512.png', 
					badge: './src/images/badge500.png', 
					vibrate: [100, 50, 100], 
					data: {
						event
					}, 
					tag, 
					actions: [
						{
							action: "check", 
							title: "CHECK", 
							icon: "./src/images/check icon.png"
						}, 
						{
							action: "delete", 
							title: "DELETE", 
							icon: "./src/images/delete icon.png"
						}
					]
				} 
				if(showNotification) {
					self.registration.showNotification(event.title, options);
				} 
				event.notified = true;
				sendMsg({type: "time-up", tag, event, list});
			} 
			else if(diff <= -86400000) {
				list.splice(tag, 1);
				sendMsg({type: "expired", tag, event, list});
			} 
		} 
	}, 1000);
} 