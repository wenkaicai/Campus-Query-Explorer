import JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {helperGetCourseSection} from "./Util";

export interface CourseSection {
	"courses_dept": string;
	"courses_id": string;
	"courses_avg": number;
	"courses_instructor": string;
	"courses_title": string;
	"courses_pass": number;
	"courses_fail": number;
	"courses_audit": number;
	"courses_uuid": string;
	"courses_year": number;
}

// represents a single dataset/zip file
export default class CourseDataset {
	public id: string;
	public kind: InsightDatasetKind;
	public sections: CourseSection[] = [];

	constructor(id: string, kind: InsightDatasetKind) {
		this.id = id;
		this.kind = kind;
	}

	public unzipFile (content: string): Promise<CourseSection[]> {
		return new Promise<CourseSection[]>((resolve, reject) => {
			const zip = require("jszip");
			const allSectionsPromises: Array<Promise<void>> = [];
			zip.loadAsync(content, {base64: true}).then((newzip: JSZip) => {
				newzip.folder("courses")?.forEach((relativePath: string, file: any) => {
					const sectionParsePromise = this.parseSection(file);
					allSectionsPromises.push(sectionParsePromise);
				});
				Promise.all(allSectionsPromises).then(() => {
					if (this.sections.length === 0) {
						reject(new InsightError("Empty CourseDataset"));
					} else {
						resolve(this.sections);
					}
				}).catch((error: any) => {
					reject(new InsightError("Error in resolving all the promises"));
				});
			}).catch((error: any) => {
				reject(new InsightError("Invalid Dataset_Other reasons"));
			});
		});
	}

	private parseSection(sectionJS: JSZip.JSZipObject): Promise<void> {
		return new Promise((resolve, reject) => {
			if (Object(sectionJS).name.split(".").pop() === ".html"){
				reject(new InsightError("Error: having html in courses dataset"));
			}
			sectionJS.async("string").then((sectionData) => {
				const newData = JSON.parse(sectionData);
				newData.result.forEach((section: any) => {
					const courseSection = helperGetCourseSection(section);
					this.sections.push(courseSection);
				});
				resolve();
			}).catch((error) => {
				reject(new InsightError("Invalid Section"));
			});
		});
	}
}
