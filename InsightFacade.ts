import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import {removeDataFromDisk, writeDataToDisk} from "./Util";
import Dataset from "./Dataset";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public insightdatasetMap = new Map();
	public datasetMap = new Map();

	constructor() {
		console.log("InsightFacadeImpl Initiated");
		// this.datasetMap = readDatafromDisk();
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

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// check id error
		if (!this.helperValidIdCheck(id) || this.datasetMap.has(id) || kind === InsightDatasetKind.Rooms) {
			return Promise.reject(new InsightError());
		}
		return new Promise<string[]>((resolve,reject) => {
			const dataset = new Dataset(id, kind);
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
					return reject(new InsightError());
				});
		});
	}

	public removeDataset(id: string): Promise<string> {
		if (!this.helperValidIdCheck(id)) {
			return Promise.reject(new InsightError());
		}
		if (!this.datasetMap.has(id)) {
			return Promise.reject(new NotFoundError());
		}
		return new Promise<string>((resolve,reject) => {
			this.datasetMap.delete(id);
			this.insightdatasetMap.delete(id);
			removeDataFromDisk(id);
			return resolve(id);
		}).catch((error) => {
			return Promise.reject(new InsightError());
		});
	}


	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.resolve([...this.insightdatasetMap.values()]);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise<InsightResult[]>(function (fulfill, reject) {
			// check format
			let Query: any;
			Query = query;
			if (Query === undefined || Query.OPTIONS === undefined) {
				// const result: InsightResult = {body:"EBNF format incorrect"};
				// return reject(result);
				return reject(new InsightError());
			}
			if (Object.keys(Query).length === 0 || Object.keys(Query.OPTIONS).length === 0) {
				// const result: InsightResult = {body:"EBNF format Incorrect"};
				// return reject(result);
				return reject(new InsightError());
			}
			const optionColumns = Query.OPTIONS.COLUMNS;
			const firstColumn = Query.OPTIONS.COLUMNS[0];
			if (optionColumns.length === 0 || firstColumn === undefined) {
				// const result: InsightResult = {body:"The columns is empty"};
				return reject(new NotFoundError());
			}
			const querySelf = Query.WHERE;
			if (querySelf !== undefined && Object.keys(querySelf).length !== 0) {
				const queryKey = Object.keys(querySelf)[0];
				const queryValue = Object.values(querySelf)[0];
				if (queryValue === undefined || Object.keys(queryKey).length === 0) {
					// const result: InsightResult = {body: "incorrect format"};
					// return reject(result);
					return reject(new InsightError());
				}
				if (Object.keys(queryKey).length > 5000) {
					return reject(new ResultTooLargeError());
				}
			}
			return fulfill([]);
		});
	}

	// An id is invalid if it contains an underscore, or is only whitespace characters.
	private helperValidIdCheck(id: string): boolean {
		if (id.trim() === "") {
			return false;
		}

		let i = id.length;
		while (i--) {
			if (id.charAt(i) === "_") {
				return false;
			}
		}

		return true;
	}
}
