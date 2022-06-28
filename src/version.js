class Updates {
	static version = "28.16.21.77";
	static updatesLog = new Map([
		["27.6.5.35", ["Fixed some errors."]], 
		["28.16.21.77", ["Added quick tasks option.", "Added custom notification settings for each task.", "Added more settings options.", "Added task category.", "Added text to speech synthesis output.", "Changed task design.", "Fixed some errors."]]
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