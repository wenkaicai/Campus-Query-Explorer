// import {
// 	InsightDataset,
// 	InsightDatasetKind,
// 	InsightError,
// 	InsightResult, NotFoundError,
// 	ResultTooLargeError,
// } from "../../src/controller/IInsightFacade";
// import InsightFacade from "../../src/controller/InsightFacade";
// import chaiAsPromised from "chai-as-promised";
// import * as fs from "fs-extra";
// import {folderTest} from "@ubccpsc310/folder-test";
// import {expect, use} from "chai";
//
// use(chaiAsPromised);
//
// describe("InsightFacade", function () {
// 	let insightFacade: InsightFacade;
//
// 	const persistDir = "./data";
// 	const datasetContents = new Map<string, string>();
//
// 	// Reference any datasets you've added to test/resources/archives here and they will
// 	// automatically be loaded in the 'before' hook.
// 	const datasetsToLoad: {[key: string]: string} = {
// 		courses: "./test/resources/archives/courses.zip",
// 		rooms: "./test/resources/archives/rooms.zip",
// 		courseInvalid: "./test/resources/archives/courseInvalid.zip",
// 	};
//
// 	before(function () {
// 		// This section runs once and loads all datasets specified in the datasetsToLoad object
// 		for (const key of Object.keys(datasetsToLoad)) {
// 			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
// 			datasetContents.set(key, content);
// 		}
// 		// Just in case there is anything hanging around from a previous run
// 		// fs.removeSync(persistDir);
// 	});
//
// 	describe("Add/Remove/List Dataset", function () {
// 		before(function () {
// 			console.info(`Before: ${this.test?.parent?.title}`);
// 		});
//
// 		beforeEach(function () {
// 			// This section resets the insightFacade instance
// 			// This runs before each test
// 			console.info(`BeforeTest: ${this.currentTest?.title}`);
// 			insightFacade = new InsightFacade();
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 		});
//
// 		afterEach(function () {
// 			// This section resets the data directory (removing any cached data)
// 			// This runs after each test, which should make each test independent from the previous one
// 			console.info(`AfterTest: ${this.currentTest?.title}`);
// 			// fs.removeSync(persistDir);
// 		});
//
// 		it("should list no datasets", function () {
// 			const futureInsightDatasets = insightFacade.listDatasets();
// 			return expect(futureInsightDatasets).to.eventually.deep.equal([]);
// 		});
//
// 		it("should list one dataset", async function () {
// 			const content: string = datasetContents.get("courses") ?? "";
// 			await insightFacade.addDataset("courses", content, InsightDatasetKind.Courses);
// 			const insightDatasets = await insightFacade.listDatasets();
// 			expect(insightDatasets).to.deep.equal([{
// 				id: "courses",
// 				kind: InsightDatasetKind.Courses,
// 				numRows: 64612,
// 			}]);
// 		});
//
// 		it("should list multiple datasets", function () {
// 			const content: string = datasetContents.get("courses") ?? "";
// 			return insightFacade.addDataset("courses", content, InsightDatasetKind.Courses)
// 				.then(() => {
// 					return insightFacade.addDataset("courses-2", content, InsightDatasetKind.Courses);
// 				})
// 				.then(() => {
// 					return insightFacade.listDatasets();
// 				})
// 				.then((insightDatasets) => {
// 					expect(insightDatasets).to.be.an.instanceof(Array);
// 					expect(insightDatasets).to.have.length(2);
// 					const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses");
// 					expect(insightDatasetCourses).to.exist;
// 					expect(insightDatasetCourses).to.deep.equal({
// 						id: "courses",
// 						kind: InsightDatasetKind.Courses,
// 						numRows: 64612,
// 					});
// 				});
// 		});
//
// 		// This is a unit test. You should create more like this!
// 		it("Should add a valid dataset", function () {
// 			const id: string = "courses";
// 			const content: string = datasetContents.get("courses") ?? "";
// 			const expected: string[] = [id];
// 			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).then((result: string[]) => {
// 				expect(result).to.deep.equal(expected);
// 			});
// 		});
//
// 		it("should add multiple courses datasets", function () {
// 			const content: string = datasetContents.get("courses") ?? "";
// 			return insightFacade.addDataset("courses", content, InsightDatasetKind.Courses)
// 				.then(() => {
// 					return insightFacade.addDataset("courses-2", content, InsightDatasetKind.Courses);
// 				})
// 				.then(() => {
// 					return insightFacade.listDatasets();
// 				})
// 				.then((insightDatasets) => {
// 					expect(insightDatasets).to.be.an.instanceof(Array);
// 					expect(insightDatasets).to.have.length(2);
// 					const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses");
// 					expect(insightDatasetCourses).to.exist;
// 					expect(insightDatasetCourses).to.deep.equal({
// 						id: "courses",
// 						kind: InsightDatasetKind.Courses,
// 						numRows: 64612,
// 					});
// 				});
// 		});
//
// 		it("fail to add due to wrong type", async function(){
// 			try {
// 				const content: string = datasetContents.get("rooms") ?? "";
// 				await insightFacade.addDataset("1", content, InsightDatasetKind.Courses);
// 				expect.fail();
// 			} catch (err) {
// 				expect(err).to.be.instanceOf(InsightError);
// 			}
// 		});
//
// 		it("fail to add due to whitespace id name", async function(){
// 			try {
// 				const content: string = datasetContents.get("courses") ?? "";
// 				await insightFacade.addDataset(" ", content, InsightDatasetKind.Courses);
// 				expect.fail();
// 			} catch (err) {
// 				expect(err).to.be.instanceOf(InsightError);
// 			}
// 		});
//
// 		it("fail to add due to underscore id name", async function(){
// 			try {
// 				const content: string = datasetContents.get("courses") ?? "";
// 				await insightFacade.addDataset("courses_", content, InsightDatasetKind.Courses);
// 				expect.fail();
// 			} catch (err) {
// 				expect(err).to.be.instanceOf(InsightError);
// 			}
// 		});
//
// 		it("fail to add due to wrong element Type", async function () {
// 			try {
// 				const content: string = datasetContents.get("courses") ?? "";
// 				await insightFacade.addDataset("courses", content, InsightDatasetKind.Rooms);
// 				expect.fail();
// 			} catch (err) {
// 				expect(err).to.be.instanceOf(InsightError);
// 			}
// 		});
//
// 		it("fail to add due to invalid content", async function(){
// 			try {
// 				await insightFacade.addDataset("courses", "Invalid", InsightDatasetKind.Courses);
// 				expect.fail();
// 			} catch (err) {
// 				expect(err).to.be.instanceof(InsightError);
// 			}
// 		});
//
// 		it("fail to add same Id", async function () {
// 			try {
// 				const content: string = datasetContents.get("courses") ?? "";
// 				await insightFacade.addDataset("courses", content, InsightDatasetKind.Courses);
// 				await insightFacade.addDataset("courses", content, InsightDatasetKind.Courses);
// 				expect.fail();
// 			} catch (err) {
// 				expect(err).to.be.instanceOf(InsightError);
// 			}
// 		});
//
// 		it("should remove no datasets due to blank id", async function () {
// 			try {
// 				const content: string = datasetContents.get("courses") ?? "";
// 				await insightFacade.addDataset("courses", content, InsightDatasetKind.Courses);
// 				await insightFacade.removeDataset(" ");
// 				expect.fail();
// 			} catch (err) {
// 				expect(err).to.be.instanceOf(InsightError);
// 			}
// 		});
//
// 		it("should remove no datasets due to underscore id",async function () {
// 			try {
// 				const content: string = datasetContents.get("courses") ?? "";
// 				await insightFacade.addDataset("courses", content, InsightDatasetKind.Courses);
// 				await insightFacade.removeDataset("_courses_");
// 				expect.fail();
// 			} catch (err) {
// 				expect(err).to.be.instanceOf(InsightError);
// 			}
// 		});
//
// 		it("fail remove due to remove wrong file", function () {
// 			const content: string = datasetContents.get("courses") ?? "";
// 			const insightDatasets = insightFacade.addDataset("courses", content, InsightDatasetKind.Courses)
// 				.then(()=> {
// 					return insightFacade.removeDataset("courseInvalid");
// 				});
// 			return expect(insightDatasets).eventually.to.be.rejectedWith(NotFoundError);
// 		});
//
// 		it("fail remove due to double remove same file", function () {
// 			const content: string = datasetContents.get("courses") ?? "";
// 			const insightDatasets = insightFacade.addDataset("courses", content, InsightDatasetKind.Courses)
// 				.then(()=> {
// 					return insightFacade.removeDataset("courses");
// 				})
// 				.then(()=> {
// 					return insightFacade.removeDataset("courses");
// 				});
// 			return expect(insightDatasets).eventually.to.be.rejectedWith(NotFoundError);
// 		});
//
// 		it("fail to remove due to haven't add", async function () {
// 			try {
// 				const insightDatasets = await insightFacade.listDatasets();
// 				expect(insightDatasets).to.deep.equal([]);
// 				await insightFacade.removeDataset("courses");
// 				expect.fail();
// 			} catch (err) {
// 				expect(err).to.be.instanceOf(NotFoundError);
// 			}
// 		});
//
// 		it("should remove course dataset", async function () {
// 			const content: string = datasetContents.get("courses") ?? "";
// 			await insightFacade.addDataset("courses", content, InsightDatasetKind.Courses);
// 			await insightFacade.removeDataset("courses");
// 			const insightDatasets = await insightFacade.listDatasets();
// 			expect(insightDatasets).to.deep.equal([]);
// 		});
//
// 		it("should remove multiple course datasets", function () {
// 			const expected: InsightDataset[] = [];
// 			const content: string = datasetContents.get("courses") ?? "";
// 			return insightFacade.addDataset("courses", content, InsightDatasetKind.Courses)
// 				.then(() => {
// 					return insightFacade.addDataset("courses-2", content, InsightDatasetKind.Courses);
// 				})
// 				.then(() => {
// 					return insightFacade.addDataset("courses-3", content, InsightDatasetKind.Courses);
// 				})
// 				.then(() => {
// 					return insightFacade.removeDataset("courses-2");
// 				})
// 				.then(() => {
// 					return insightFacade.removeDataset("courses-3");
// 				})
// 				.then(() => {
// 					return insightFacade.listDatasets();
// 				})
// 				.then((insightDatasets) => {
// 					expect(insightDatasets).to.be.an.instanceof(Array);
// 					expect(insightDatasets).to.have.length(1);
// 					const insightDatasetCourses = insightDatasets.find((dataset) => dataset.id === "courses");
// 					expect(insightDatasetCourses).to.exist;
// 					expect(insightDatasetCourses).to.deep.equal({
// 						id: "courses",
// 						kind: InsightDatasetKind.Courses,
// 						numRows: 64612,
// 					});
// 				});
// 		});
// 	});
//
// 	/*
// 	 * This test suite dynamically generates tests from the JSON files in test/queries.
// 	 * You should not need to modify it; instead, add additional files to the queries directory.
// 	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
// 	 */
// 	describe("PerformQuery", () => {
// 		before(function () {
// 			console.info(`Before: ${this.test?.parent?.title}`);
//
// 			insightFacade = new InsightFacade();
//
// 			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
// 			// Will *fail* if there is a problem reading ANY dataset.
// 			const loadDatasetPromises = [
// 				insightFacade.addDataset("courses", datasetContents.get("courses") ?? "", InsightDatasetKind.Courses),
// 			];
//
// 			return Promise.all(loadDatasetPromises);
// 		});
//
// 		after(function () {
// 			console.info(`After: ${this.test?.parent?.title}`);
// 			// fs.removeSync(persistDir);
// 		});
//
// 		type PQErrorKind = "ResultTooLargeError" | "InsightError";
//
// 		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
// 			"Dynamic InsightFacade PerformQuery tests",
// 			(input) => insightFacade.performQuery(input),
// 			"./test/resources/queries/YTtest",
// 			{
// 				errorValidator: (error): error is PQErrorKind =>
// 					error === "ResultTooLargeError" || error === "InsightError",
// 				assertOnError(actual, expected) {
// 					if (expected === "ResultTooLargeError") {
// 						expect(actual).to.be.instanceof(ResultTooLargeError);
// 					} else {
// 						expect(actual).to.be.instanceof(InsightError);
// 					}
// 				},
// 			}
// 		);
// 	});
// });
