const srcs = [
	"logo.png",
	"search.png", 
	"menu.png",
	"edit.png",
	"delete.png",
	"cancel.png", 
	"arrow.png",
	"calendar.png", 
	"clock.png", 
	"clear.png", 
	"notification.png", 
	"category.png", 
	"category add.png", 
	"repeat.png", 
	"repeat add.png", 
	"home.png", 
	"finished.png", 
	"share.png",
	"rest.png", 
];

const imageProps = [
	"--logo",
	"--search-icon",
	"--menu-icon",
	"--edit-icon",
	"--delete-icon",
	"--cancel-icon",
	"--arrow-icon",
	"--calendar-icon", 
	"--clock-icon", 
	"--clear-icon", 
	"--notification-icon", 
	"--category-icon", 
	"--category-add-icon", 
	"--repeat-icon",
	"--repeat-add-icon",
	"--home-icon",
	"--finished-icon",
	"--share-icon", 
	"--rest-icon"
]

const LoadResources = async (i = 0) => {
    let src = "./src/images/" + srcs[i];
    let response = await fetch(src);
    if(response.status == 200) {
        let arrBuff = await response.arrayBuffer();
        if(arrBuff.byteLength > 0) {
            src = await URL.createObjectURL(new Blob([arrBuff], {type: "image/png"}));
            document.documentElement.style.setProperty(imageProps[i], `url(${src})`);
            srcs[i] = src;
            if(i < srcs.length-1)
                LoadResources(i+1);
            else {
            	setTimeout(LoadingDone, 500);
            } 
        } 
        else {
            console.log(response);
            Notify.alert({header: "BUFFERING ERROR", message: "Failed to buffer fetched data to an array data."});
        } 
    } 
    else {
        console.log(response);
        Notify.alert({header: "LOADING ERROR", message: "Failed to load AppShellFiles. Either you have bad network or you have lost internet connection."});
    } 
}
const currentAppVersion = "31.18.34.102";
const LoadingDone = async () => { 
	try {
		for(let item of $$(".menu_body_item, .menu_body_item select, .menu_body_item input")) {
			item.addEventListener("click", Settings.input, true);
			if(item.classList.contains("menu_body_item")) {
				item.addEventListener("customclick", Settings.input, true);
			} 
		} 
		
		for(let input of $$(".menu_body_item select, .menu_body_item input")) {
			input.addEventListener("change", (e) => {
				e.target.parentNode.parentNode.dispatchEvent(new Event("customclick"));
			});
		} 
		
		$(".main_header_categories").addEventListener("click", async (e) => {
			let options = $(".task_categories");
			let total = Tasks.total();
			let all = $$$("div", ["value", "all", "innerHTML", `<span>all</span><span>${total > 0? total: ""}</span>`]);
			let add = $$$("div", ["class", "create_new", "innerHTML", "<span>Create new</span><span></span>"]);
			options.innerHTML = "";
			all.addEventListener("click", ClickInputs.category, false);
			add.addEventListener("click", ClickInputs.category, false);
			options.appendChild(all);
			options.appendChild(add);
			let entries = await Tasks.getCategories(false);
			for(let [category, tasks] of entries) { 
				await new Promise(resolve => {
					let overdue = tasks.filter((t) => new Date(t.date.value+"T"+t.time.value).getTime() < new Date().getTime());
					let option = $$$("div", ["value", category, "innerHTML", `<span>${category}</span><span>${tasks.length > 0? tasks.length + (overdue.length? ' <span class=danger>(' + overdue.length + ")</span>": ""): ""}</span>`]);
					options.insertBefore(option, add);
					option.addEventListener("click", ClickInputs.category, false);
					resolve("done");
				});
			} 
			total = Tasks.total("finished");
			$(".main_header_categories .finished_tasks span:last-of-type").textContent = total > 0? total: "";
			total = Tasks.total("quick");
			$(".main_header_categories .quick_tasks span:last-of-type").textContent = total > 0? total: "";
			
			
			let selected = $(`.main_header_categories div[value='${$(".main_header_categories .showing_category").getAttribute("value")}']`) ||
						   $(".main_header_categories div[value='all']");
			if(selected) selected.classList.add("selected");
			e.target.classList.toggle("show");
			e.target.focus();
		});
		
		$(".main_header_categories .finished_tasks").addEventListener("click", ClickInputs.category, false);
		$(".main_header_categories .quick_tasks").addEventListener("click", ClickInputs.category, false);
		
		$(".main_header_categories").addEventListener("blur", (e) => {
			e.target.classList.remove("show");
		});
		
		$(".main_header_menu").addEventListener("click", (e) => {
			e.target.classList.add("show");
			e.target.focus();
		}, false);
		
		for(let option of $$(".main_header_menu_options div")) {
			option.addEventListener("click", async (e) => {
				e.preventDefault();
				$(".main_header_menu").blur();
				let value = e.target.getAttribute("value");
				if(value == "task categories") {
					let section = $(".categories_body");
					section.innerHTML = "";
					for(let [name, tasks] of Tasks.getCategories()) {
						let overdue = tasks.filter((t) => new Date((t.date? t.date.value+"T"+t.time.value: new Date().toISOString())).getTime() < new Date().getTime());
						let div = $$$("div", ["class", "categories_body_item", "value", name]);
						let text = $$$("div");
						let title = $$$("div", ["class", "categories_body_item_title", "textContent", name]);
						let desc = $$$("div", ["class", "categories_body_item_desc" + (tasks.length > 0? " has_value": ""), "innerHTML", tasks.length > 0? tasks.length + " task" + (tasks.length > 1? "s": "") + (overdue.length? " <span class='danger'>(" + overdue.length + " overdue)</span>": ""): "no tasks"]);
						let edit = $$$("div", ["class", "edit_icon"]);
						let del = $$$("div", ["class", "delete_icon"]);
						edit.addEventListener("click", async (e) => {
							let newName = await CustomInputs.get("text", name.replace(/^\w/g, (w) => w.toUpperCase()));
							if(!newName) return;
							await Tasks.changeCategoryName(name, newName);
							$(".main_header_menu_options div:first-of-type").click();
							if($(".showing_category").getAttribute("value") == name) {
								$(".showing_category").setAttribute("value", newName.toLowerCase());
								$(".showing_category").textContent = newName.toLowerCase();
							} 
						}, false);
						
						del.addEventListener("click", async (e) => {
							let choice = await Notify.confirm({header: "Task Category Delete", 
															   message: "Are you sure you want to delete " + name + " task category?<br>It will delete all the tasks in this category.", 
															   type: "Cancel/Delete"
															 });
							if(choice == "Delete") {
								await Tasks.deleteCategory(name);
								$(".main_header_menu_options div:first-of-type").click();
								Tasks.render();
							} 
						}, false);
						
						text.appendChild(title);
						text.appendChild(desc);
						div.appendChild(text);
						if(name == "general" || name == "quick") { 
							section.insertBefore(div, section.children[0]);
						} 
						else {
							div.appendChild(edit);
							div.appendChild(del);
							section.appendChild(div);
						} 
					} 
					$(".main").style.display = "none";
					$(".categories").style.display = "block";
				} 
				else if(value == "feedback") {
					$(".menu_body_item[item='feedback'").click();
				} 
				else if(value == "share") {
					$(".menu_body_item[item='share'").click();
				} 
				else if(value == "follow") {
					let choice = await CustomInputs.get("choice", "Follow on", ["Facebook", "Twitter", "LinkedIn"]);
					if(choice)
					$(`.menu_body_item[value='${choice}']`).click();
				} 
				else if(value == "settings") {
					let options = $(".menu_body_item[item='startup category'] select");
					options.innerHTML = "<option value='all'>All</option>" + 
										"<option value='quick'>Quick</option>";
					for(let category of Tasks.getCategoryNames(false)) {
						let option = $$$("option", ["value", category, "textContent", category.replace(/^\w/, (t) => t.toUpperCase())]);
						options.appendChild(option);
					} 
					options.$(`option[value='${Settings.values.startupCategory}']`).selected = true;
					$(".menu").style.display = "block";
					$(".main").style.display = "none";
				} 
			}, false);
		} 
		
		$(".main_header_search").addEventListener("click", () => {
			$(".main_search").style.display = "grid";
			$(".main_body .add_btn:not(.add_choice)").style.display = "none";
			$(".main_body_item_cont").classList.remove("empty", "empty_all");
			$(".main_body_item_empty").innerHTML = "";
			$("#main_search_input").value = "";
			$("#main_search_input").focus();
			Tasks.searchMode();
		}, false);
		
		$(".main_header_menu").addEventListener("blur", (e) => {
			e.target.classList.remove("show");
		}, false);
		
		$(".menu_header_back").addEventListener("click", async () => {
			await localforage.setItem("settings", Settings.values);
			SendMsg({type: "get-due-tasks"});
			$(".menu").style.display = "none";
			$(".main").style.display = "block";
		}, false);
		
		$(".main_search_back").addEventListener("click", () => {
			$(".main_search").style.display = "none";
			$(".main_body .add_btn:not(.add_choice)").style.display = "flex";
			Tasks.render();
		}, false);
		
		$("#main_search_input").addEventListener("keyup", Tasks.search, false);
		
		$(".main_search_input_clear").addEventListener("click", (e) => {
			e.target.previousElementSibling.value = "";
			e.target.previousElementSibling.focus();
			e.target.previousElementSibling.dispatchEvent(new KeyboardEvent("keyup", {key: ""}));
		}, false);
		
		$(".main .add_btn:not(.add_choice)").addEventListener("click", (e) => {
			e.target.style.display = "none";
			$(".main .add_choice").style.display = "flex";
			$(".main .add_choice").focus();
		}, false);
		
		$(".main .add_choice").addEventListener("blur", (e) => {
			e.target.style.display = "none";
			$(".main .add_btn:not(.add_choice)").style.display = "flex";
		});
		
		$(".categories_header_back").addEventListener("click", (event) => {
			$(".categories").style.display = "none";
			$(".main").style.display = "block";
		}, false);
		
		$(".categories_header_add").addEventListener("click", async (e) => {
			let name = await CustomInputs.get("text");
			if(!name) return;
			if(Tasks.createNewCategory(name)) 
				$(".main_header_menu_options div:first-of-type").click();
		}, false);
		
		for(let btn of $$(".add_choice div")) {
			btn.addEventListener("click", (e) => {
				if(e.target.classList.contains("add_choice_default")) {
					let date = new Date().toISOString().split("T")[0];
					let time = new Date();
						time.setHours(time.getHours() + 1);
						time = time.toTimeString().split(" ")[0];
					$(".default_task .add_body_form").reset();
					
					$("#add_body_form_desc").style.height = "calc(2.3ch + 23px)";
					$("#add_body_form_desc").value = "";
					$("#add_body_form_date").min = date;
					$("#add_body_form_date").classList.remove("has_value", "danger");
					$("#add_body_form_date").setAttribute("valStr", "");
					$("#add_body_form_time").parentNode.style.display = "none";
					$("#add_body_form_time").value = time.replace(/\d+:\d+$/g, "00:00");
					$("#add_body_form_time").classList.remove("danger", "has_value");
					$("#add_body_form_time").setAttribute("valStr", "");
					$(".default_task").style.display = "block";
					$(".quick_task").style.display = "none";
					
					let options = $("#add_body_form_category");
					options.innerHTML = "";
					for(let category of Tasks.getCategoryNames(false)) {
						let option = $$$("option", ["value", category, "textContent", category.replaceAll(/^\w|\s\w/g, (t) => t.toUpperCase())]);
						options.appendChild(option);
						if(category == "general") {
							option.selected = true;
						} 
					} 
				} 
				else if(e.target.classList.contains("add_choice_quick")) {
					$(".quick_task .add_body_form").reset();
					$(".add_body_form_quick_tasks").innerHTML = "";
					$(".default_task").style.display = "none";
					$(".quick_task").style.display = "block";
				} 
				$(".add").style.display = "block";
				$(".main").style.display = "none";
			}, false);
		} 
		
		$(".add_header_back").addEventListener("click", (event) => {
			Tasks.editingOff();
			$(".add").style.display = "none";
			$(".main").style.display = "block";
			SendMsg({type: "get-due-tasks"});
			Tasks.render();
		}, false);
		
		$(".add_header_share").addEventListener("click", (event) => {
			if(navigator.canShare) {
				let text = _$($(".default_task"), "display") == "block"? $("#add_body_form_desc").value: $("#add_body_form_title").value + "\n\t\u25E6 " + Array.from($$(".add_body_form_quick_tasks span")).map((item) => item.textContent).join("\n\t\u25E6 ");
				let date = _$($(".default_task"), "display") == "block"? new Date($("#add_body_form_date").value).toDateString(): "";
				let time = _$($(".default_task"), "display") == "block"? convertTo($("#add_body_form_time").value, 24): "";
				
				text = "\u2022 " + text + (date.length? ` (${date.replace(/^\w+\b/g, '')}, ${time})`: '');
	            navigator.share({
	                text
	            }).catch( (error) => { 
	            	let message = error.toString().split(":");
	                if(message[0] != "AbortError") 
	                    Notify.popUpNote(`There was an error while sharing.\n***Description***\n${message[0]}: ${message[1]}`);
	            });
	        } 
	        else {
	            Notify.popUpNote("This browser doesn't support sharing from the app. Please use your traditional sharing method.");
	        } 
		}, false);
		
		$("#add_body_form_desc").addEventListener("keyup", (e) => {
			$(".add_body_form_height_finder").innerHTML = e.target.value.trim().replaceAll(/\n/g, '<br>') + "." || "Enter task here";
			e.target.style.height = _$($(".add_body_form_height_finder"), "height");
		}, false);
		
		$("#add_body_form_date").addEventListener("change", (e) => {
			e.target.classList.remove("danger");
			if(e.target.value == "") {
				e.target.classList.remove("has_value");
				$("#add_body_form_time").value = "";
				$("#add_body_form_time").classList.remove("has_value", "danger");
				e.target.min = new Date().toISOString().split("T")[0];
				e.target.parentNode.nextElementSibling.style.display = "none";
			} 
			else {
				let date = new Date(e.target.value + "T" + ($("#add_body_form_time").value || "00:00"));
				let str = date.toLocaleDateString('en-US', {weekday: "short", month: "long", year: "numeric"}).split(" ");
				str = `${str[2]}, ${str[0]} ${date.getDate()}, ${str[1]}`;
				let today = new Date();
				let tomorrow = new Date();
				tomorrow.setDate(today.getDate() + 1);
				let valStr = date.toDateString() == today.toDateString()? "Today": date.toDateString() == tomorrow.toDateString()? "Tomorrow": str;
				e.target.classList.add("has_value");
				e.target.setAttribute("valStr", valStr);
				e.target.parentNode.nextElementSibling.style.display = "block";
				if(date.getTime() < Date.now() && $("#add_body_form_time").classList.contains("has_value") || 
					new Date(date.toISOString().split("T")[0]).getTime() < new Date(new Date().toISOString().split("T")[0])) {
					e.target.classList.add("danger");
					if($("#add_body_form_time").classList.contains("has_value")) 
						$("#add_body_form_time").classList.add("danger");
					else
						e.target.parentNode.nextElementSibling.style.display = "none";
				} 
				else {
					e.target.classList.remove("danger");
					$("#add_body_form_time").classList.remove("danger");
				} 
			} 
		}, false);
		
		$("#add_body_form_time").addEventListener("change", (e) => {
			e.target.classList.remove("danger");
			e.target.parentNode.style.display = "block";
			if(e.target.value == "") {
				e.target.classList.remove("has_value");
				$("#add_body_form_date").classList.remove("danger");
			} 
			else {
				let date = new Date($("#add_body_form_date.has_value").value + "T" + convertTo(e.target.value, 24)).getTime();
				let currentDate = new Date().getTime();
				
				let time = convertTo(e.target.value, Settings.values.timeFormat);
				
				if(date < currentDate) {
					$("#add_body_form_date").classList.add("danger");
					e.target.classList.add("danger");
				} 
				else {
					$("#add_body_form_date").classList.remove("danger");
					e.target.classList.remove("danger");
				} 
					
				e.target.classList.add("has_value");
				e.target.setAttribute("valStr", time);
			} 
		}, false);
		
		for(let btn of $$(".add_body_form_clear_button")) {
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				if(e.target.parentNode.classList.contains("add_body_form_date_cont")) {
					e.target.parentNode.nextElementSibling.style.display = "none";
					$("#add_body_form_time").value = "";
					$("#add_body_form_time").setAttribute("valStr", "");
					$("#add_body_form_time").classList.remove("has_value", "danger");
					$("#add_body_form_date").min = new Date().toISOString().split("T")[0];
				} 
				else {
					$("#add_body_form_date").classList.remove("danger");
				} 
				let input = e.target.previousElementSibling;
				input.classList.remove("has_value", "danger");
				input.setAttribute("valStr", "");
				input.value = "";
			}, false);
		} 
		
		$("#add_body_form_quick_input").addEventListener("keyup", (e) => {
			if(e.key == "Enter")
				 $(".add_body_form_quick_add").click();
		});
		
		$(".add_body_form_quick_add").addEventListener("click", (e) => {
			let input = $("#add_body_form_quick_input");
			let value = input.value;
			input.focus();
			if(value != '') {
				let div = $$$("div");
				let span = $$$("span", ["textContent", value.replace(/^\w/, t => t.toUpperCase())]);
				let btn = $$$("button", ["type", "button"]);
				let li = $$$("li");
				div.appendChild(span);
				div.appendChild(btn);
				li.appendChild(div);
				$(".add_body_form_quick_tasks").appendChild(li);
				input.value = "";
				span.addEventListener("click", (e) => {
						e.target.parentNode.parentNode.parentNode.removeChild(e.target.parentNode.parentNode);
						let text = e.target.textContent;
						input.value = text;
						input.focus();
						input.select();
					});
				btn.addEventListener("click", (e) => {
					let list = e.target.parentNode.parentNode;
					list.parentNode.removeChild(list);
				});
			} 
			input.scrollIntoView(true);
		});
		
		$(".add_body_form_notification_custom").addEventListener("click", async (e) => {
			let res = await CustomInputs.get("slider");
			if(!res) return;
			let {value, text} = res;
			if(Array.from($$("#add_body_form_notification option")).map((t) => parseInt(t.value)).includes(parseInt(value))) {
				$(`#add_body_form_notification option[value='${value}']`).selected = true;
			} 
			else {
				let option = $$$("option", ["value", value, "textContent", `${text} before`]);
				let ref;
				for(ref of $$("#add_body_form_notification option")) 
					if(parseInt(ref.value) > parseInt(value)) break;
					else ref = null;
				$("#add_body_form_notification").insertBefore(option, ref);
				option.selected = true;
			} 
		}, false);
		
		$(".add_body_form_category_custom").addEventListener("click", async (e) => {
			let value = await CustomInputs.get("text");
			if(!value) return;
			await Tasks.createNewCategory(value);
			let options = $("#add_body_form_category");
			options.innerHTML = "";
			for(let category of Tasks.getCategoryNames()) {
				let option = $$$("option", ["value", category, "textContent", category.replaceAll(/^\w/g, (t) => t.toUpperCase())]);
				options.appendChild(option);
			} 
			options.$(`option[value='${value.toLowerCase()}']`).selected = true;
			
		}, false);
		
		$(".add_body_form_repeat_custom").addEventListener("click", async (e) => {
			let value = await CustomInputs.get("number");
			if(!value) return;
			
			if(Array.from($$("#add_body_form_repeat option")).map((t) => t.value).includes(value)) {
				$(`#add_body_form_repeat option[value='${value}']`).selected = true;
			} 
			else {
				let option = $$$("option", ["value", value, "textContent", value]);
				let ref;
				let options = Array.from($$("#add_body_form_repeat option"));
				options.splice(0, 6);
				for(ref of options) {
					let val1 = value.replaceAll(/day.*$/g, "1").replaceAll(/week.*$/g, "2").replaceAll(/month.*$/g, "3").replaceAll(/year.*$/g, "4").split(" ");
					let val2 = ref.value.replaceAll(/day.*$/g, "1").replaceAll(/week.*$/g, "2").replaceAll(/month.*$/g, "3").replaceAll(/year.*$/g, "4").split(" ");
					if(val2[1] > val1[1]) break;
					else if(val2[1] == val1[1] && val2[0] > val1[0]) break;
					else ref = undefined;
				} 
				option.selected = true;
				$("#add_body_form_repeat").insertBefore(option, ref);
			} 
		}, false);
		
		$("#slider_input").addEventListener("input", (e) => {
			let value = e.target.value;
			let max = e.target.max - 1;
			let val = value - 1;
			e.target.style.backgroundSize = `${val / max * 100}% 100%`;
			let h = Math.floor(value/60);
			let m = value % 60;
			let label = $("label[for='slider_input']");
			label.textContent = `Notification time: ${h > 0? h + " hour" + (h > 1? "s": ""): ""}${m > 0? " " + m + " minute" + (m > 1? "s": ""): ""}.`;
			label.setAttribute("value", `${h > 0? h + " hour" + (h > 1? "s ": " "): ""}${m > 0? m + " minute" + (m > 1? "s": ""): ""}`);
		}, false);
		
		for(let btn of $$(".slider_cont button")) {
			btn.addEventListener("click", (e) => {
				if(e.target.getAttribute("value") == "-") {
					e.target.nextElementSibling.value--;
					e.target.nextElementSibling.dispatchEvent(new Event("input"));
				} 
				else if(e.target.getAttribute("value") == "+") {
					e.target.previousElementSibling.value++;
					e.target.previousElementSibling.dispatchEvent(new Event("input"));
				} 
			}, false);
		} 
		
		$("#text_input").addEventListener("keyup", (e) => {
			e.target.value = e.target.value.replaceAll(/\s+/g, ' ').replace(/^\w/g, (w) => w.toUpperCase());
		})
		
		$("#number_input").addEventListener("keyup", (e) => {
			if(e.target.value < 2) {
				e.target.classList.add("danger");
			}
			else if(e.target.value > 100) {
				e.target.value = parseInt(String(e.target.value).replace(/\d$/, ''));
			} 
			else {
				e.target.classList.remove("danger");
			} 
			let label = $("label[for='number_input']");
			label.setAttribute("value", label.getAttribute("value").replace(/\d+/g, e.target.value >= 2? e.target.value: 2));
			label.textContent = "Repeat in: " + label.getAttribute("value");
		}, false);
		
		$("#string_input").addEventListener("change", (e) => {
			let label = $("label[for='number_input']");
			label.setAttribute("value", label.getAttribute("value").replace(/(?<=\b)\w+$/g, e.target.value));
			label.textContent = "Repeat in: " + label.getAttribute("value");
		}, false);
		
		for(let btn of $$(".custom_footer_cont button, .custom")) {
			btn.addEventListener("click", CustomInputs.gotten, true);
		} 
		
		for(let form of $$(".add_body_form")) {
			form.addEventListener("submit", (e) => {
				e.preventDefault();
				if(e.target.parentNode.classList.contains("quick_task")) {
					$(".add_body_form_quick_add").click();
				} 
			}, false);
		} 
		
		$$(".add_body_form .add_btn")[0].addEventListener("click", Tasks.add, false);
		$$(".add_body_form .add_btn")[1].addEventListener("click", Tasks.add, false);
		
		// Retrieve settings
		await RetrieveCache();
		await Settings.init();
		
		/*let darkTheme = window.matchMedia("(prefers-color-scheme: dark)");
		if(darkTheme.matches && !Settings.values.theme) {
			$(".menu_body_item[item='theme']").click();
		} 
		else if(!darkTheme.matches && Settings.values.theme) {
			$(".menu_body_item[item='theme']").click();
		} 
		
		darkTheme.addEventListener("change", (e) => {
			if(e.matches && !Settings.values.theme) 
				$(".menu_body_item[item='theme']").click();
			else if(!e.matches && Settings.values.theme) 
				$(".menu_body_item[item='theme']").click();
		});*/
		
		let startupCategory = Settings.values.startupCategory;
		$(".showing_category").textContent = startupCategory;
		$(".showing_category").setAttribute("value", startupCategory);
		await Tasks.render(startupCategory);
		
		CheckHREF();
		
		history.pushState(null, "", "");
		
		if(reg.waiting) {
			InvokeSWUpdateFlow();
		} 
		else if(deferredEvent) {
			ShowInstallPrompt();
		} 
		
		SendMsg({type: "init-storage"});
    	KeepAlive.run();
	} catch (error) {
		reportError(error);
	}
} 

const CheckHREF = async () => {
	let url = new URL(window.location);
	
	for(let [action, value] of url.searchParams.entries()) {
		if(/title|text|link/gi.test(action)) {
			let text = url.searchParams.get("text") || "";
			let link = url.searchParams.get("link") || "";
			text = text + " " + link;
			$(".load").style.display = "none";
			$(".add_choice_default").click();
			$("#add_body_form_desc").value = text;
			$("#add_body_form_desc").dispatchEvent(new KeyboardEvent("keyup", {key: " "}));
			return;
		} 
		if(action == "action") {
			if(value == "add_default") {
				$(".load").style.display = "none";
				$(".add_choice_default").click();
				return;
			} 
			else if(value == "add_quick") {
				$(".load").style.display = "none";
				$(".add_choice_quick").click();
				return;
			} 
			else if(value == "categories") {
				$(".load").style.display = "none";
				$(".main").style.display = "block";
				$(".main_header_menu_options div[value='task categories']").click();
				return;
			} 
			else if(value == "settings") {
				$(".load").style.display = "none";
				$(".main").style.display = "block";
				$(".main_header_menu_options div[value='settings']").click();
				return;
			} 
		} 
	} 
	$(".load").style.display = "none";
	$(".main").style.display = "block";
} 

const RetrieveCache = async () => {
	let settings = await localforage.getItem("settings");
	if(settings) Settings.values = settings;
	else await localforage.setItem("settings", Settings.values);
	
	let value = await localforage.getItem("default");
	if(value) await Tasks.init("default", value);
	else await localforage.setItem("default", Tasks.getCategories(false));
	
	value = await localforage.getItem("quick");
	if(value) await Tasks.init("quick", value);
	else await localforage.setItem("quick", Tasks.getQuickTasks());
	
	value = await localforage.getItem("finished");
	if(value) await Tasks.init("finished", value);
	else await localforage.setItem("finished", Tasks.getFinishedTasks());
	
	if('localStorage' in window) 
	for(let [key, value] of Object.entries(localStorage)) {
		if(key.startsWith("ML")) {
			localStorage.removeItem(key);
		} 
	} 
} 

window.onpopstate = function (state) {
	try {
		if(_$($(".add"), "display") == "block") {
			$(".add").style.display = "none";
			$(".main").style.display = "block";
		} 
		else if(_$($(".menu"), "display") == "block") {
			$(".menu").style.display = "none";
			$(".main").style.display = "block";
		} 
		else if(_$($(".categories"), "display") == "block") {
			$(".categories").style.display = "none";
			$(".main").style.display = "block";
		} 
		else if(_$($(".main"), "display") == "block") {
			Notify.popUpNote("Press again to exit.");
			setTimeout(() => {
				history.pushState(null, "", "");
			}, 4000);
			return;
		} 
		history.pushState(null, "", "");
	} catch (error) {
		reportError(error);
	} 
} 

class ClickInputs {
	static category = async (e) => {
		if(e.target.classList.contains("create_new")) {
			$(".main_header_categories").blur();
			let value = await CustomInputs.get("text");
			if(!value) return;
			Tasks.createNewCategory(value);
		} 
		else {
			$(".main_header_categories_options .selected").classList.remove("selected");
			e.target.classList.add("selected");
			$(".showing_category").setAttribute("value", e.target.getAttribute("value"));
			$(".showing_category").textContent = e.target.getAttribute("value");
			$(".main_header_categories").blur();
			await Tasks.render(e.target.getAttribute("value"));
		} 
	} 
	static add = (e) => {
		
	} 
} 

class CustomInputs {
	static sleep;
	static value;
	static get = async (type, ...values) => {
		if(type == "slider") {
			$(".custom .slider").style.display = "block";
			this.active = $(".custom .slider");
		} 
		else if(type == "text") {
			if(values.length > 1) {
				$("#text_input").placeholder = values[1][2];
				$("#text_input").value =  values[1][1];
				$("label[for='text_input']").innerHTML = values[1][0];
				$(".custom .text h2").innerHTML = values[0];
			} 
			else {
				$("#text_input").placeholder = "Enter category name";
				$("#text_input").value =  "";
				$("label[for='text_input']").innerHTML = "Enter the name of category below";
				$(".custom .text h2").innerHTML = "Task category name";
			} 
			
			$(".custom .text").style.display = "block";
			this.active = $(".custom .text");
		} 
		else if(type == "number") {
			$(".custom .number").style.display = "block";
			this.active = $(".custom .number");
		} 
		else if(type == "choice") {
			$(".custom .choice h2").textContent = values[0];
			let choices = $(".custom .choices");
			choices.innerHTML = "";
			for(let value of values[1]) {
				let choice = $$$("div", ["textContent", value, "value", value.toLowerCase(), "type", "choice"]);
				choice.addEventListener("click", this.gotten, true);
				choices.appendChild(choice);
			} 
			$(".custom .choice").style.display = "block";
			this.active = $(".custom .choice");
		} 
		$(".custom").style.display = "flex";
		if(type = "text") $("#text_input").focus();
		this.sleep = this.sleep? this.sleep: new Sleep();
		await this.sleep.start();
		return this.value;
	} 
	static gotten = async (e) => {
		e.stopPropagation();
		if(!e.target.parentNode.classList.contains("custom_footer_cont") && e.target.getAttribute("type") != "choice" && e.target != $(".custom")) 
			return;
		if(e.target.getAttribute("value") == "cancel")
			this.value = null;
		else {
			if(e.target.parentNode.parentNode.classList.contains("slider")) {
				this.value = {value: $("#slider_input").value, text: $("label[for='slider_input']").getAttribute("value")};
			} 
			else if(e.target.parentNode.parentNode.classList.contains("text")) {
				if($("#text_input").value == "") {
					$("#text_input").focus();
					Notify.popUpNote("Please fill out this field first");
					return;
				} 
				this.value = $("#text_input").value.trim();
			} 
			else if(e.target.parentNode.parentNode.classList.contains("number")) {
				if($("#number_input").value < 2) {
					$("#number_input").focus();
					Notify.popUpNote("The number should be between 2 and 100");
					return;
				} 
				this.value = $("label[for='number_input']").getAttribute("value");
			} 
			else if(e.target.parentNode.parentNode.classList.contains("choice")) {
				this.value = e.target.getAttribute("value");
			} 
		} 
		
		$("#slider_input").value = 1;
		$("#slider_input").style.backgroundSize = "0% 100%";
		$("label[for='slider_input']").textContent = "Notification time: 1 minute";
		$("label[for='slider_input']").setAttribute("value", "1 minute");
		
		$("#text_input").value = "";
		
		$("#number_input").value = 2;
		$("#string_input option[value='days']").setAttribute("selected", "true");
		$("#string_input option[value='days']").setAttribute("selected", "true");
		$("label[for='number_input']").textContent = "Repeat in: 2 days";
		$("label[for='number_input']").setAttribute("value", "2 days");
		
		this.active.style.display = "none";
		$(".custom").style.display = "none";
		this.sleep.end();
	} 
} 

class Settings {
	static values = {
		theme: false,
		statusBar: false, 
		confirmFinishing: false, 
		confirmRepeating: false, 
		firstDay: "sunday", 
		startupCategory: "all", 
		timeFormat: "24",
		sortingOrder: "alphabetically asc", 
		notification: false,
		voice: true, 
		vibration: true, 
		quickNotification: true, 
		quickNotificationTime: "08:00"
	}
	static speech = null;
	static init = async () => {
		for(let [key, value] of Object.entries(this.values)) {
			if(typeof value == "boolean") {
				let item = key.replaceAll(/[A-Z]{1}/g, (t) => " " + t.toLowerCase());
				if(value) {
					if(item == "theme") {
						$(".main").classList.toggle("dark_theme");
						$(".add").classList.toggle("dark_theme");
						$(".menu").classList.toggle("dark_theme");
						$(".categories").classList.toggle("dark_theme");
					} 
					if(item == "notification") {
						if(value && 'Notification' in window) {
							let permission = Notification.permission;
							if(permission == "default") {
								permission = await Notification.requestPermission();
								if(permission == "denied") {
									$(".menu_body_item[item='status bar']").classList.remove("switch");
									this.values.notification = false;
									this.values.statusBar = false;
									continue;
								} 
							} 
							else if(permission == "denied") {
								$(".menu_body_item[item='status bar']").classList.remove("switch");
								this.values.notification = false;
								this.values.statusBar = false;
								continue;
							} 
						} 
						else {
							continue;
						} 
						$(".menu_body_item[item='voice']").classList.toggle("disabled");
						$(".menu_body_item[item='vibration']").classList.toggle("disabled");
						$(".menu_body_item[item='quick notification']").classList.toggle("disabled");
						
						if($(".menu_body_item[item='quick notification']").classList.contains("disabled")) 
							$(".menu_body_item[item='quick notification time']").classList.add("disabled");
						else
							$(".menu_body_item[item='quick notification time']").classList.remove("disabled");
					} 
					if(item == "voice") {
						if("speechSynthesis" in window) {
							this.speech = new SpeechSynthesisUtterance();
						} 
						else {
							continue;
						} 
					} 
					$(`.menu_body_item[item='${item}']`).classList.add("switch");
				} 
				else 
					$(`.menu_body_item[item='${item}']`).classList.remove("switch");
			} 
			else {
				let item = key.replaceAll(/[A-Z]{1}/g, (t) => " " + t.toLowerCase());
				$(`.menu_body_item[item='${item}'] .menu_body_item_desc`).textContent = value;
				if(item == "sorting order") {
					$(`.menu_body_item[item='${item}'] .menu_body_item_desc`).textContent = "Due date + " + 
					(value == "alphabetically asc"? "Alphabetically (Ascending)": 
					 value == "alphabetically desc"? "Alphabetically (Descending)":
					 value == "old"? "Old tasks first": "New tasks first");
					$(`.menu_body_item[item='${item}'] select option[value='${value}']`).selected = true;
				} 
				else if(item == "quick notification time") {
					$(`.menu_body_item[item='${item}'] input`).value = convertTo(value, 24, true);
				} 
				else if(item == "startup category") {
					let select = $(`.menu_body_item[item='${item}'] select`);
					for(let name of Tasks.getCategoryNames(false)) {
						let option = $$$("option", ["value", name, "textContent", name]);
						select.appendChild(option);
					} 
					select.$(`option[value='${value}']`).selected = true;
				} 
				else {
					$(`.menu_body_item[item='${item}'] select option[value='${value}']`).selected = true;
				} 
			} 
		} 
		
		await localforage.setItem("settings", this.values);
		SendMsg({type: "init-storage"});
	} 
	static input = async (e) => {
		e.stopPropagation();
		if(e.type == "click") {
			void e.currentTarget.offsetWidth;
			let rect = e.currentTarget.getBoundingClientRect();
			let x = e.clientX - rect.left - (rect.width / 2);
			document.documentElement.style.setProperty("--clickX", `${x}px`);
			e.currentTarget.classList.remove("click");
			e.currentTarget.classList.add("click");
			e.currentTarget.onanimationend = function (e) {
				e.currentTarget.classList.remove("click");
			} 
		} 
		
		switch(e.target.getAttribute("item")) {
			case "theme":
			this.theme(e);
			break;
			
			case "status bar":
			this.statusBar(e);
			break;
			
			case "confirm finishing":
			this.confirmFinishing(e);
			break;
			
			case "confirm repeating":
			this.confirmRepeating(e);
			break;
			
			case "first day":
			this.firstDay(e);
			break;
			
			case "startup category":
			this.startupCategory(e);
			break;
			
			case "time format":
			this.timeFormat(e);
			break;
			
			case "sorting order":
			this.sortingOrder(e);
			break;
			
			case "notification":
			this.notification(e);
			break;
			
			case "voice":
			this.voice(e);
			break;
			
			case "vibration":
			this.vibration(e);
			break;
			
			case "quick notification":
			this.quickNotification(e);
			break;
			
			case "quick notification time":
			this.quickNotificationTime(e);
			break;
			
			case "share":
			this.share(e);
			break;
			
			case "version":
			this.version(e);
			break;
			
			case "support":
			this.support(e);
			break;
			
			case "developer":
			this.developer(e);
			break;
			
			case "feedback":
			this.feedback(e);
			break;
			
			case "more apps":
			this.moreApps(e);
			break;
			
			case "follow":
			this.follow(e);
			break;
			
			case "advanced":
			this.advanced(e);
			break;
		} 
	} 
	static theme = (e) => {
		e.target.classList.toggle("switch");
		this.values.theme = e.target.classList.contains("switch");
		$(".main").classList.toggle("dark_theme");
		$(".add").classList.toggle("dark_theme");
		$(".menu").classList.toggle("dark_theme");
		$(".categories").classList.toggle("dark_theme");
	}
	static statusBar = async (e) => {
		if(!this.values.notification) {
			return Notify.popUpNote("Enable notifications option below first.");
		} 
		e.target.classList.toggle("switch");
		this.values.statusBar = e.target.classList.contains("switch");
		await localforage.setItem("settings", this.values);
		SendMsg({type: "get-due-tasks"});
	} 
	static confirmFinishing = (e) => {
		e.target.classList.toggle("switch");
		this.values.confirmFinishing = e.target.classList.contains("switch");
	}
	static confirmRepeating = (e) => {
		e.target.classList.toggle("switch");
		this.values.confirmRepeating = e.target.classList.contains("switch");
	}
	static firstDay  = () => {
		let select = $(".menu_body_item[item='first day'] select");
		select.previousElementSibling.$(".menu_body_item_desc").textContent = select.$(`option[value='${select.value}'`).textContent;
		this.values.firstDay = select.value;
		Tasks.render();
	}
	static startupCategory = () => {
		let select = $(".menu_body_item[item='startup category'] select");
		select.previousElementSibling.$(".menu_body_item_desc").textContent = select.$(`option[value='${select.value}'`).textContent;
		this.values.startupCategory = select.value;
	}
	static timeFormat = (e) => {
		let select = $(".menu_body_item[item='time format'] select");
		select.previousElementSibling.$(".menu_body_item_desc").textContent = select.$(`option[value='${select.value}'`).textContent;
		this.values.timeFormat = select.value;
		Tasks.render();
	}
	static sortingOrder = (e) => {
		let select = $(".menu_body_item[item='sorting order'] select");
		select.previousElementSibling.$(".menu_body_item_desc").textContent = select.$(`option[value='${select.value}'`).textContent;
		this.values.sortingOrder = select.value;
		Tasks.render();
	}
	static notification = async (e) => {
		if('Notification' in window) {
			let permission = Notification.permission;
			if(permission == "default") {
				permission = await Notification.requestPermission();
				if(permission == "denied")
					return Notify.popUpNote("permission denied");
			} 
			else if(permission == "denied") {
				return Notify.popUpNote("Notification access denied");
			} 
		} 
		else {
			return Notify.popUpNote("Your browser doesn't support notifications");
		} 
		e.target.classList.toggle("switch");
		this.values.notification = e.target.classList.contains("switch");
		$(".menu_body_item[item='voice']").classList.toggle("disabled");
		$(".menu_body_item[item='vibration']").classList.toggle("disabled");
		$(".menu_body_item[item='quick notification']").classList.toggle("disabled");
		
		if($(".menu_body_item[item='quick notification']").classList.contains("disabled")) 
			$(".menu_body_item[item='quick notification time']").classList.add("disabled");
		else
			$(".menu_body_item[item='quick notification time']").classList.remove("disabled");
	}
	static voice = (e) => {
		if("speechSynthesis" in window) {
			this.speech = new SpeechSynthesisUtterance();
		} 
		else {
			return Notify.popUpNote("This feature is not supported in your browser");
		} 
		e.target.classList.toggle("switch");
		this.values.voice = e.target.classList.contains("switch");
	}
	static vibration = (e) => {
		e.target.classList.toggle("switch");
		this.values.vibration = e.target.classList.contains("switch");
	}
	static quickNotification = (e) => {
		e.target.classList.toggle("switch");
		this.values.quickNotification = e.target.classList.contains("switch");
		if(this.values.quickNotification) 
			$(".menu_body_item[item='quick notification time']").classList.remove("disabled");
		else
			$(".menu_body_item[item='quick notification time']").classList.add("disabled");
	} 
	static quickNotificationTime = (e) => {
		let input = $(".menu_body_item[item='quick notification time'] input");
		if(input.value == "") return;
		let time = convertTo(input.value, this.values.timeFormat);
		$(".menu_body_item[item='quick notification time'] .menu_body_item_desc").textContent = time;
		this.quickNotificationTime = convertTo(time, 24);
	} 
	static share = () => {
		if(navigator.canShare) {
            navigator.share({
                title: "Mi List", 
                text: "Hey, I use Mi List to manage my every to do list. Try it out\n\n", 
                url: "https://mark-code789.github.io/Mi-List/index.html"
            }).catch( (error) => { 
            	let message = error.toString().split(":");
                if(message[0] != "AbortError") 
                    Notify.popUpNote(`There was an error while sharing.\n***Description***\n${message[0]}: ${message[1]}`);
            });
        } 
        else {
            Notify.popUpNote("This browser doesn't support this method. Please use your traditional sharing method.");
        } 
	}
	static version = async (e) => {
		let currentVersionDescription= await Updates.getDescription(currentAppVersion);
		let update = await Notify.confirm({
            header: "MI LIST VERSION", 
            message: "<label style='display: block; text-align: left;'>Current version: " + currentAppVersion + "</label><span>Updates of this version</span>" + currentVersionDescription + "<label style='display: block; text-align: left;'>Thank you for using Mi List. If you experience any difficulty or an error please contact me via the feedback button in the settings.</label>", 
			type: "Check for update/OK"
		});
		
		if(update == "Check for update") {
			if(!navigator.onLine) return Notify.popUpNote("Please connect to an internet and try again.");
			Notify.alertSpecial({
					header: "Checking for update...",
					message: "Please wait as we run the check."
			});
			location.reload();
		} 
	}
	static support = (e) => {
		Notify.alert({
			header: "SUPPORT LINES",
			message: "<label>If you have been impressed by this work, support me and let's achieve milestone through coding and programming.<br><br>" +
					 "Support line: <b>0798916984</b><br>Name: <b>Mark Etale</b></label>"
		});
	} 
	static developer = (e) => {
		location.href = "https://mark-code789.github.io/Portfolio";
	}
	static feedback = (e) => {
		location.href = "mailto:markcodes789@gmail.com?subject=" + navigator.userAgent + " - version: " + currentAppVersion;
	}
	static moreApps = async (e) => {
		let choice = await CustomInputs.get("choice", "More Apps", ["Checkers", "Smart Recharge"]);
		if(!choice) return;
		console.log(choice);
		if(choice == "checkers") location.href = "https://mark-code789.github.io/Checkers";
		else if(choice == "smart recharge") location.href = "https://mark-code789.github.io/Smart-Recharge";
	} 
	static follow = (e) => {
		switch(e.target.getAttribute("value")) {
			case "facebook":
			location.href = "https://www.facebook.com/Mark-Codes-101930382417960/";
			break;
			
			case "twitter":
			location.href = "https://www.twitter.com/marketale8";
			break;
			
			case "linkedin":
			location.href = "https://www.linkedin.com/in/mark-etale-26aba41ab";
			break;
		} 
	}
	static advanced = async (e) => {
		let pwd = await CustomInputs.get("text", "Advanced Settings", ["Enter password", "", "password"]);
		if(!pwd) return;
		if(pwd.trim().toLowerCase() == "marxeto123.") {
			eruda.init();
		} 
		else
			console.log("wrong password");
	} 
} 

class Tasks {
	static #categories = new Map([
		["general", []], 
		["work", []], 
		["school", []], 
		["personal", []]
	]);
	static #finished = new Map([
		["default", []], 
		["quick", []]
	]);
	static #quick = [];
	static #tasks = [];
	static #editingElement = null;
	static #sleep = null;
	
	static reset = async () => {
		this.#categories = new Map([
			["general", []], 
			["work", []], 
			["school", []], 
			["personal", []]
		]);
		this.#finished = new Map([
			["default", []], 
			["quick", []]
		]);
		this.#quick = [];
		this.#tasks = [];
		this.#editingElement = null;
		await localforage.setItem("default", this.getCategories(false));
		await localforage.setItem("quick", this.getQuickTasks());
		await localforage.setItem("finished", this.getFinishedTasks());
	} 
	
	static init = async (category, value) => {
		new Promise((resolve) => {
			if(category == "default") 
				this.#categories = new Map(value);
			else if(category == "quick") 
				this.#quick = value;
			else if(category == "finished") 
				this.#finished = new Map(value);
			resolve("done");
		});
	} 
	
	static createNewCategory = async (name, value = []) => {
		name = name.toLowerCase();
		if(this.#categories.has(name) || name == "quick") {
			return false;
		} 
		this.#categories.set(name, value); 
		await localforage.setItem("default", [...this.#categories.entries()]);
		return true;
	} 
	
	static changeCategoryName = async (oldName, newName) => {
		newName = newName.toLowerCase();
		oldName = oldName.toLowerCase();
		if(!this.#categories.has(oldName)) {
			return;
		} 
		let value = this.#categories.get(oldName);
		this.#categories.set(newName, value); 
		this.#categories.delete(oldName); 
		await localforage.setItem("default", [...this.#categories.entries()]);
	} 
	
	static getCategories = (all = true) => {
		if(all) 
			return [["quick", [...this.#quick]], ...this.#categories.entries()].sort();
		else
			return [...this.#categories.entries()].sort();
	} 
	
	static getCategoryNames = (all = true) => {
		if(all) 
			return ["quick", ...this.#categories.keys()].sort();
		else
			return [...this.#categories.keys()].sort();
	} 
	
	static deleteCategory = async (name) => { 
		this.#categories.delete(name.toLowerCase());
		await localforage.setItem("default", [...this.#categories.entries()]);
	} 
	
	static getQuickTasks = () => {
		return [...this.#quick];
	} 
	
	static getFinishedTasks = () => {
		return [...this.#finished.entries()];
	} 
	
	static total = (category) => {
		if(category) {
			if(category == "quick") {
				return this.#quick.length;
			} 
			else if(category == "finished") {
				return [...this.#finished.values()].flat(Infinity).length;
			} 
		} 
		return [...this.#quick, ...this.#categories.values()].flat(Infinity).length;
	} 
	static searchMode = async () => {
		if($(".main_header_categories .showing_category").getAttribute("value") == "finished")
			this.#tasks = await this.sort("finished");
		else 
			this.#tasks = await this.sort("general");
		$(".main_search_input_clear").style.display = "none";
	} 
	
	static add = async (e) => {
		if(this.#editingElement) {
			this.#editingElement.$(".main_body_item_delete").click();
			this.#sleep = this.#sleep || new Sleep();
			await this.#sleep.start();
		} 
		if(e.target.parentNode.parentNode.classList.contains("default_task")) {
			let task = $("#add_body_form_desc");
			if(task.value == "") {
				Notify.popUpNote("Pleass fill out what's to be done");
				task.focus();
				return;
			} 
			let date = $("#add_body_form_date");
			if(date.value == "" || date.classList.contains("danger")) {
				Notify.popUpNote("Fill out due date of the task");
				date.focus();
				return;
			} 
			let time = $("#add_body_form_time");
			if(time.getAttribute("valStr") == "" || time.classList.contains("danger")) {
				Notify.popUpNote("Fill out due time of the task");
				time.focus();
				return;
			} 
			let notification = $("#add_body_form_notification");
			let category = $("#add_body_form_category");
			let repeat = $("#add_body_form_repeat");
			let values = this.#categories.get(category.value);
			let value = {
				type: "default", 
				task: {value: task.value.trim().replace(/^\w/g, (t) => t.toUpperCase())}, 
				date: {value: date.value}, 
				time: {value: time.value},
				notification: {value: notification.value},
				category: {value: category.value},
				repeat: {value: repeat.value}
			};
			let similar = await Promise.resolve(values.some((t) => JSON.stringify(t) == JSON.stringify(value)));
			if(similar) {
				return Notify.popUpNote("Similar task already added");
			} 
			values.push(value);
			await localforage.setItem("default", [...this.#categories.entries()]);
		} 
		else if(e.target.parentNode.parentNode.classList.contains("quick_task")) {
			let title = $("#add_body_form_title");
			if(title.value == "") {
				Notify.popUpNote("Fill out this field first");
				title.focus();
				return;
			} 
			let tasks = await Promise.all(Array.from($$(".add_body_form_quick_tasks > li > div > span")).map((task) => {return {value: task.textContent, finished: false}}));
			if(tasks.length == 0) {
				Notify.popUpNote("Add at least one task to continue.");
				$("#add_body_form_quick_input").focus();
				return;
			} 
			
			let similar = await Promise.resolve(this.#quick.some((t) => t.title.value == title.value.trim()));
			
			if(similar) {
				return Notify.popUpNote("Similar task with this title already added");
			} 
			
			let value = {
				type: "quick", 
				title: {value: title.value.trim()}, 
				tasks: {value: tasks},
				addedTime: {value: Date.now()},
				time: {value: Settings.values.quickNotificationTime}, 
				notification: {value: 0}
			} 
			this.#quick.push(value);
			await localforage.setItem("quick", [...this.#quick]);
		} 
		SendMsg({type: "get-due-tasks"});
		await this.render();
		$(".main").style.display = "block";
		$(".add").style.display = "none";
	} 
	
	static editingOff = async (e) => {
		this.#editingElement = null;
	} 
	
	static edit = async (e) => {
		e.stopPropagation();
		if(e.target.classList.contains("quick")) {
			let title = e.target.getAttribute("value");
			let tasks = [...e.target.$$("div .main_body_item_title")].map((t) => t.getAttribute("value"));
			$("#add_body_form_title").value = title;
			let list = $(".add_body_form_quick_tasks");
			list.innerHTML = "";
			for(let task of tasks) {
				await new Promise((resolve) => {
					$("#add_body_form_quick_input").value = task;
					$(".add_body_form_quick_add").click();
					resolve("done");
				});
			} 
			$("#add_body_form_quick_input").value = "";
			$(".quick_task").style.display = "block";
			$(".default_task").style.display = "none";
		} 
		else if(e.target.classList.contains('main_body_item')) {
			let task = e.target.$(".main_body_item_title").getAttribute("value");
			let desc = e.target.$(".main_body_item_desc").getAttribute("value");
			let [date, time, repeat, notification] = desc.split("&");
			let ctgr = e.target.$(".main_body_item_category").getAttribute("value");
			
			$(".default_task .add_body_form").reset();
			$("#add_body_form_desc").innerHTML = task;
			$("#add_body_form_desc").setAttribute("value", task);
			$("#add_body_form_date").value = date;
			$("#add_body_form_date").dispatchEvent(new Event("change"));
			$("#add_body_form_time").value = time;
			$("#add_body_form_time").dispatchEvent(new Event("change"));
			let ntfc = $("#add_body_form_notification").$(`option[value='${notification}'`);
			if(!ntfc) {
				let h = Math.floor(parseInt(notification) / 60);
				let m = parseInt(notification) % 60;
				let text = (h > 0? h + (h > 1? " hours": " hour"): "") + (m > 0? m + (m > 1? " minutes": " minute"): "");
				let option = $$$("option", ["value", repeat, "textContent", `${text} before`]);
				let ref;
				for(ref of $$("#add_body_form_notification option")) {
					if(parseInt(ref.value) > parseInt(notification)) break;
					else ref = null;
				} 
				option.selected = true;
				$("#add_body_form_notification").insertBefore(option, ref);
			} 
			else {
				ntfc.selected = true;
			} 
			
			let rpt = $("#add_body_form_repeat").$(`option[value='${repeat}'`);
			if(!rpt) {
				let option = $$$("option", ["value", repeat, "textContent", repeat]);
				let ref;
				let options = Array.from($$("#add_body_form_repeat option"));
				options.splice(0, 6);
				for(ref of options) {
					let val1 = repeat.replaceAll(/day.*$/g, "1").replaceAll(/week.*$/g, "2").replaceAll(/month.*$/g, "3").replaceAll(/year.*$/g, "4").split(" ");
					let val2 = ref.value.replaceAll(/day.*$/g, "1").replaceAll(/week.*$/g, "2").replaceAll(/month.*$/g, "3").replaceAll(/year.*$/g, "4").split(" ");
					if(val2[1] > val1[1]) break;
					else if(val2[1] == val1[1] && val2[0] > val1[0]) break;
					else ref = undefined;
				} 
				option.selected = true;
				$("#add_body_form_repeat").insertBefore(option, ref);
			} 
			else {
				rpt.selected = true;
			} 
			
			let options = $("#add_body_form_category");
			options.innerHTML = "";
			for(let category of this.getCategoryNames()) {
				await new Promise((resolve) => {
					let option = $$$("option", ["value", category, "textContent", category.replace(/^\w/g, (t) => t.toUpperCase())])
					if(category == ctgr) option.selected = true;
					options.appendChild(option);
					resolve("done");
				});
			} 
			$(".quick_task").style.display = "none";
			$(".default_task").style.display = "block";
		} 
		this.#editingElement = e.target;
		$(".add").style.display = "block";
		$(".main").style.display = "none";
	} 
	
	static finish = async (e, category, keyword, task) => {
		e.stopPropagation();
		if(category == "quick") {
			task.finished = e.target.checked;
			let tasks = this.#quick.find((t) => t.title.value == keyword);
			let allFinished = await tasks.tasks.value.every((t) => t.finished);
			if(allFinished) {
				let finishChoice = "Finish";
				if(Settings.values.confirmFinishing)
				finishChoice = await Notify.confirm({header: "Confirm Finish", 
													 message: "Are you sure you want to finish " + keyword + " task?", 
													 type: "Cancel/Finish"});
													
				if(finishChoice == "Finish") {
					let index = this.#quick.indexOf(tasks);
					this.#quick.splice(index, 1);
					let finished = this.#finished.get("quick");
					finished.push(JSON.parse(JSON.stringify(tasks)));
					await new Sleep().wait(0.5);
					e.target.parentNode.classList.add("remove");
					await new Sleep().wait(0.5);
					await localforage.setItem("quick", [...this.#quick]);
					await localforage.setItem("finished", [...this.#finished.entries()]);
					SendMsg({yype: "get-due-tasks"});
					this.render();
				} 
				else {
					task.finished = false;
					e.target.checked = false;
				} 
			} 
			else {
				await localforage.setItem("quick", [...this.#quick]);
			} 
		} 
		else if(category) {
			let finishChoice = "Finish";
			if(Settings.values.confirmFinishing)
			finishChoice = await Notify.confirm({header: "Confirm Finish", 
												 message: "Are you sure you want to finish " + JSON.parse(keyword).task.value + " task?", 
												 type: "Cancel/Finish"});
												
			if(finishChoice == "Finish") {
				let values = this.#categories.get(category);
				task = await values.find((t) => JSON.stringify(t) == keyword);
				let index = values.indexOf(task);
				values.splice(index, 1);
				let finished = this.#finished.get("default");
				finished.push(JSON.parse(JSON.stringify(task)));
				await new Sleep().wait(0.5);
				e.target.parentNode.classList.add("remove");
				await new Sleep().wait(0.5);
				if(task.repeat.value != "no repeat") {
					let rptTask = await Tasks.repeat(task);
					if(rptTask) 
						values.push(rptTask);
				} 
				await localforage.setItem("default", [...this.#categories.entries()]);
				await localforage.setItem("finished", [...this.#finished.entries()]);
				SendMsg({type: "get-due-tasks"});
				this.render();
			} 
			else {
				e.target.checked = false;
			} 
		} 
	} 
	
	static repeat = async (task) => {
		let date = new Date(task.date.value);
		switch(task.repeat.value) {
			case "daily":
			date.setDate(date.getDate() + 1);
			break;
			
			case "weekdays":
			let weekdays = [1, 2, 3, 4, 5];
			let newDate = new Date(date.toDateString());
			newDate.setDate(newDate.getDate() + 1);
			if(weekdays.includes(newDate.getDay())) 
			date = newDate;
			else 
			date.setDate(date.getDate() + (date.getDay() == 6? 2: 1));
			break;
			
			case "weekly":
			date.setDate(date.getDate() + 7);
			break;
			
			case "monthly":
			date.setMonth(date.getMonth() + 1);
			break;
			
			case "yearly":
			date.setFullYear(date.getFullYear() + 1);
			break;
			
			default:
			let rpt = task.repeat.value.split(" ");
			if(rpt[1] == "days") 
			date.setDate(date.getDate() + parseInt(rpt[0]));
			else if(rpt[1] == "weeks") 
			date.setDate(date.getDate() + (parseInt(rpt[0]) * 7));
			else if(rpt[1] == "months") 
			date.setMonth(date.getMonth() + parseInt(rpt[0]));
			else if(rpt[1] == "years") 
			date.setFullYear(date.getFullYear() + parseInt(rpt[0]));
		} 
		
		task.date.value = date.toISOString().split("T")[0];
		task.date.valStr = toDateString(date);
		
		await new Sleep().wait(0.5);
		let repeatChoice = "Repeat";
		if(Settings.values.confirmRepeating) {
			repeatChoice = await Notify.confirm({
				header: "Confirm Repeat", 
				message: "This task will repeat on " + date.toDateString(), 
				type: "Cancel/Repeat"
			});
		} 
		
		if(repeatChoice == "Repeat") { 
			return task;
		} 
		else {
			return null;
		} 
	} 
	
	static delete = async (e, category, keyword, type) => {
		e.stopPropagation();
		let deleteChoice = "Delete";
		if(!this.#editingElement) 
			deleteChoice = await Notify.confirm({header: "Confirm Delete",
												 message: type == "finished"? "Are you sure you want to delete this task?" :"Are you sure you want to delete '" + (category != "quick"? JSON.parse(keyword).task.value: keyword) + "' task from " + category + " category?", 
												 type: "Cancel/Delete"});
												
		if(deleteChoice == "Delete") {
			if(category == "quick") {
				if(type == "finished") {
					let index = await this.#finished.get("quick").findIndex((task) => {return task.title.value == keyword});
					this.#finished.get("quick").splice(index, 1);
					await localforage.setItem("finished", [...this.#finished.entries()]);
				} 
				else {
					let index = await this.#quick.findIndex((task) => {return task.title.value == keyword});
					this.#quick.splice(index, 1);
					await localforage.setItem("quick", [...this.#quick]);
				} 
			} 
			else {
				if(type == "finished") {
					let index = await this.#finished.get("default").findIndex((task) => JSON.stringify(task) == keyword);
					this.#finished.get("default").splice(index, 1);
					await localforage.setItem("finished", [...this.#finished.entries()]);
				} 
				else {
					let values = this.#categories.get(category);
					let index = await values.findIndex((task) => JSON.stringify(task) == keyword);
					values.splice(index, 1);
					await localforage.setItem("default", [...this.#categories.entries()]);
				} 
			} 
			if(!this.#editingElement) {
				await new Sleep().wait(0.5);
				e.target.parentNode.classList.add("remove");
				await new Sleep().wait(0.5);
				SendMsg({type: "get-due-tasks"});
				this.render();
			} 
			else {
				this.#editingElement = null;
				this.#sleep.end();
			} 
		} 
	} 
	
	static sort = async (type) => {
		let arr;
		if(type == "finished") arr = [...this.#finished.get("default")];
		else arr = [...this.#categories.values()];
		arr = arr.flat(Infinity);
		arr = await Promise.all(
			arr.sort((a, b) => {
				let at = new Date(a.date.value + "T" + convertTo(a.time.value, 24)).getTime();
				let bt = new Date(b.date.value + "T" + convertTo(b.time.value, 24)).getTime();
				if(at < Date.now() && bt >= Date.now()) {
					return -1;
				} 
				else if(bt < Date.now() && at >= Date.now()) {
					return 1;
				} 
				else if(new Date(a.date.value + "T00:00:00").getTime() > new Date(b.date.value + "T00:00:00").getTime()) {
					 return 1;
				} 
				else if(new Date(a.date.value + "T00:00:00").getTime() < new Date(b.date.value + "T00:00:00").getTime()) {
					return -1;
				} 
				else if(Settings.values.sortingOrder == "alphabetically asc") {
					if(a.task.value > b.task.value) return 1;
					else if(a.task.value < b.task.value) return -1;
				} 
				else if(Settings.values.sortingOrder == "alphabetically desc") {
					if(a.task.value < b.task.value) return 1;
					else if(a.task.value > b.task.value) return -1;
				} 
				else if(Settings.values.sortingOrder == "old") {
					if(at < bt) return 1;
					else if(at > bt) return -1;
				} 
				else if(Settings.values.sortingOrder == "new") {
					if(at > bt) return 1;
					else if(at < bt) return -1;
				} 
			})
		);
		let quick;
		if(type == "finished") quick = [...this.#finished.get("quick")];
		else quick = [...this.#quick];
		quick = await Promise.all(
			quick.sort((a, b) => {
				if(Settings.values.sortingOrder == "alphabetically asc") {
					if(a.title.value > b.title.value) return 1;
					else return -1;
				} 
				else if(Settings.values.sortingOrder == "alphabetically desc") {
					if(a.title.value < b.title.value) return 1;
					else return -1;
				} 
				else if(Settings.values.sortingOrder == "old") {
					if(a.addedTime.value < b.addedTime.value) return 1;
					else return -1;
				} 
				else if(Settings.values.sortingOrder == "new") {
					if(a.addedTime.value > b.addedTime.value) return 1;
					else return -1;
				} 
			})
		);
		return quick.concat(arr);
	} 
		
	static render = async (category, tasks) => {
		category = category || $(".main_header_categories .showing_category").getAttribute("value");
		tasks = tasks || await this.sort(category);
		let section = $(".main_body_item_cont");
		section.innerHTML = "";
		
		for(let value of tasks) {
			if(value.type == "default" && (category == "all" || category == "finished" || value.category.value == category)) {
				let today = new Date();
				let tomorrow = new Date();
				tomorrow.setDate(today.getDate() + 1);
				let nextMonth = new Date();
				nextMonth.setMonth(today.getMonth() + 1);
				
				let sundayWeek = [0, 1, 2, 3, 4, 5, 6];
				let mondayWeek = [1, 2, 3, 4, 5, 6, 0];
				let saturdayWeek = [6, 0, 1, 2, 3, 4, 5];
				
				let thisWeek = [];
				let firstDay = Settings.values.firstDay;
				let week = firstDay == "sunday"? sundayWeek: firstDay == "monday"? mondayWeek: saturdayWeek;
				let day = new Date(today.toDateString());
				thisWeek.push(day.toDateString());
				for(let i = week.indexOf(day.getDay()) + 1; i < week.length; i++) {
					day.setDate(day.getDate() + 1);
					thisWeek.push(day.toDateString());
				} 
				
				let nextWeek = [];
				day = new Date(thisWeek[thisWeek.length-1]);
				day.setDate(day.getDate() + 1);
				nextWeek.push(day.toDateString());
				for(let i = 1; i < week.length; i++) {
					day.setDate(day.getDate() + 1);
					nextWeek.push(day.toDateString());
				} 
				
				let date = new Date(value.date.value+"T"+value.time.value);
				let setDate = date.getTime() + 1000 < today.getTime()? "Overdue":
							  date.toDateString() == today.toDateString()? "Today":
							  date.toDateString() == tomorrow.toDateString()? "Tomorrow":
							  thisWeek.includes(date.toDateString())? "This week":
							  nextWeek.includes(date.toDateString())? "Next week":
							  date.getMonth() == today.getMonth()? "This month":
							  date.getMonth() == nextMonth.getMonth()? "Next month": value.date.valStr;
				
				let fieldset = $(`.main_body_item_set[value='${setDate}']`) || $$$("fieldset", ["class", "main_body_item_set " + (setDate == "Overdue"? "danger": ""), "value", setDate]);
				let legend = fieldset.$("legend") || $$$("legend", ["textContent", setDate]);
				let div = $$$("div", ["class", "main_body_item " + (category == "finished"? "finished": ""), "taskid", JSON.stringify(value)]);
				let text = $$$("div");
				let checkbox = $$$("input", ["type", "checkbox"]);
				let title = $$$("div", ["class", "main_body_item_title", "value", value.task.value, "innerHTML", value.task.value]);
				let desc = $$$("div", ["class", "main_body_item_desc", "value", value.date.value + "&" + value.time.value + "&" + value.repeat.value + "&" + value.notification.value, "innerHTML", toDateString(new Date(value.date.value)).replace(/^\w+(?=\s)/g, (w) => w + ",") + ", " + convertTo(value.time.value, Settings.values.timeFormat) + (value.repeat.value != "no repeat"? "<span></span>": "")]);
				let ctgr = $$$("div", ["class", "main_body_item_category", "value", value.category.value, "textContent", value.category.value]);
				let del = $$$("div", ["class", "main_body_item_delete"]);
				text.appendChild(title);
				text.appendChild(desc);
				text.appendChild(ctgr);
				div.appendChild(checkbox);
				div.appendChild(text);
				div.appendChild(del);
				if(category != "finished") {
					if(!legend.parentNode) fieldset.appendChild(legend);
					fieldset.appendChild(div);
					if(!fieldset.parentNode) section.appendChild(fieldset);
				}
				else {
					section.appendChild(div);
					checkbox.checked = true;
				} 
				
				if(category == "all" || category == "finished") 
					ctgr.style.display = "block";
				else
					ctgr.style.display = "none";
					
				if(category != "finished") {
					checkbox.addEventListener("change", (e) => {
						Tasks.finish(e, value.category.value, JSON.stringify(value));
					}, false);
					
					checkbox.addEventListener("click", (e) => {
						e.stopPropagation();
					}, false);
				} 
				del.addEventListener("click", (e) => {
					Tasks.delete(e, value.category.value, JSON.stringify(value), category);
				}, false);
				div.addEventListener("click", Tasks.edit, false);
			} 
			else if(value.type == "quick" && (category == "all" || category == "finished" || category == "quick")) {
				let fieldset = $(`.main_body_item_set[value='${value.title.value}']`) || $$$("fieldset", ["class", "main_body_item_set", "value", value.title.value]);
				let legend = fieldset.$("legend") || $$$("legend", ["textContent", value.title.value]);
				let div = $$$("div", ["class", "main_body_item quick " + (category == "finished"? "finished": ""), "value", value.title.value]);
				let text = $$$("div");
				for(let task of value.tasks.value) {
					let cont = $$$("div", ["class", "main_body_item_quick_tasks"]);
					let checkbox = $$$("input", ["type", "checkbox"]);
					let title = $$$("div", ["class", "main_body_item_title", "value", task.value, "innerHTML", task.value]);
					cont.appendChild(checkbox); 
					cont.appendChild(title);
					text.appendChild(cont);
					
					if(category != "finished") {
						checkbox.checked = task.finished;
						checkbox.addEventListener("change", (e) => {
							Tasks.finish(e, "quick", value.title.value, task);
						}, false);
						
						checkbox.addEventListener("click", (e) => {
							e.stopPropagation();
						}, false);
					} 
					else {
						checkbox.checked = true;
					} 
				} 
				let del = $$$("div", ["class", "main_body_item_delete"]);
				div.appendChild(text);
				div.appendChild(del);
				if(category != "finished") {
					if(!legend.parentNode) fieldset.appendChild(legend);
					fieldset.appendChild(div);
					if(!fieldset.parentNode) section.appendChild(fieldset);
				}
				else {
					section.appendChild(div);
				} 
				
				del.addEventListener("click", (e) => {
					Tasks.delete(e, "quick", value.title.value, category);
				}, false);
				div.addEventListener("click", Tasks.edit, false);
			} 
		} 
		
		if(tasks.length == 0 || section.innerHTML == "") {
			if(category == "all") {
				section.classList.remove("empty");
				section.classList.add('empty_all');
				$(".main_body_item_empty").innerHTML = ``;
			} 
			else {
				section.classList.remove("empty_all");
				section.classList.add('empty');
				$(".main_body_item_empty").innerHTML = `There are no tasks for <span>${category}</span>.`;
			} 
		} 
		else {
			section.classList.remove("empty", "empty_all");
			$(".main_body_item_empty").innerHTML = "";
		} 
		
		if(category == "finished") {
			$(".main_body .add_btn:not(.add_choice)").style.display = "none";
		} 
		else {
			$(".main_body .add_btn:not(.add_choice)").style.display = "flex";
		} 
	} 
	
	static search = (e) => {
		let filtered = this.#tasks.filter((value) => {
			if(value.type == "default") 
				return value.task.value.toLowerCase().includes(e.target.value.toLowerCase());
			else
				return value.title.value.toLowerCase().includes(e.target.value.toLowerCase()) ||
					   value.tasks.value.map((t) => t.value).join("").toLowerCase().includes(e.target.value.toLowerCase());
		});
		this.render(undefined, filtered);
		if(filtered.length) {
			e.target.nextElementSibling.style.display = "inline-block";
			$(".main_body_item_cont").classList.remove("empty", "empty_all");
			$(".main_body_item_empty").innerHTML = "";
		} 
		e.target.nextElementSibling.style.display = e.target.value != ""? "inline-block": "none";
		if(!filtered.length && e.target.value != "") {
			$(".main_body_item_cont").classList.remove("empty_all");
			$(".main_body_item_cont").classList.add('empty');
			$(".main_body_item_empty").innerHTML = `Nothing found for <span>${e.target.value}</span>.`;
		} 
		else if(filtered.length && e.target.value == "") {
			$(".main_body_item_cont").classList.remove("empty", "empty_all");
			$(".main_body_item_empty").innerHTML = "";
		} 
		else if(!filtered.length) {
			$(".main_body_item_cont").classList.remove("empty_all");
			$(".main_body_item_cont").classList.add('empty');
			$(".main_body_item_empty").innerHTML = "";
		} 
	} 
} 

const NotificationClick = (elem) => {
	Notify.buttonAction(elem);
} 

class Notify {
	static popUpNote = (data) => {
		let popUpNote = $("#pop-up-note");
        popUpNote.innerHTML = data;
        popUpNote.style.display = "block";
        popUpNote.classList.remove("pop");
        void popUpNote.offsetWidth;
        popUpNote.classList.add("pop");
	} 
	static reset = () => {
		this.note_window = $("#notification-window"), 
        this.note_main = $("#note"), 
        this.note_image = $(".note_img"), 
        this.note_head = $(".note_header"), 
        this.note_body = $(".note_body"), 
        this.note_footer = $(".note_footer"), 
        this.note_buttons = this.note_footer.children,
        this.note_close_button = $("#note .close_btn");
         
        this.note_window.classList.remove("fade_note");
        this.note_window.style.justifyContent = "center";
        this.note_main.style.gridTemplateRows = "auto auto auto";
        this.note_main.style.gridTemplateColumns = "60px auto 25px";
        this.note_main.style.gridRowGap = "5px";
        this.note_main.style.padding = "10px";
        this.note_image.src = srcs[0];
        this.note_image.style.padding = "5px";
        this.note_image.style.objectFit = "contain";
        this.note_head.style.fontWeight = "900";
        this.note_body.style.display = "block";
        this.note_window.removeAttribute("onclick");
        this.note_close_button.style.display = "block";
       
        if(this.sleep)
        	this.sleep.end();
        else
        	this.sleep = new Sleep();
	} 

    static alert = async (data) => {
    	await this.reset();
    	this.note_head.innerHTML = data.header || "";
        this.note_body.innerHTML = data.message || "";
        this.note_buttons[0].style.display = "none";
        this.note_buttons[1].style.display = "none";
        this.note_buttons[2].style.display = "inline-block";
        this.note_buttons[2].textContent = "OK";
        this.note_buttons[2].setAttribute("value", "OK");
        this.note_window.setAttribute("onclick", "Notify.cancel()");
        this.note_close_button.setAttribute("value", "OK");
        this.note_close_button.style.pointerEvents = "auto";
		
        this.note_window.style.display = "flex";
        await this.sleep.start();
        return this.action;
    }
	static popUpAlert = async (data) => {
		await this.reset();
    	this.note_head.innerHTML = data.header || "";
        this.note_body.innerHTML = data.message || "";
        this.note_window.style.justifyContent = "flex-start";
        this.note_main.style.gridTemplateColumns = "100px auto";
        this.note_main.style.gridTemplateRows = "auto";
        this.note_main.style.padding = "5px";
        this.note_main.style.gridRowGap = "0px";
        this.note_image.style.padding = "0px 10px 0px 0px";
        this.note_close_button.style.display = "none";
        this.note_head.style.fontWeight = "500";
        this.note_body.style.display = "none";
        this.note_buttons[0].style.display = "none";
        this.note_buttons[1].style.display = "none";
        this.note_buttons[2].style.display = "none";
        let delay = data.delay || 1000;
        setTimeout(this.cancel, delay);
       
		this.note_window.style.display = "flex";
    } 
	static alertSpecial = async (data) => {
		await this.reset();
    	this.note_head.innerHTML = data.header || "";
        this.note_body.innerHTML = data.message || "";
        this.note_buttons[0].style.display = "none";
        this.note_buttons[1].style.display = "none";
        this.note_buttons[2].style.display = "none";
        this.note_close_button.style.pointerEvents = "none";
       
		this.note_window.style.display = "flex";
    } 
	static confirm = async (data) => {
		await this.reset();
    	this.note_head.innerHTML = data.header || "";
        this.note_body.innerHTML = data.message || "";
        this.note_buttons[0].style.display = "none";
        this.note_buttons[1].style.display = "inline-block";
        this.note_buttons[2].style.display = "inline-block";
        this.note_buttons[1].textContent = data.type.split("/")[0];
        this.note_buttons[2].textContent = data.type.split("/")[1];
        this.note_buttons[1].setAttribute("value", data.type.split("/")[0]);
        this.note_buttons[2].setAttribute("value", data.type.split("/")[1]);
        this.note_close_button.setAttribute("value", data.type.split("/")[0]);
        this.note_close_button.style.pointerEvents = "auto";
       
		this.note_window.style.display = "flex";
        await this.sleep.start();
        return this.action;
	}
    static other = async (data) => {
    	await this.reset();
    	this.note_head.innerHTML = data.header || "";
        this.note_body.innerHTML = data.message || "";
        this.note_buttons[0].style.display = "inline-block";
        this.note_buttons[1].style.display = "inline-block";
        this.note_buttons[2].style.display = "inline-block";
        this.note_buttons[0].innerHTML = data.type.split("/")[0];
        this.note_buttons[1].innerHTML = data.type.split("/")[1];
        this.note_buttons[2].innerHTML = data.type.split("/")[2];
        this.note_buttons[0].setAttribute("value", data.type.split("/")[0]);
        this.note_buttons[1].setAttribute("value", data.type.split("/")[1]);
        this.note_buttons[2].setAttribute("value", data.type.split("/")[2]);
        this.note_close_button.setAttribute("value", data.type.split("/")[0]);
        this.note_close_button.style.pointerEvents = "auto";
       
		this.note_window.style.display = "flex";
        await this.sleep.start();
        return this.action;
    }
   
    static buttonAction = async (elem) => {
    	this.action = elem.getAttribute("value");
    	this.sleep.end();
    	this.cancel();
    }
   
	static cancel = async () => {
		this.note_window = $("#notification-window");
	    this.note_window.classList.remove("fade_note");
	    void this.note_window.offsetWidth;
	    this.note_window.setAttribute("onanimationend", "End(event)");
	    this.note_window.classList.add("fade_note");
	} 
}

const End = (event) => {
	try {
	    if(event.animationName === "pop-out") {
	        let popUpNote = $("#pop-up-note");
	        popUpNote.style.display = "none";
	    } 
		else if(event.animationName === "fade-note") {
			let note = $("#notification-window");
	        note.style.display = "none";
		} 
	} catch (error) {
		reportError(error);
	} 
} 

const toDateString = (date) => {
	let today = new Date();
	let yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);
	let tomorrow = new Date();
	tomorrow.setDate(today.getDate() + 1);
	let str = date.toDateString() == yesterday.toDateString()? "Yesterday": date.toDateString() == today.toDateString()? "Today": date.toDateString() == tomorrow.toDateString()? "Tomorrow": date.toDateString();
	return str;
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

class Sleep {
	i = 0;
	j = 1_000;
	running = false;
	start = () => {
		let self = this;
		this.i = 0;
		this.j = 1_000;
		return new Promise((resolve, reject) => {
			self.runinng = true;
			const it = setInterval(() => {
				self.i+=0.001;
				if(self.i >= self.j) {
					self.i = 0;
					self.j = 1_000;
					self.runinng = false;
					clearInterval(it);
					resolve("Done");
				} 
			}, 1);
		});
	} 
	end = () => {
		this.i = this.j;
	} 
	wait = async (sec) => {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve("Done");
			}, sec * 1000);
		});
	} 
} 