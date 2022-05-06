import *as fs from "fs-extra";
import CourseDataset, {CourseSection} from "./CourseDataset";
import {persistDir} from "./Constants";
import Room from "./Room";
import path from "path";
import RoomDataset from "./RoomDataset";

export function writeDataToDisk(id: string, dataset: CourseDataset) {
	const doubleDots = "..";
	const data = "data";
	const jsonFile = path.join(__dirname, doubleDots, doubleDots, data);
	if (!fs.existsSync(jsonFile)){
		fs.mkdirSync(jsonFile);
	}
	fs.writeFileSync(persistDir + "/" + id + ".json", JSON.stringify(dataset));
}

export function WriteRoomToDisk(id: string, arrayAdded: string[], roomDatasetAdded: RoomDataset[]) {
	const doubleDots = "..";
	const data = "data";
	const jsonFile = path.join(__dirname, doubleDots, doubleDots, data);
	if (!fs.existsSync(jsonFile)){
		fs.mkdirSync(jsonFile);
	}
	const bRooms = roomDatasetAdded[arrayAdded.indexOf(id)];
	bRooms.buildingRooms = Object.fromEntries(roomDatasetAdded[arrayAdded.indexOf(id)].buildingRooms);
	const directory = path.join(__dirname, doubleDots, doubleDots, data, id + ".json");
	fs.writeFileSync(directory, JSON.stringify(bRooms));
}

export function readDatafromDisk(): Map<string, CourseDataset>  {
	const datasetMap: Map<string, CourseDataset> = new Map();
	fs.readdirSync(persistDir).forEach(function (file: any) {
		if (file.split(".").pop() === ".json") {
			const jsoncontent = JSON.parse(fs.readFileSync(persistDir + file).toString());
			const id = jsoncontent.id;
			const kind = jsoncontent.kind;
			helperGetCourseSection(jsoncontent.sections);
			const newDataSet = new CourseDataset(id, kind);
			newDataSet.sections.push(jsoncontent.sections);
			datasetMap.set(id,newDataSet);
		}
	});
	if (datasetMap.size === 0) {
		console.log("no data in the disk yet");
	} else {
		console.log("successfully read data from disk");
	}
	return datasetMap;
}

export function removeDataFromDisk(id: string) {
	const name = persistDir + "/" + id + ".json";
	return fs.removeSync(name);
}

export function helperGetCourseSection (jsonObject: any): CourseSection {
	return {
		courses_dept: jsonObject.Subject,
		courses_id: jsonObject.Course,
		courses_avg: jsonObject.Avg,
		courses_instructor: jsonObject.Professor,
		courses_title: jsonObject.Title,
		courses_pass: jsonObject.Pass,
		courses_fail: jsonObject.Fail,
		courses_audit: jsonObject.Audit,
		courses_uuid: String(jsonObject.id),
		courses_year: jsonObject.Section === "overall" ? 1900 : Number(jsonObject.Year)
	};
}

// An id is invalid if it contains an underscore, or is only whitespace characters.
export function helperValidIdCheck(id: string): boolean {
	if (id.trim() === ""){
		return false;
	}
	let validid = new RegExp(/^[^_]+$/);
	return validid.test(id);
}

export function helperstarfirst(inputstring: string): boolean {
	let starfirst = new RegExp(/^[*][^*]*$/);
	return starfirst.test(inputstring);
}

export function helperstarlast(inputstring: string): boolean {
	let starlast = new RegExp(/^[^*]*[*]$/);
	return starlast.test(inputstring);
}

export function helperstartwosides(inputstring: string): boolean {
	let startwosides = new RegExp(/^[*][^*]*[*]$/);
	return startwosides.test(inputstring);
}

export function helpervalidIStarget(inputstring: string): boolean {
	// only one start
	let starfirst = new RegExp(/^[*][^*]*$/);
	let starlast = new RegExp(/^[^*]*[*]$/);
	let startwosides = new RegExp(/^[*][^*]*[*]$/);

	if (!inputstring.includes("*")){
		return true;
	} else if (!starfirst.test(inputstring) && !starlast.test(inputstring) && !startwosides.test(inputstring)){
		return false;
	}
	return true;
}
