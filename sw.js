importScripts("./src/localforage.js");

let version = "78";
let cacheName = "Mi List-v: " + version;
let Settings = {};
let Tasks = [];
let IT = null;
let Notified = [];
let appShellFiles = [
	"./src/images/logo.png",
	"./src/images/search.png", 
	"./src/images/menu.png",
	"./src/images/edit.png",
	"./src/images/delete.png",
	"./src/images/cancel.png",
	"./src/images/arrow.png",
	"./src/images/calendar.png", 
	"./src/images/clock.png", 
	"./src/images/clear.png", 
	"./src/images/notification.png", 
	"./src/images/category.png", 
	"./src/images/category add.png", 
	"./src/images/repeat.png",
	"./src/images/repeat add.png", 
	"./src/images/home.png", 
	"./src/images/finished.png", 
	"./src/images/rest.png", 
	"./src/images/black favicon512.png", 
	"./src/images/black favicon256.png", 
	"./src/images/black favicon192.png", 
	"./src/images/black favicon144.png", 
	"./src/images/black favicon96.png", 
	"./src/images/black favicon48.png", 
	"./src/images/black favicon32.png", 
	"./src/images/black favicon16.png", 
	"./src/images/favicon badge.ico", 
	"./src/images/badge.png", 
	"./src/images/black add.png",
	"./src/images/black categories.png",
	"./src/images/black settings.png", 
	"./src/localforage.js", 
	"./src/version.js", 
	"./src/app.js", 
	"./src/app.css",
	"./manifest.webmanifest", 
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
	e.respondWith (
		caches.match(e.request, {ignoreSearch: true}).then((res) => {
			if(res && !/html|css|js.*$/gi.test(e.request.url)) {
            	return res;
            }
            
            return fetch(e.request).then((res2) => {
            	if(res2.status != 200) {
	            	return res || res2;
            	} 
            	
                return caches.open(cacheName).then((cache) => {
                    cache.put(e.request, res2.clone());
                    return res2;
                }).catch((error) => {
					return res2;
				});
            }).catch((error) => {
            	return res || new Response(null, {"status": 200});
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
});

self.addEventListener("message", async (e) => {
	if(e.data && e.data.type == "stop-worker") {
		clearInterval(IT);
	} 
	else if(e.data && e.data.type == "skip-waiting") {
		self.skipWaiting();
	} 
	else if(e.data && e.data.type == "init-storage") {
		localforage.config({
	    	name: "Mi-List"
	    });
		await localforage.ready();
		let clicked = await localforage.getItem("clicked");
		if(clicked) {
			await sendMsg({type: "click", task: clicked});
			await localforage.removeItem("clicked");
		} else {
			Tasks = [];
			Settings = {};
			await getDueTasks();
		} 
	} 
	else if(e.data && e.data.type == "get-due-tasks") {
		await getDueTasks();
	} 
});

self.addEventListener("notificationclick", async (e) => {
	let notification = e.notification;
	let action = e.action;
	notification.close();
	
	let index = Notified.findIndex((t) => JSON.stringify(t) == JSON.stringify(notification.data));
	Notified.splice(index, 1);
	if(action == "finish") {
		let task = notification.data;
		let ctgr = task.category.value;
		if(ctgr == "quick") {
			let tasks = await localforage.getItem("quick");
			let index = tasks.findIndex((t) => JSON.stringify(t) == JSON.stringify(task));
			if(~index) {
				tasks.splice(index, 1);
				await localforage.setItem("quick", tasks);
			} 
			let finished = await localforage.getItem("finished");
			finished = new Map(finished);
			tasks = finished.get("quick");
			tasks.push(task);
			await localforage.setItem("finished", [...finished.entries()]);
			sendMsg({type: "update-ui"});
		} 
		else {
			let categories = await localforage.getItem("default");
			categories = new Map(categories);
			let tasks = categories.get(ctgr);
			let index = tasks.findIndex((t) => JSON.stringify(t) == JSON.stringify(task));
			if(~index) {
				tasks.splice(index, 1);
				await localforage.setItem("default", [...categories.entries()]);
			} 
			let finished = await localforage.getItem("finished");
			finished = new Map(finished);
			tasks = finished.get("default");
			tasks.push(task);
			await localforage.setItem("finished", [...finished.entries()]);
			sendMsg({type: "update-ui"});
		} 
	} 
	else if(action == "delete") {
		let task = notification.data;
		let ctgr = task.category.value;
		if(ctgr == "quick") {
			let tasks = await localforage.getItem("quick");
			let index = tasks.findIndex((t) => JSON.stringify(t) == JSON.stringify(task));
			if(~index) {
				tasks.splice(index, 1);
				await localforage.setItem("quick", tasks);
				sendMsg({type: "update-ui"});
			} 
		} 
		else {
			let categories = await localforage.getItem("default");
			categories = new Map(categories);
			let tasks = categories.get(ctgr);
			let index = tasks.findIndex((t) => JSON.stringify(t) == JSON.stringify(task));
			if(~index) {
				tasks.splice(index, 1);
				await localforage.setItem("default", [...categories.entries()]);
				sendMsg({type: "update-ui"});
			} 
		} 
	} 
	else {
		e.waitUntil(self.clients.matchAll({type: "window"}).
		then(async (clients) => {
			for(let client of clients) {
				if(client.url == self.location.href.replace(/sw.js$/, "index.html") && 'focus' in client) 
					await client.focus();
					return sendMsg({type: "click", task: notification.data});
			} 
			if('openWindow' in self.clients) {
				await localforage.setItem("clicked", notification.data);
				let client = await self.clients.openWindow(self.location.href.replace(/sw.js$/, "index.html"));
				if('focus' in client) 
					await client.focus();
				return;
			} 
		}));
	} 
	clearInterval(IT);
	getDueTasks();
});

self.addEventListener("notificationclose", (e) => {
	getDueTasks();
});

self.addEventListener("periodicsync", async (e) => {
	console.log("Sync event");
	if(e.tag == "get-due-tasks") {
		localforage.config({
	    	name: "Mi-List"
	    });
		await localforage.ready();
		Tasks = [];
		Settings = {};
		await getDueTasks();
	} 
});

function sendMsg(msg) {
	self.clients.matchAll({type: 'window'}).
	then((clients) => {
		for(let client of clients) {
			client.postMessage(msg);
		} 
	});
}

async function getDueTasks () {
	Notified = [];
	clearInterval(IT);
	let settings = await localforage.getItem("settings");
	if(settings) Settings = settings;
	else return null;
	
	let tasks = await localforage.getItem("finished");
	let finishedTasks = new Map(tasks);
	tasks = [...finishedTasks.values()].flat(Infinity);
	for(let task of tasks) {
		if(Date.now() - new Date((task.date? task.date.value: new Date().toISOString().split("T")[0]) + "T" + task.time.value).getTime() >= 24 * 7 * 60 * 60 * 1000) {
			let values = finishedTasks.get((task.category.value == "quick"? "quick": "default"));
			let index = values.findIndex((t) => JSON.stringify(t) == JSON.stringify(task));
			values.splice(index, 1);
		} 
	} 
	await localforage.setItem("finished", finishedTasks);
	await sendMsg({type: "update-ui"});
	
	tasks = await localforage.getItem("default");
	if(tasks) Tasks.push(...[...new Map(tasks).values()].flat(Infinity));
	else return null;
	
	tasks = await localforage.getItem("quick");
	if(tasks) Tasks.push(...tasks);
	else return null;
	
	let todayTasks = Tasks.filter((task) => {
		return new Date(task.date.value).toDateString() == new Date().toDateString();
	});
	if(!todayTasks.length) return null;
	return await findTask(todayTasks);
}

async function findTask (tasks) {
	return new Promise((resolve) => {
		IT = setInterval(async () => {
			for(let task of tasks) {
				let now = Date.now();
				let taskMs = task.type == "default"? new Date(task.date.value + "T" + task.time.value).getTime(): new Date(new Date().toISOString().replace(/T.+$/gi, task.time.value));
				let noteMs = parseInt(task.notification.value) * 60 * 1000;
				if(now >= Math.abs(taskMs - noteMs) && now <= taskMs + (60 * 1000)) {
					let notified = Notified.some((t) => JSON.stringify(t) == JSON.stringify(task));
					if(Settings.notification && !notified) {
						let options = {
							body: convertTo(task.time.value, 12).replace(/^0/, ''),
							data: task, 
							tag: (task.task? task.task.value: task.title.value), 
							icon: "./src/images/favicon.ico", 
							badge: "./src/images/badge.png", 
							actions: [
								{action: 'finish', title: 'Finish', icon: "./src/images/finished.png"}, 
								{action: 'delete', title: 'Delete', icon: "./src/images/delete.png"}
							]
						} 
						self.registration.showNotification((task.task? task.task.value: task.title.value), options);
						sendMsg({type: "due", task});
						tasks.splice(tasks.indexOf(task), 1);
						Notified.push(task);
					} 
				} 
				else if(taskMs > now) {
					tasks.splice(tasks.indexOf(task), 1);
					await sendMsg({type: "update-ui"});
				} 
			} 
			if(tasks.length == 0) {
				clearInterval(IT);
				resolve("done");
			}
		}, 30000)
	});
} 

const convertTo = (time, to, includeSec = false) => {
	try {
		let hr = parseInt(time.split(":")[0]);
		let min = time.split(" ")[0].split(":")[1];
		let sec = time.split(" ")[0].split(":")[2] || "00";
		let converted = "";
		if(to == 24) {
			let prd = time.split(" ")[1];
			if(prd == "PM" && hr < 12) {
				converted = String((hr + 12)).padStart(2, "0") + ":" + min + (includeSec? ":" + sec: "");
			} 
			else if(prd == "AM" && hr == 12) {
				converted = "00:" + min + (includeSec? ":" + sec: "");
			} 
			else {
				converted = String(hr).padStart(2, "0") + ":" + min + (includeSec? ":" + sec: "");
			} 
		} 
		else if(to == 12) {
			if(hr == 0) {
				converted = "12:" + min + (includeSec? ":" + sec: "") + " AM";
			} 
			else if(hr > 12) {
				converted = String((hr - 12)).padStart(2, "0") + ":" + min + (includeSec? ":" + sec: "") + " PM";
			} 
			else if(hr == 12) {
				converted = String(hr).padStart(2, "0") + ":" + min  + (includeSec? ":" + sec: "") + " PM";
			} 
			else {
				converted = String(hr).padStart(2, "0") + ":" + min  + (includeSec? ":" + sec: "") + " AM";
			} 
		} 
		else if(to == "s") {
			let prd = time.split(" ")[1];
			if(prd) 
			time = convertTo(time, 24, true);
			time = time.split(":");
			let hr = parseInt(time[0]);
			let min = parseInt(time[1]);
			let sec = parseInt(time[2]);
			
			let converted = (hr*3600) + (min * 60) + sec;
		} 
		return converted;
	} catch (error) {
		reportError(error);
	} 
}

