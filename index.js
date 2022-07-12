const ShowInstallPrompt = () => {
	$(".install").style.display = "block";
    $(".install_body").classList.remove("hide_install_prompt");
    $(".install_body").classList.add("show_install_prompt");
} 

const HideInstallPrompt = () => {
    $(".install_body").classList.remove("show_install_prompt");
    $(".install_body").classList.add("hide_install_prompt");
    setTimeout(() => {
		$(".install").style.display = "none";
		deferredEvent = null;
		if(reg.waiting)
			InvokeSWUpdateFlow();
	}, 600);
} 

const InstallApp = async () => {
    deferredEvent.prompt();
    const {outcome} = await deferredEvent.userChoice;
    if(outcome === 'accepted') {
        Notify.popUpNote("Installation successfully");
    } 
    else {
        Notify.popUpNote("Installation canceled");
    } 
    HideInstallPrompt();
} 

window._$ = (elem, property) => {
	let value = window.getComputedStyle(elem, null).getPropertyValue(property);
	return value;
} 

window.$ = (elem) => {
    return document.querySelector(elem);
} 

window.$$ = (elem) => {
    return document.querySelectorAll(elem);
}

window.$$$ = (type, data = []) => {
	if(!Array.isArray(data)) {
		throw new Error("Data object passed is not an array. At $$$ line: 658");
	} 
    let elem = document.createElement(type);
    for(let i = 0; i < data.length; i+=2) {
    	if(/^(innerHTML|textContent)$/gi.test(data[i]))
    		elem[data[i]] = data[i+1];
    	else
    		elem.setAttribute(data[i], data[i+1]);
    } 
    return elem;
} 
Element.prototype.$ = function (elem) {
	return this.querySelector(elem);
} 
Element.prototype.$$ = function (elem) {
	return this.querySelectorAll(elem);
} 

let deferredEvent;
let reg;

function pageComplete () {
	document.addEventListener("visibilitychange", (e) => {
		if(document.visibilityState == "visible") {
			SendMsg({type: "get-due-tasks"});
		} 
	});
	
	
	const SheetLink = $$$("link", ["rel", "stylesheet", "href", "./src/app.css"]);
	const JsLink1 = $$$("script", ["src", "./src/app.js"]);
	const JsLink2 = $$$("script", ["src", "./src/version.js"]);
	const JsLink3 = $$$("script", ["src", "./src/localforage.js"]);
	
	SheetLink.onload = (event) => LoadedExternalFiles.run(event);
	JsLink1.onload = (event) => LoadedExternalFiles.run(event);
	JsLink2.onload = (event) => LoadedExternalFiles.run(event);
	JsLink3.onload = (event) => LoadedExternalFiles.run(event);
	
	document.head.appendChild(SheetLink);
	document.head.appendChild(JsLink1);
	document.head.appendChild(JsLink2);
	document.head.appendChild(JsLink3);
} 

class LoadedExternalFiles {
	static total = 4;
	static n = 0;
	static run = async (event) => {
		this.n++;
		if(this.n == this.total) {
			localforage.config({
				name: "Mi-List"
			});
			await localforage.ready();
			LoadResources();
		} 
	} 
	static error = (error) => {
		alert("LOADING ERROR \n\n Failed to load AppShells files. Please check your internet connection and try again.");
	} 
} 

const KeepAlive = {
	end: false, 
	run: async function () {
		this.end = false;
		try {
			let res = await fetch("./src/images/badge.png");
		} catch (error) {} 
		
		if(!this.end) {
			await new Sleep().wait(2);
			await this.run();
		} 
	}, 
	stop: async function () {
		this.end = true;
	} 
} 

function reportError (error) {
	console.log(error);
	alert("ERROR\n\nWe are sorry for this error. We have taken note of the it.\n\nError: " + error);
} 

const SendMsg = async (msg) => {
	let controller = await navigator.serviceWorker.controller;
	if(controller) {
		navigator.serviceWorker.controller.postMessage(msg);
	} 
} 

const Message = async (msg) => {
	if(msg.data.type == "update-ui") {
		await RetrieveCache();
		await Tasks.render();
	} 
	else if(msg.data.type == "due") {
		if(Settings.voice) {
			navigator.vibrate(1000);
			await new Sleep().wait(4);
			let text = msg.data.task.type == "quick"? msg.data.task.title.value: msg.data.task.task.value;
			Settings.speech.text = text + " at " + convertTo(msg.data.task.time.value, 12);
			speechSynthesis.speak(Settings.speech);
		} 
	} 
	else if(msg.data.type == "click") {
		let task = msg.data.task;
		await localforage.removeItem("clicked");
		await Tasks.render(task.category.value);
		await new Sleep().wait(0.5);
		for(let item of $$(".main_body_item")) {
			if(item.getAttribute("taskid") == JSON.stringify(task))
				return item.click();
		} 
	} 
	else if(msg.data.type == "new-task") {
		$(".add_choice_default").click();
	} 
	else if(msg.data.type == "settings") {
		$(".main_header_menu_options div[value='settings']").click();
	} 
	else if(msg.data.type == "stop-process") {
		await KeepAlive.stop();
	} 
	else if(msg.data.type == "start-process") {
		await KeepAlive.run();
	} 
	else {
		console.log(msg.data.log);
	} 
} 

const InvokeSWUpdateFlow = async () => {
	if(_$($(".install"), "display") == "block") return;
	let versionDescription = await Updates.getDescription();
	let version = Updates.version;
	let action = await Notify.confirm({ 
		header: "APP UPDATE", 
		message: "<label style='display: block; text-align: left;'>Thank you for using Mi-List.<br>There is a new version of this app. All you need is to refresh.<br>New version: " + version + "</label><span>What's New?</span>" + versionDescription + "<label style='display: block; text-align: left;'>Do you want to update?</label>", 
		type: "Later/Update"
	});
	
	if(action == "Update") {
		Notify.alertSpecial({
				header: "Updating Mi-List...",
				message: "Please Wait as we update the app. This may take a few seconds depending n the speed of your bandwidth."
		});
		await KeepAlive.stop();
		await SendMsg({type: "stop-worker"});
		await new Sleep().wait(1);
		await reg.waiting.postMessage({type: "skip-waiting"});
	} 
	else {
		Notify.popUpNote("App update declined.");
		if(deferredEvent)
			ShowInstallPrompt();
	} 
} 

const FinishInstalling = async () => {
	if(reg.waiting) {
		if(_$($(".load"), "display") == "none") {
			await navigator.serviceWorker.ready
			if(reg.waiting)
				InvokeSWUpdateFlow();
		} 
	} 
} 

window.addEventListener("beforeinstallprompt", (e) => {
	e.preventDefault();
	deferredEvent = e;
});

window.addEventListener("error", (error) => {
	event.preventDefault();
	console.log(error.message + " \n\tat " + error.filename + ": " + error.lineno + ":" + error.colno);
	let option = confirm("ERROR MESSAGE\n\nThere was an unexpected error. We recommend you refresh the page. If this error persists even after refreshing, please contact via:\n\nTel: +254 798 916984\nWhatsApp: +254 798 916984\nEmail: markcodes789@gmail.com\n\nPress OK to refresh.");
	if(option) 
		location.reload();
});

window.addEventListener("load", async () => {
	if("serviceWorker" in navigator) {
		navigator.serviceWorker.onmessage = Message;
		reg = await navigator.serviceWorker.register("./sw.js");
		
		reg.addEventListener("updatefound", async () => {
			if(reg.installing) {
				reg.installing.addEventListener("statechange", () => {
					FinishInstalling();
				});
			} 
		});
		
		let refreshing = false;
		navigator.serviceWorker.addEventListener("controllerchange", (e) => {
			if(!refreshing) {
				location.reload();
				refreshing = true;
			} 
		});
		try {
			if('periodicSync' in reg) {
				reg = await navigator.serviceWorker.ready;
				let permission = await navigator.permissions.query({name: 'periodic-background-sync'});
				if(permission.state == "granted") {
					try {
						await reg.periodicSync.register("get-due-tasks", {minInterval: 60 * 1000});
					} catch (error) {
						console.log(error);
					} 
				} 
				else {
					
				} 
			} 
			else {
				
			} 
		} 
		catch (error) {
			console.log (error)
		} 
		pageComplete();
	} 
	else {
		alert("ERROR\n\n A fundamental function of this app is missing in your browser (Service Worker).\nTo use this app try a different browser or update it.");
	} 
});