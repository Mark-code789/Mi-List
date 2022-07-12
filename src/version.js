class Updates {
	static version = "31.18.35.104";
	static updatesLog = new Map([
		["27.6.5.35", ["Fixed some errors."]], 
		["28.16.21.84", ["Added quick tasks option.", "Added custom notification settings for each task.", "Added more settings options.", "Added task category.", "Added text to speech synthesis output.", "Changed task design.", "Fixed some errors."]], 
		["28.16.22.90", ["Squashed some bugs."]], 
		["28.16.23.91", ["Added check for update option in the settings."]], 
		["28.17.23.92", ["Squashed some bugs."]], 
		["28.17.24.93", ["Improved check for update settings option."]], 
		["29.18.25.94", ["Added task sharing option."]], 
		["29.18.27.96", ["Fixed edit task error.", "Added this and next month task ordering headings.", "Fixed app updating error.", "Squashed some more bags."]], 
		["29.18.28.97", ["Fixed a small UI bug."]], 
		["29.18.29.98", ["Fixed a small UI bug."]], 
		["30.18.30.99", ["Added more apps options in the settings.", "Notification not showing sometimes."]],
		["30.18.32.100", ["Fixed a small bug."]],
		["30.18.33.101", ["Fixed a small bug."]], 
		["31.18.34.102", ["Added support lines.", "Fixed screen going white.", "Fixed minor bugs."]], 
		["31.18.35.103", ["Fixed weekdays repeat."]], 
		["31.18.35.104", ["Made possible sharing of tasks on different Mi-List app.", "Fixed task repeat failure when finished from notification window.", "Fixed some minor bugs."]], 
	]);
	static getDescription = (version) => {
		let versionDescription = "<ul>";
		if(!version) {
			for(let [key, value] of this.updatesLog.entries()) {
				if(key >= currentAppVersion) {
					versionDescription += `<li>Version: ${key}</li><ul>${value.map(desc => "<li>" + desc + "</li>").join("")}</ul>`;
				} 
			} 
		} 
		else {
			let value = this.updatesLog.get(version);
			value = !value? this.updatesLog.get(Array.from(this.updatesLog.keys())[0]): value;
			versionDescription += value.map(desc => "<li>" + desc + "</li>").join("");
		} 
		versionDescription += "</ul>";
		return versionDescription;
	} 
}