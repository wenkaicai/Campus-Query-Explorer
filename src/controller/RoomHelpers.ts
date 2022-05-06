import http from "http";
import parse5 from "parse5";
import Room from "./Room";
import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import RoomDataset from "./RoomDataset";

export function getTitle(nodes: parse5.ChildNode[], fieldValue: string): string[] {
	const className = "class";
	const cNodes = "childNodes";
	const value = "value";
	const a = "a";
	const storeTitle = new Array<any>();
	for (const nd of nodes) {
		if ("attrs" in nd) {
			for (const attribute of nd.attrs) {
				if (attribute.value === fieldValue && attribute.name === className && cNodes in nd) {
					for (const childNd of nd.childNodes) {
						if (childNd.nodeName === a && cNodes in childNd) {
							for (const childChildNd of childNd.childNodes) {
								if (value in childChildNd) {
									// clean format
									storeTitle.push(childChildNd.value.trim());
								}
							}
						}
					}
				}
			}
		}
	}
	return storeTitle;
}

export function getValueInTd(nodes: parse5.ChildNode[], fieldValue: string): string[] {
	const className = "class";
	const cNodes = "childNodes";
	const value = "value";
	const storeInformation = new Array<any>();
	for (const nd of nodes) {
		if ("attrs" in nd) {
			for (const attribute of nd.attrs) {
				if (attribute.value === fieldValue && attribute.name === className && cNodes in nd) {
					for (const childNd of nd.childNodes) {
						if (value in childNd) {
							storeInformation.push(childNd.value.trim());
						}
					}
				}
			}
		}
	}
	return storeInformation;
}

export async function everyBuidlingRooms(result: JSZip, titles: string[], idx: any, codes: string[],
	addresses: string[], roomsArray: any[], mapBuildingRooms: Map<string, any[]>) {
	const buildingsInfo = await result
		.folder("rooms")
		?.folder("campus")
		?.folder("discover")
		?.folder("buildings-and-classrooms");
	const buildingData = await buildingsInfo?.file(codes[idx])?.async("string");
	if (buildingData) {
		const buildingDoc = parse5.parse(buildingData);
		// find all rooms
		const tdNodes: parse5.ChildNode[] = [];
		const tD = "td";
		const viewField = "views-field";
		const space = " ";
		findTreeKeyWord(tD, buildingDoc.childNodes, tdNodes);
		const roomNumber = getTitle(tdNodes, viewField + space + "views-field-field-room-number");
		const roomType = getValueInTd(tdNodes, viewField + space + "views-field-field-room-type");
		const roomCapacity = getValueInTd(tdNodes, viewField + space + "views-field-field-room-capacity");
		const furniture = getValueInTd(tdNodes, viewField + space + "views-field-field-room-furniture");
		const href = "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/";
		const buildingRoomsArray = [];
		const underLine = "_";
		const dash = "-";
		const geoLocation = JSON.parse(await getBuildingGeoLocation(addresses[idx]));
		for (const x in roomNumber) {
			let room: Room = new Room(
				titles[idx],
				codes[idx],
				roomNumber[x],
				codes[idx] + underLine + roomNumber[x],
				addresses[idx],
				geoLocation.lat,
				geoLocation.lon,
				Number(roomCapacity[x]),
				roomType[x],
				furniture[x],
				href + codes[idx] + dash + roomNumber[x]);
			buildingRoomsArray.push(room);
			roomsArray.push(room);
		}
		mapBuildingRooms.set(codes[idx], buildingRoomsArray);
	}
}

export async function getBuildingGeoLocation(address: string): Promise<string> {
	return new Promise((resolve, reject) => {
		let webPath = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team584/";
		let webData = "";
		const space = " ";
		const data = "data";
		const end = "end";
		const error = "error";
		webPath = webPath + address.replace(space, "%20");
		http.get(webPath, (after: any) => {
			after.on(data, (portion: string) => webData += portion);
			after.on(end, () => resolve(webData));
		}).on(error, reject);
	});
}

export function findTreeKeyWord(keyWord: string, treeNodes: parse5.ChildNode[], nodesFound: parse5.ChildNode[]): void {
	const cNodes = "childNodes";
	for (const node of treeNodes) {
		if (node.nodeName === keyWord) {
			nodesFound.push(node);
		}
		if (cNodes in node) {
			findTreeKeyWord(keyWord, node.childNodes, nodesFound);
		}
	}
}

export async function unzipFile(content: string, roomsArray: Room[], mapBuildingRooms: Map<string, any[]>, id: any,
	kind: any): Promise<RoomDataset> {
	return new Promise<RoomDataset>((resolve, reject) => {
		const zip = require("jszip");
		const allRoomsPromises: Array<Promise<void>> = [];
		zip.loadAsync(content, {base64: true}).then((newZip: JSZip) => {
			if (newZip.folder("rooms")?.file("index.htm") === null) {
				reject(new InsightError("wrong type given!"));

			}
			newZip.folder("rooms")?.file("index.htm")?.async("string").then(async (htmlContent) => {
				const jsTree = parse5.parse(htmlContent);
				const tdNodes: parse5.ChildNode[] = [];
				const tD = "td";
				const viewField = "views-field";
				const space = " ";
				findTreeKeyWord(tD, jsTree.childNodes, tdNodes);
				const title = getTitle(tdNodes, viewField + space + "views-field-title");
				const buildingCode = getValueInTd(tdNodes, viewField + space + "views-field-field-building-code");
				const bdAddress = getValueInTd(tdNodes, viewField + space + "views-field-field-building-address");
				for (let idx in buildingCode) {
					allRoomsPromises.push(everyBuidlingRooms(newZip, title, idx, buildingCode, bdAddress,
						roomsArray, mapBuildingRooms));
				}
				await Promise.all(allRoomsPromises);
				const roomDataset = new RoomDataset(id, kind, roomsArray.length, mapBuildingRooms);
				resolve(roomDataset);
			}).catch((error: any) => {
				reject(new InsightError("Error parsing the html content"));
			});
		}).catch((error: any) => {
			reject(new InsightError("Error in parsing room zip file"));
		});
	});
}


