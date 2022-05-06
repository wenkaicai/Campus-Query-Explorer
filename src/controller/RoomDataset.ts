import {InsightDatasetKind} from "./IInsightFacade";

export default class RoomDataset {
	public id: string;
	public length: number;
	public kind: InsightDatasetKind;
	public buildingRooms: any;

	constructor(
		id: string,
		kind: InsightDatasetKind,
		length: number,
		buildingRooms: Map<string, any[]>) {
		this.id = id;
		this.kind = kind;
		this.length = length;
		this.buildingRooms = buildingRooms;
	}
}
