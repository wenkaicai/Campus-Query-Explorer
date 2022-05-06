import {mfield, sfield} from "./Constants";
import CourseDataset from "./CourseDataset";
import {InsightError, ResultTooLargeError} from "./IInsightFacade";
import {helperstarfirst, helperstarlast, helperstartwosides, helpervalidIStarget} from "./Util";

export function queryWHEREOPTIONS(query: any): boolean {
	if (query === undefined) {
		return false;
	}
	if (query.TRANSFORMATIONS !== undefined) {
		return false;
	} // for now, skip transformation query
	let keys = Object.keys(query);
	return !(!keys.includes("WHERE") || !keys.includes("OPTIONS"));
}

export function validOPTIONS (option: any): boolean {
	let optionkeys = Object.keys(option);
	let columns = option.COLUMNS;
	let order = option.ORDER;
	let flag1 = false;
	let flag2 = false;
	let flag3 = true;
	// first to check if options have COLUMNS(mandate) and ORDER(optional)
	if (columns.length < 1) {
		return false;
	}

	// check valid order -> C2
	if ((order !== undefined && Object.keys(order).length === 2 && !(order.dir === "UP" || "DOWN"))){
		return false;
	}
	if (order !== undefined && Object.keys(order).includes("keys")) {
		for (let orderkey of order.keys){
			if (!columns.includes(orderkey)){
				flag3 = false;
			}
		}
	}

	if (optionkeys.length === 1 && optionkeys[0] === "COLUMNS") {
		flag1 = true;
	} else if (optionkeys.length === 2 && columns !== undefined && option.ORDER !== undefined ) {
		flag1 = true;
	}
	// then to check if COLUMN and ORDER have valid values
	if (order === undefined || validOPTIONValues(columns, order)) {
		flag2 = true;
	}
	return flag1 && flag2 && flag3;
}

export function validOPTIONValues(columns: any, order: any): boolean {
	let colkeys: string[] = columns;
	let flag1 = true;
	let flag2 = true;
	let id = colkeys[0].split("_")[0];
	// check if COLUMNS values are valid
	for (let colkey of colkeys) {
		let keyfield = colkey.split("_")[1];
		let keyid = colkey.split("_")[0];
		if (!(mfield.includes(keyfield) || sfield.includes(keyfield)) || keyid !== id) {
			flag1 = false;
		}
	}
	// check if order is valid
	if (typeof order !== "string" || !colkeys.includes(order) || order.split("_")[0] !== id) {
		flag2 = false;
	}
	return flag1 && flag2;
}

export function validWHERE(inputkey: any, basequery: any): boolean {
	let keyofvals: any = Object.keys(basequery[0])[0];
	let targetval: any = Object.values(basequery[0])[0];

	switch (inputkey) {
		case "LT":
		case "GT":
		case "EQ":
			if (typeof (targetval) !== "number") {
				return false;
			}
			break;
		case "IS":
			if (typeof (targetval) !== "string" ) {
				return false;
			}
			break;
	}
	return true;
}

export function getreqcols(cols: any[], datatofilter: any): any {
	let result = [];
	for (let item of datatofilter){
		result.push(Object.fromEntries(Object.entries(item).filter(([key, value]) => cols.includes(key))));
	}
	return [...result];
}

export function helpersort (order: any, result: any) {
	let neworder = order;
	if (Object.keys(order).length === 2){
		// TODO add the support for multiple sort keys
		neworder = order.dir[1];
	}
	switch (neworder) {
		case "courses_dept":
			result.sort((first: any, second: any) =>  first["courses_dept"] - second["courses_dept"]);
			break;
		case "courses_id":
			result.sort((first: any, second: any) => first["courses_id"] - second["courses_id"]);
			break;
		case "courses_avg":
			result.sort((first: any, second: any) => first["courses_avg"] - second["courses_avg"]);
			break;
		case "courses_instructor":
			result.sort((first: any, second: any) => first["courses_instructor"] - second["courses_instructor"]);
			break;
		case "courses_title":
			result.sort((first: any, second: any) => first["courses_title"] - second["courses_title"]);
			break;
		case "courses_pass":
			result.sort((first: any, second: any) => first["courses_pass"] - second["courses_pass"]);
			break;
		case "courses_fail":
			result.sort((first: any, second: any) => first["courses_fail"] - second["courses_fail"]);
			break;
		case "courses_audit":
			result.sort((first: any, second: any) => first["courses_audit"] - second["courses_audit"]);
			break;
		case "courses_uuid":
			result.sort((first: any, second: any) => first["courses_uuid"] - second["courses_uuid"]);
			break;
		case "courses_year":
			result.sort((first: any, second: any) => first["courses_year"] - second["courses_year"]);
			break;
	}
}

export function validtransform (transformations: any, columns: any): boolean {
	let keys = Object.keys(transformations);
	let group: any[] = transformations.GROUP;
	let apply: any[] = transformations.APPLY;

	let flag1 = false; // check if has GROUP and APPLY
	let flag2 = true; // check keys in GROUP
	let flag3 = true; // check APPLY

	if (keys.includes("GROUP") && keys.includes("APPLY") && keys.length === 2){
		if (group !== undefined && apply !== undefined){
			flag1 = true;
		}
	}

	let colingroupkey: any[] = [];
	for (let groupkey of transformations.GROUP) {
		if (!columns.includes(groupkey)) {
			flag2 = false;
		} else {
			colingroupkey.push(groupkey);
		}
	}

	let colinapplykey: any[] = [];

	return flag1 && flag2 && flag3;
}

// for no where C1
export function emptywhereresulthelper(result: any[], order: any, columns: any,
	transformations: any, id: any): Promise<any[]> {
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
}

export function  COMPfunc(key: string, vals: any[], datatofilter: CourseDataset): Promise<any[]> {
	// to-do, check the format
	let finalresult: any[] = [];
	return new Promise<any[]>((resolve,reject) => {
		const keyofvals: any = Object.keys(vals[0])[0];
		const targetval: any = Object.values(vals[0])[0];
		if (keyofvals.length > 0 && keyofvals.split("_")[0] !== datatofilter.id){
			return reject(new InsightError("invalid query key in IS"));
		}
		switch (key){
			case "LT":
				finalresult = datatofilter.sections.filter((item: any) =>
					item[keyofvals] < targetval);
				break;
			case "GT":
				finalresult = datatofilter.sections.filter((item: any) =>
					item[keyofvals] > targetval);
				break;
			case "EQ":
				finalresult = datatofilter.sections.filter((item: any) =>
					item[keyofvals] === targetval);
				break;
			case "IS":
				if (helpervalidIStarget(targetval)) { // valid format
					let newtarget = targetval.replaceAll("*", "");
					if (targetval === "**" || targetval === "*"){
						finalresult = datatofilter.sections;
					} else if (helperstarfirst(targetval)) {
						finalresult = datatofilter.sections.filter((item: any) =>
							item[keyofvals].endsWith(newtarget));
					} else if (helperstarlast(targetval)) {
						finalresult = datatofilter.sections.filter((item: any) =>
							item[keyofvals].startsWith(newtarget));
					}else if (helperstartwosides(targetval)) {
						finalresult = datatofilter.sections.filter((item: any) =>
							item[keyofvals].includes(newtarget));
					} else if (newtarget === targetval) { // general case: without wildcards
						finalresult = datatofilter.sections.filter((item: any) =>
							item[keyofvals] === targetval);
					}
				} else {
					return reject(new InsightError("invalid IS"));
				}
				break;
		}
		return resolve(finalresult);
	}).catch((error) => {
		return Promise.reject(new InsightError("invalid query: invalid MCOMP key/val"));
	});
}

