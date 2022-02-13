let cacheName = "Mi List";
let timer;
let list = [];
let showNotification = false;
let version = "1.63.10.72";
let appShellFiles = [
	"./src/images/black logo.png",
	"./src/images/white logo.png",
	"./src/images/menu.png",
	"./src/images/edit.png",
	"./src/images/delete.png",
	"./src/images/check.png",
	"./src/images/checked.png", 
	"./src/images/arrow head.png", 
	"./src/images/white arrow.png",
	"./src/images/black arrow.png",
	"./index.js",
	"./index.css", 
	"./index.html"
];

self.addEventListener("install", (e) => {
	e.waitUntil(
		caches.open(cacheName).then((cache) => {
			return cache.addAll(appShellFiles);
		})
	)
});

self.addEventListener("fetch", (e) => {
	respondWith (
		caches.match(e.request, {ignoreSearch: true}).then((res1) => {
			if(navigator.onLine && /(?<!min).(html|css|js)(.*?)$/g.test(e.request.url) || !res1) {
                return fetch(e.request).then((res2) => {
                    return caches.open(cacheName).then((cache) => {
                        cache.put(e.request, res2.clone());
                        return res2;
                    })
                }).catch((error) => {
                	return res1;
                })
             }
             else {
             	return res1;
             } 
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
});

self.addEventListener("message", (e) => {
	if(e.data && e.data.type == "get-version") {
		sendMsg({type: 'version', version});
	} 
	else if(e.data && e.data.type == "set-version") {
		version = e.data.version;
	} 
	else if(e.data && e.data.type == "update-list") {
		list = e.data.list;
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
	
	if(action == "check") {
		let event = notification.data.event;
		for(let item of list) {
			if(item.ms == event.ms && item.title == event.title && item.desc == event.desc) {
				item.checked = true;
				sendMsg({type: "check", list, event: item});
				break;
			} 
		} 
	} 
	else if(action == "delete") {
		let event = notification.data.event;
		for(let item of list) {
			if(item.ms == event.ms && item.title == event.title && item.desc == event.desc) {
				list.splice(list.indexOf(item), 1);
				sendMsg({type: "delete", list, event: item});
				break;
			} 
		} 
	} 
	else {
		let event = notification.data.event;
		for(let item of list) {
			if(item.ms == event.ms && item.title == event.title && item.desc == event.desc) {
				item.notified = true;
				break;
			} 
		} 
		clients.openWindow(self.location.origin + "/Mi-List/index.html");
	} 
	notification.close();
});

self.addEventListener("notificationclose", (e) => {
	let notification = e.notification;
	let event = notification.data.event;
});

function sendMsg(msg) {
	self.clients.matchAll({includeUncontrolled: true, type: 'all'}).
	then((clients) => {
		for(let client of clients) {
			client.postMessage(msg);
		} 
	});
} 

function startTimer () {
	//sendMsg({type: "report", content: "timer started"});
	clearInterval(timer);
	timer = setInterval(() => {
		for(let event of list) {
			let diff = event.ms - Date.now();
			sendMsg({type: "report", content: showNotification});
			if(diff <= 0 && diff >= -600000 && !event.notified && !event.checked) {// 10 mins 
				let desc = event.desc.length? event.desc: "Event time is up.";
				let options = {
					body: desc, 
					icon: './src/images/black favicon512.png', 
					badge: './src/images/badge500.png', 
					vibrate: [100, 50, 100], 
					requireInteraction: true, 
					data: {
						event
					}, 
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
				sendMsg({type: "time-up", event, list});
			} 
		} 
	}, 1000);
} 