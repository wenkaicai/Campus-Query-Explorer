import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult, NotFoundError,
	ResultTooLargeError} from "./IInsightFacade";
import {helperValidIdCheck, readDatafromDisk, removeDataFromDisk, writeDataToDisk, WriteRoomToDisk} from "./Util";
import CourseDataset from "./CourseDataset";
import *as fs from "fs-extra";
import {COMPARATOR, persistDir} from "./Constants";
import {COMPfunc, emptywhereresulthelper, getreqcols, helpersort, queryWHEREOPTIONS, validOPTIONS, validWHERE}
	from "./QueryHelper";
import {unzipFile} from "./RoomHelpers";
import RoomDataset from "./RoomDataset";

let roomsArray = new Array<any>();

export default class InsightFacade implements IInsightFacade {
	public insightdatasetMap = new Map();
	public datasetMap = new Map();
	private arrayAdded: string[] = [];
	private roomDatasetAdded: RoomDataset[] = [];
	private mapBuildingRooms = new Map<string, any[]>();

	constructor() {
		console.log("InsightFacadeImpl Initiated");
		fs.ensureDirSync(persistDir);
		if (fs.readdirSync(persistDir).length !== 0){
			this.datasetMap = readDatafromDisk();
		}
		for (let dataset of this.datasetMap.values()) {
			const newInsightdataset: InsightDataset = {
				id : dataset.id,
				kind : dataset.kind,
				numRows: dataset.sections.length,
			};
			this.insightdatasetMap.set(dataset.id, newInsightdataset);
		}
		console.log("InsightFacade Constructor Completed");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!helperValidIdCheck(id) || this.datasetMap.has(id) || this.arrayAdded.includes(id)) {
			return Promise.reject(new InsightError());
		}
		if (kind === "courses") {
			return new Promise<string[]>((resolve, reject) => {
				const dataset = new CourseDataset(id, kind);
				return dataset.unzipFile(content)
					.then((courseSections) => {
						this.datasetMap.set(id, dataset);
						const newInsightDataset: InsightDataset = {
							id: id,
							kind: kind,
							numRows: courseSections.length
						};
						this.insightdatasetMap.set(id, newInsightDataset);
						writeDataToDisk(id, dataset);
						return resolve([...this.datasetMap.keys()]);
					}).catch((error) => {
						reject(new InsightError());
					});
			});
		} else if (kind === "rooms") {
			return new Promise<string[]>((resolve, reject) => {
				return unzipFile(content, roomsArray, this.mapBuildingRooms, id, kind)
					.then((dataset) => {
						this.arrayAdded.push(id);
						this.roomDatasetAdded.push(dataset);
						WriteRoomToDisk(id, this.arrayAdded, this.roomDatasetAdded);
						return resolve(this.arrayAdded);
					}).catch((error) => {
						reject(new InsightError());
					});
			});
		}
		return Promise.resolve(this.arrayAdded);
	}

	public removeDataset(id: string): Promise<string> {
		if (!helperValidIdCheck(id)) {
			return Promise.reject(new InsightError());
		}
		if (!this.arrayAdded.some((idAdded) => idAdded === id) && !this.datasetMap.has(id)) {
			return Promise.reject(new NotFoundError());
		}
		if (this.datasetMap.has(id)) {
			return new Promise<string>((resolve, reject) => {
				this.datasetMap.delete(id);
				this.insightdatasetMap.delete(id);
				removeDataFromDisk(id);
				return resolve(id);
			}).catch((error) => {
				return Promise.reject(new InsightError());
			});
		}
		if (this.arrayAdded.some((idAdded) => idAdded === id)) {
			return new Promise<string>((resolve, reject) => {
				this.arrayAdded.splice(this.arrayAdded.indexOf(id), 1);
				this.roomDatasetAdded.splice(this.arrayAdded.indexOf(id), 1);
				removeDataFromDisk(id);
				return resolve(id);
			}).catch((error) => {
				return Promise.reject(new InsightError());
			});
		}
		return Promise.reject(new InsightError());
	}

	public listDatasets(): Promise<InsightDataset[]> {
		// return Promise.resolve([...this.insightdatasetMap.values()]);
		let datasetsArray: InsightDataset[] = [];
		for (let dataset of this.insightdatasetMap.values()) {
			datasetsArray.push(dataset);
		}
		this.roomDatasetAdded.forEach((roomDataset) => {
			datasetsArray.push({id: roomDataset.id, kind: roomDataset.kind, numRows: roomDataset.length});
		});
		return Promise.resolve(datasetsArray);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		let Query: any;
		Query = query;
		const where = Query.WHERE;
		const options = Query.OPTIONS;
		const transformations = Query.TRANSFORMATIONS;

		// check if the query is valid (excluding WHERE keys)
		if (!queryWHEREOPTIONS(Query)){
			return Promise.reject(new InsightError("invalid query: missing WHERE/OPTIONS/TRANSFORMATIONS"));
		}
		if (!validOPTIONS(options)){
			return Promise.reject(new InsightError("invalid query: invalid OPTIONS"));
		}

		const columns = options.COLUMNS;
		const order = options.ORDER;
		const id = options.COLUMNS[0].split("_")[0];

		// check the transformation part
		// if (transformations !== undefined && !validtransform(transformations, columns)){
		// 	return Promise.reject(new InsightError("invalid query: missing GROUP/APPLY in transformations"));
		// }

		// check if the requested dataset exists
		if (!this.datasetMap.get(id)) {
			return Promise.reject(new InsightError("error: requested dataset not exists"));
		}

		const datatofilter = this.datasetMap.get(id);
		const kind = this.datasetMap.get(id).kind; // will be used in C2

		// base case: if where is empty
		if (Object.keys(where).length === 0) {
			return emptywhereresulthelper(datatofilter, order, columns, transformations, id);
		}
		return this.processQuery(where, datatofilter).then((result) => {
			if (result.length > 5000) {
				return Promise.reject(new ResultTooLargeError("error: more than 5000 results"));
			}
			if (order !== undefined){
				helpersort(order, result);
				if (order.dir !== undefined && order.dir === "DOWN") { // if dir === UP, do nothing, as the default is ascending
					result.reverse();
				}
			}
			let final = getreqcols(columns, result);
			// if (transformations !== undefined){
			// 	final = transformation(transformations,columns,id,final);
			// }
			return Promise.resolve(final);
		}).catch((error) => {
			return Promise.reject(error);
		});
	}

	private processQuery(curquery: any, datatofilter: any): Promise<any> {
		// should only have one key/val each time
		if (Object.keys(curquery).length !== 1 || Object.values(curquery).length !== 1) {
			return Promise.reject(new InsightError("invalid query: no query key/val"));
		}
		const key: any = Object.keys(curquery)[0];
		const vals: any = Object.values(curquery);
		if (!COMPARATOR.includes(key)) {
			return Promise.reject(new InsightError("invalid query: invalid query key"));
		}
		switch (key) {
			case "AND":
			case "OR":
				return this.ANDORfunc(key, vals, datatofilter).then((result) => {
					return Promise.resolve(result);
				}).catch((error) => {
					return Promise.reject(new InsightError("invalid query: error in AND/OR recursion"));
				});
			case "NOT":
				return this.NOTfunc(vals, datatofilter).then((result) => {
					return Promise.resolve(result);
				}).catch((error) => {
					return Promise.reject(new InsightError("invalid query: error in NOT recursion"));
				});
			case "LT":
			case "GT":
			case "EQ":
			case "IS":
				if (!validWHERE(key, vals)) {
					return Promise.reject(new InsightError("invalid query: invalid where"));
				} else {
					return COMPfunc(key, vals, datatofilter).then((result) => {
						return Promise.resolve(result);
					}).catch((error) => {
						return Promise.reject(new InsightError("invalid query: error in LT/GT/EQ/IS"));
					});
				}
			default:
				return Promise.reject(new InsightError("invalid query: invalid query key"));
		}
	}

	private ANDORfunc(key: string, vals: any[], datatofilter: any[]): Promise<any[]> {
		if (vals[0].length <= 0) {
			return Promise.reject(new InsightError("invalid query: no query val"));
		}
		const allpromises: any[] = [];
		for (const item of vals[0]) {
			allpromises.push(this.processQuery(item, datatofilter));
		}
		let finalresult: any[] = [];

		return Promise.all(allpromises).then((result) => {
			let arr1 = result[0];
			let arr2: any = [];
			if (result.length > 1){
				arr2 = result[1];
				if (key === "AND") {
					finalresult = arr1.filter((item: any) => arr2.includes(item));
				} else if (key === "OR") {
					finalresult = Array.from(new Set([...arr1, ...arr2]));
				}
			} else { // if there is only one branch
				finalresult = arr1;
			}
			return Promise.resolve(finalresult);
		}).catch((error) => {
			return Promise.reject(new InsightError("invalid query: failed in all promises"));
		});
	}

	private NOTfunc(vals: any[], datatofilter: CourseDataset): Promise<any[]> {
		let finalresult: any[] = [];
		return this.processQuery(vals[0], datatofilter).then((results) => {
			finalresult = datatofilter.sections.filter((item: any) => !results.includes(item));
			return Promise.resolve(finalresult);
		}).catch((error) => {
			return Promise.reject(error);
		});
	}

}
