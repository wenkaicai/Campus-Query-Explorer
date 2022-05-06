export default class Room {
	public rooms_fullname: string;
	public rooms_shortname: string;
	public rooms_number: string;
	public rooms_name: string;
	public rooms_address: string;
	public rooms_lat: number;
	public rooms_lon: number;
	public rooms_seats: number;
	public rooms_type: string;
	public rooms_furniture: string;
	public rooms_href: string;

	constructor(
		fullname: string,
		shortname: string,
		number: string,
		name: string,
		address: string,
		lat: number,
		lon: number,
		seats: number,
		type: string,
		furniture: string,
		href: string) {
		this.rooms_fullname = fullname;
		this.rooms_shortname = shortname;
		this.rooms_number = number;
		this.rooms_name = name;
		this.rooms_address = address;
		this.rooms_lat = lat;
		this.rooms_lon = lon;
		this.rooms_seats = seats;
		this.rooms_type = type;
		this.rooms_furniture = furniture;
		this.rooms_href = href;
	}
}
