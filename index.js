const srcs = [
	"black logo.png",
	"white logo.png",
	"menu.png",
	"edit.png",
	"delete.png",
	"check.png",
	"checked.png", 
	"arrow head.png", 
	"white arrow.png",
	"black arrow.png"
];

const imageProps = [
	"--black-logo",
	"--white-logo",
	"--menu-icon",
	"--edit-icon",
	"--delete-icon",
	"--check-icon",
	"--checked-icon",
	"--arrow-head-icon",
	"--white-arrow-icon",
	"--black-arrow-icon"
];

window.onpopstate = function (state) {
	if(_$($(".add"), "display") == "flex") {
		$(".add").style.display = "none";
	} 
	else if(_$($(".menu"), "display") == "block") {
		$(".menu").style.display = "none";
		$(".main").style.display = "block";
	} 
	else if(_$($(".main"), "display") == "block") {
		Notify("Press again to exit.");
		setTimeout(() => {
			history.pushState(null, "", "");
		}, 4000);
		return;
	} 
	history.pushState(null, "", "");
} 

async function load (i = 0) {
    let src = "./src/images/" + srcs[i];
    let response = await fetch(src);
    if(response.status == 200) {
        let arrBuff = await response.arrayBuffer();
        if(arrBuff.byteLength > 0) {
            src = await URL.createObjectURL(new Blob([arrBuff], {type: "image/png"}));
            document.documentElement.style.setProperty(imageProps[i], `url(${src})`);
            
            if(i < srcs.length-1)
                load(i+1);
            else {
            	setTimeout(LoadingDone, 500);
           } 
        } 
        else {
            console.log(response);
            alert("BUFFERING ERROR!\nFailed to buffer fetched data to an array data.");
        } 
    } 
    else {
        console.log(response);
        alert("LOADING ERROR!\nFailed to load AppShellFiles - " + src + ". Either you have bad network or you have lost internet connection.");
    } 
}

const LoadingDone = () => {
	for(let item of $$(".menu_body_item")) {
		item.addEventListener("click", Menu, false);
	} 
	$(".main_header_menu").addEventListener("click", () => {
		$(".menu").style.display = "block";
		$(".main").style.display = "none";
	}, false);
	$(".menu_header_back_icon").addEventListener("click", () => {
		$(".menu").style.display = "none";
		$(".main").style.display = "block";
	});
	$(".main .add_btn").addEventListener("click", () => {
		let date = new Date().toLocaleDateString().split("/");
		let time = new Date().toTimeString().split(" ")[0];
		$("#add_body_form_date").value = date[2] + "-" + date[0].padStart(2, "0") + "-" + date[1].padStart(2, "0");
		$("#add_body_form_date").min = date[2] + "-" + date[0].padStart(2, "0") + "-" + date[1].padStart(2, "0");
		$("#add_body_form_time").value = time.split(":").slice(0,2).join(":");;
		$(".add").style.display = "flex";
	});
	$(".add").addEventListener("click", (event) => {
		if(event.target.matches(".add") || event.target.matches(".add_body_back_icon")) 
			$(".add").style.display = "none";
	});
	$(".add_body_form .add_btn").addEventListener("click", Events.add, false);
	
	// retrieve settings
	if(storage) {
		let theme = storage.getItem("theme");
		if(theme && JSON.parse(theme)) 
			$(".menu_body_item_theme").click();
		
		let notification = storage.getItem("notification");
		if(notification && JSON.parse(notification))
			$(".menu_body_item_notification").click();
		
		let multipleDay = storage.getItem("multiple-day");
		if(multipleDay && JSON.parse(multipleDay))
			$(".menu_body_item_multiple_day").click();
			
		let list = storage.getItem("list");
		if(list) {
			Events.list = JSON.parse(list);
			Events.retrieve();
		} 
	} 
	
	SendMsg({type: "get-list"});
	history.pushState(null, "", "");
	$(".load").style.display = "none";
	$(".main").style.display = "block";
	
	if(deferredEvent) {
		ShowInstallPrompt();
	} 
} 

async function Menu (e) {
	switch (e.target.getAttribute("value")) {
		case "theme":
			e.target.classList.toggle("switch");
			$(".main").classList.toggle("dark_theme");
			$(".add").classList.toggle("dark_theme");
			$(".menu").classList.toggle("dark_theme");
			$(".install").classList.toggle("dark_theme");
			if(storage) 
				storage.setItem("theme", e.target.classList.contains("switch"));
			break;
		
		case "notification":
			if("Notification" in window) {
				let permission = Notification.permission;
				if(permission == "default") {
					permission = await Notification.requestPermission();
				} 
				if(permission == "granted") {
					e.target.classList.toggle("switch");
					let notification = e.target.classList.contains("switch");
					SendMsg({type: "notification", notification});
					if(storage) 
						storage.setItem("notification", notification);
						
					if(notification) {
						//alert("Remember to add Mi List in ignore list to be able to receive notifications even while the app is closed.");
						Notify("Event motifications enabled");
					} 
					else
						Notify("Event motifications disabled");
				} 
				else {
					Notify("Permission to access your phone notification denied.");
				} 
			} 
			else {
				Notify("Your browser doesn't support web app notifications.");
			} 
			break;
		
		case "multiple day":
			e.target.classList.toggle("switch");
			$(".add_body_form_date_cont").style.display = e.target.classList.contains("switch")? "block": "none";
			if(storage) 
				storage.setItem("multiple-day", e.target.classList.contains("switch"));
			break;
			
		case "share":
			if(navigator.canShare) {
	            navigator.share({
	                title: "Mi List", 
	                text: "Hey, I use Mi List to manage my everyday to do list. Try it out\n\n", 
	                url: "https://mark-code789.github.io/Mi List/index.html"
	            }).catch( (error) => { 
	            	let message = error.toString().split(":");
	                if(message[0] != "AbortError") 
	                    Notify(`There was an error while sharing.<br>***Description***<br>${message[0]}: ${message[1]}`);
	            });
	        } 
	        else {
	            Notify("This browser doesn't support in-app sharing.<br>Please use traditional method.");
	        } 
			break;
		case "developer":
			window.location.href = "https://mark-code789.github.io/Portfolio";
			break;
			
		case "feedback":
			 window.location.href = "mailto:markcodes789@gmail.com? &subject=Mi%20List%20Feedback";
			break;
			
		case "follow":
			window.location.href = "https://m.facebook.com/Mark-Codes-101930382417960/";
			break;
	} 
} 

class Events {
	static event = null;
	static list = [];
	static edit = (e) => {
		let parent = e.target.parentNode.parentNode;
		let date = parent.getAttribute("value");
		let time = parent.$(".main_body_event_time").getAttribute("value"); 
		let title = parent.$(".main_body_event_title").getAttribute("value");
		let desc = parent.$(".main_body_event_desc").getAttribute("value");
		
		$("#add_body_form_date").value = date;
		$("#add_body_form_time").value = time;
		$("#add_body_form_title").value = title;
		$("#add_body_form_desc").value = desc;
		this.editingEvent = e.target.parentNode.parentNode;
		$(".add").style.display = "flex";
	} 
	static del = (e) => {
		let parent = e.target.parentNode.parentNode;
		let date = parent.getAttribute("value");
		let time = parent.$(".main_body_event_time").getAttribute("value");
		let title = parent.$(".main_body_event_title").getAttribute("value");
		let desc = parent.$(".main_body_event_desc").getAttribute("value");
		time = convertTo(time, 12);
		for(let item of this.list) {
			if(item.date == date && item.time == time && item.title == title && item.desc == desc) {
				this.list.splice(this.list.indexOf(item), 1);
				break;
			} 
		} 
		if(storage) 
			storage.setItem("list", JSON.stringify(this.list));
			
		SendMsg({type: "update-list", list: this.list});
		parent.classList.remove("added");
		setTimeout(() => {
			parent.parentNode.removeChild(parent);
			this.removeEmptyLists();
		}, 500);
	} 
	static check = (e) => {
		let parent = e.target.parentNode.parentNode;
		let date = parent.getAttribute("value");
		let time = parent.$(".main_body_event_time").getAttribute("value");
		let title = parent.$(".main_body_event_title").getAttribute("value");
		let desc = parent.$(".main_body_event_desc").getAttribute("value");
		time = convertTo(time, 12);
		for(let item of this.list) {
			if(item.date == date && item.time == time && item.title == title && item.desc == desc) {
				item.checked = true;
				break;
			} 
		} 
		if(storage) 
			storage.setItem("list", JSON.stringify(this.list));
		SendMsg({type: "update-list", list: this.list});
			
		e.target.classList.add("checked");
		e.target.style.pointerEvents = "none";
		parent.$(".main_body_event_ctrl_edit").classList.add("disable");
	} 
	static add = (e) => {
		let addDate = $("#add_body_form_date").value;
		let time = $("#add_body_form_time").value;
		let title = $("#add_body_form_title").value;
		let desc = $("#add_body_form_desc").value;
		
		if(addDate == "") return Notify("Please indicate date of the event");
		if(time == "") return Notify("Please indicate time of the event");
		if(title == "") return Notify("Please indicate title of the event");
		e.preventDefault();
		
		if(new Date(addDate + "T" + time).getTime() - Date.now() < 0)
			return Notify("Time should be " + new Date().toTimeString().split(" ")[0] + " or later.");
			
		time = convertTo(time, 12);
		
		let mainBody = $(".main_body");
		let dayDiv = $(".main_body_day_events[value='" + addDate + "']") || $$$("div", ["class", "main_body_day_events", "value", addDate]), 
			dateDiv = $$$("div", ["class", "main_body_date", "value", addDate]), 
			contDiv = $$$("div", ["class", "main_body_event_cont", "value", addDate]), 
			timeDiv = $$$("div", ["class", "main_body_event_time", "value", convertTo(time, 24), "textContent", time]),
			expanderDiv = $$$("div", ["class", "main_body_event_expander"]), 
			titleDiv = $$$("div", ["class", "main_body_event_title", "value", title, "textContent", title]), 
			descDiv = $$$("div", ["class", "main_body_event_desc", "value", desc, "textContent", desc]), 
			textDiv = $$$("div", ["class", "main_body_event_text_cont"]), 
			ctrlDiv = $$$("div", ["class", "main_body_event_ctrl_cont"]), 
			editDiv = $$$("div", ["class", "main_body_event_ctrl_edit"]), 
			delDiv = $$$("div", ["class", "main_body_event_ctrl_del"]), 
			checkDiv = $$$("div", ["class", "main_body_event_ctrl_check"]);
			
			timeDiv.appendChild(expanderDiv);
			textDiv.addEventListener("click", this.expand, false);
			editDiv.addEventListener("click", this.edit, false);
			delDiv.addEventListener("click", this.del, false);
			checkDiv.addEventListener("click", this.check, false);
			
		let event = {date: addDate, time, title, desc, ms: new Date(addDate + "T" + convertTo(time, 24)).getTime()};
		let similarEvent = null;
		for(let item of this.list) {
			if(item.date == addDate && item.time == time && item.title == title && item.desc == desc) {
				similarEvent = item;
				break;
			} 
		} 
		
		if(this.editingEvent && similarEvent) {
			this.list[this.list.indexOf(similarEvent)] = event;
		} 
		else if(similarEvent) {
			return Notify("Similar Event exists.");
		} 
		else {
			this.list.push(event);
		} 
				
		if(storage) {
			storage.setItem("list", JSON.stringify(this.list));
		} 
		SendMsg({type: "update-list", list: this.list});
		
		let oldDate = $(".main_body_date[value='" + addDate + "']");
		dateDiv = oldDate? oldDate: dateDiv;
		
		if(dateDiv.nextElementSibling && dateDiv.nextElementSibling.classList.contains("main_body_empty_list"))
			dayDiv.removeChild(dateDiv.nextElementSibling);
		
		if(!oldDate) {
			let today = new Date();
			let tomorrow = new Date();
			tomorrow.setDate(today.getDate() + 1);
			let date = new Date(addDate);
			let str = date.toLocaleDateString('en-US', {weekday: "long", month: "short", year: "numeric"}).split(" ");
			dateDiv.textContent = date.toDateString() == today.toDateString()? "Today": date.toDateString() == tomorrow.toDateString()? "Tomorrow": str[2] + ", " + date.getDate() + " " + str[0] + " " + str[1];
			
			dayDiv.appendChild(dateDiv);
		} 
		textDiv.appendChild(timeDiv);
		textDiv.appendChild(titleDiv);
		textDiv.appendChild(descDiv);
		ctrlDiv.appendChild(editDiv);
		ctrlDiv.appendChild(delDiv);
		ctrlDiv.appendChild(checkDiv);
		contDiv.appendChild(textDiv);
		contDiv.appendChild(ctrlDiv);
		
		let leastDiff = Number.MAX_SAFE_INTEGER;
		let ms = new Date(addDate + "T" + convertTo(time, 24, true)).getTime();
		let ref;
		for(let item of dayDiv.$$(".main_body_event_time")) {
			let diff = new Date(addDate + "T" + item.getAttribute("value")).getTime() - ms;
			if(diff > 0 && diff < leastDiff) {
				ref = item.parentNode.parentNode;
				leastDiff = diff;
			} 
		} 
		dayDiv.insertBefore(contDiv, ref);
		setTimeout(() => contDiv.classList.add("added"), 500);
		if(this.editingEvent) {
			if(this.editingEvent.parentNode == dayDiv) 
				dayDiv.replaceChild(contDiv, this.editingEvent);
			else {
				this.editingEvent.parentNode.removeChild(this.editingEvent);
			} 
		} 
		
		if(!dayDiv.parentNode) {
			leastDiff = Number.MAX_SAFE_INTEGER;
			let date = new Date(addDate);
			ref = undefined;
			for(let list of $$(".main_body_day_events")) {
				let dayDate = new Date(list.getAttribute("value"))
				let diff = dayDate.getTime() - date.getTime();
				if(diff >= 86400000 && diff < leastDiff) {
					leastDiff = diff;
					ref = list;
				} 
			} 
			mainBody.insertBefore(dayDiv, ref);
		} 
		this.removeEmptyLists();
		this.editingEvent = null;
		$(".add_body_back_icon").click();
	} 
	static retrieve = () => {
		for(let event of this.list) {
			let addDate = event.date;
			let time = event.time
			let title = event.title;
			let desc = event.desc; 
			
			if(new Date(addDate + "T" + convertTo(time, 24)).getTime() - Date.now() < -86400000)
				continue;
			
			let mainBody = $(".main_body");
			let dayDiv = $(".main_body_day_events[value='" + addDate + "']") || $$$("div", ["class", "main_body_day_events", "value", addDate]), 
				dateDiv = $$$("div", ["class", "main_body_date", "value", addDate]), 
				contDiv = $$$("div", ["class", "main_body_event_cont", "value", addDate]), 
				timeDiv = $$$("div", ["class", "main_body_event_time", "value", convertTo(time, 24), "textContent", time]),
				expanderDiv = $$$("div", ["class", "main_body_event_expander"]), 
				titleDiv = $$$("div", ["class", "main_body_event_title", "value", title, "textContent", title]), 
				descDiv = $$$("div", ["class", "main_body_event_desc", "value", desc, "textContent", desc]), 
				textDiv = $$$("div", ["class", "main_body_event_text_cont"]), 
				ctrlDiv = $$$("div", ["class", "main_body_event_ctrl_cont"]), 
				editDiv = $$$("div", ["class", "main_body_event_ctrl_edit"]), 
				delDiv = $$$("div", ["class", "main_body_event_ctrl_del"]), 
				checkDiv = $$$("div", ["class", "main_body_event_ctrl_check"]);
				
				timeDiv.appendChild(expanderDiv);
				textDiv.addEventListener("click", this.expand, false);
				editDiv.addEventListener("click", this.edit, false);
				delDiv.addEventListener("click", this.del, false);
				checkDiv.addEventListener("click", this.check, false);
				
			let oldDate = $(".main_body_date[value='" + addDate + "']");
			dateDiv = oldDate? oldDate: dateDiv;
			
			if(dateDiv.nextElementSibling && dateDiv.nextElementSibling.classList.contains("main_body_empty_list"))
				dayDiv.removeChild(dateDiv.nextElementSibling);
			
			if(!oldDate) {
				let today = new Date();
				let tomorrow = new Date();
				tomorrow.setDate(today.getDate() + 1);
				let date = new Date(addDate);
				let str = date.toLocaleDateString('en-US', {weekday: "long", month: "short", year: "numeric"}).split(" ");
				dateDiv.textContent = date.toDateString() == today.toDateString()? "Today": date.toDateString() == tomorrow.toDateString()? "Tomorrow": str[2] + ", " + date.getDate() + " " + str[0] + " " + str[1];
				
				dayDiv.appendChild(dateDiv);
			} 
			textDiv.appendChild(timeDiv);
			textDiv.appendChild(titleDiv);
			textDiv.appendChild(descDiv);
			ctrlDiv.appendChild(editDiv);
			ctrlDiv.appendChild(delDiv);
			ctrlDiv.appendChild(checkDiv);
			contDiv.appendChild(textDiv);
			contDiv.appendChild(ctrlDiv);
			
			let leastDiff = Number.MAX_SAFE_INTEGER;
			let ms = new Date(addDate + "T" + convertTo(time, 24, true)).getTime();
			let ref;
			for(let item of dayDiv.$$(".main_body_event_time")) {
				let diff = new Date(addDate + "T" + item.getAttribute("value")).getTime() - ms;
				if(diff > 0 && diff < leastDiff) {
					ref = item.parentNode.parentNode;
					leastDiff = diff;
				} 
			} 
			
			dayDiv.insertBefore(contDiv, ref);
			setTimeout(() => contDiv.classList.add("added"), 500);
			if(this.editingEvent) {
				if(this.editingEvent.parentNode == dayDiv) 
					dayDiv.replaceChild(contDiv, this.editingEvent);
				else {
					this.editingEvent.parentNode.removeChild(this.editingEvent);
				} 
			} 
			
			if(!dayDiv.parentNode) {
				leastDiff = Number.MAX_SAFE_INTEGER;
				let date = new Date(addDate);
				ref = undefined;
				for(let list of $$(".main_body_day_events")) {
					let dayDate = new Date(list.getAttribute("value"))
					let diff = dayDate.getTime() - date.getTime();
					if(diff >= 86400000 && diff < leastDiff) {
						leastDiff = diff;
						ref = list;
					} 
				} 
				mainBody.insertBefore(dayDiv, ref);
			} 
			
			if(event.checked) {
				checkDiv.classList.add("checked");
				checkDiv.style.pointerEvents = "none";
				editDiv.classList.add("disable");
			} 
			else {
				time = convertTo(time, 24);
				let diff = new Date(addDate + "T" + time).getTime() - Date.now();
				if(diff < 0) {
					editDiv.classList.add("disable");
				} 
			} 
			this.removeEmptyLists();
		} 
		SendMsg({type: "update-list", list: this.list});
		SendMsg({type: "start-timer"});
	} 
	static expand = (e) => {
		e.target.parentNode.classList.toggle("expanded");
	} 
	static removeEmptyLists = () => {
		let today = new Date();
		for(let list of $$(".main_body_day_events")) {
			if(list.children.length < 2) {
				let eventDate = new Date(list.getAttribute("value"));
				if(today.toDateString() == eventDate.toDateString())
					list.appendChild($$$("div", ["class", "main_body_empty_list", "textContent", "You have no events on this day"]));
				else
					list.parentNode.removeChild(list);
			} 
		} 
	} 
} 

const Notify = (msg) => {
	let popUpNote = $("#pop-up-note");
    popUpNote.innerHTML = msg;
    popUpNote.style.display = "block";
    popUpNote.classList.remove("pop");
    void popUpNote.offsetWidth;
    popUpNote.classList.add("pop");
}

const End = (event) => {
    if(event.animationName === "pop-out") {
        let popUpNote = $("#pop-up-note");
        popUpNote.style.display = "none";
    } 
} 

const convertTo = (time, to, includeSec = false) => {
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
} 