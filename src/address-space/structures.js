const {
  DataType,
  Variant,
  StatusCodes,
} = require("node-opcua");

function buildStructures(namespace, rootFolder) {
  const folder = namespace.addFolder(rootFolder, { browseName: "Structures" });

  const pointObj = namespace.addObject({
    organizedBy: folder,
    browseName: "TestPoint",
  });

  let pointX = 1.0, pointY = 2.0, pointZ = 3.0;
  addStructField(namespace, pointObj, "X", DataType.Double, () => pointX, (v) => { pointX = v; });
  addStructField(namespace, pointObj, "Y", DataType.Double, () => pointY, (v) => { pointY = v; });
  addStructField(namespace, pointObj, "Z", DataType.Double, () => pointZ, (v) => { pointZ = v; });

  const rangeObj = namespace.addObject({
    organizedBy: folder,
    browseName: "TestRange",
  });

  let rangeMin = 0.0, rangeMax = 100.0, rangeVal = 50.0;
  addStructField(namespace, rangeObj, "Min", DataType.Double, () => rangeMin, (v) => { rangeMin = v; });
  addStructField(namespace, rangeObj, "Max", DataType.Double, () => rangeMax, (v) => { rangeMax = v; });
  addStructField(namespace, rangeObj, "Value", DataType.Double, () => rangeVal, (v) => { rangeVal = v; });

  const personObj = namespace.addObject({
    organizedBy: folder,
    browseName: "TestPerson",
  });

  let personName = "John Doe", personAge = 30, personActive = true;
  addStructField(namespace, personObj, "Name", DataType.String, () => personName, (v) => { personName = v; });
  addStructField(namespace, personObj, "Age", DataType.UInt32, () => personAge, (v) => { personAge = v; });
  addStructField(namespace, personObj, "Active", DataType.Boolean, () => personActive, (v) => { personActive = v; });

  const nestedObj = namespace.addObject({
    organizedBy: folder,
    browseName: "TestNested",
  });

  let nestedLabel = "origin", nestedTimestamp = new Date();
  addStructField(namespace, nestedObj, "Label", DataType.String, () => nestedLabel, (v) => { nestedLabel = v; });
  addStructField(namespace, nestedObj, "Timestamp", DataType.DateTime, () => nestedTimestamp, (v) => { nestedTimestamp = v; });

  const nestedPoint = namespace.addObject({
    componentOf: nestedObj,
    browseName: "Point",
  });

  let npX = 0.0, npY = 0.0, npZ = 0.0;
  addStructField(namespace, nestedPoint, "X", DataType.Double, () => npX, (v) => { npX = v; });
  addStructField(namespace, nestedPoint, "Y", DataType.Double, () => npY, (v) => { npY = v; });
  addStructField(namespace, nestedPoint, "Z", DataType.Double, () => npZ, (v) => { npZ = v; });

  const collectionFolder = namespace.addFolder(folder, { browseName: "PointCollection" });
  for (let i = 0; i < 5; i++) {
    const obj = namespace.addObject({
      organizedBy: collectionFolder,
      browseName: `Point_${i}`,
    });
    let x = i * 10.0, y = i * 20.0, z = i * 30.0;
    addStructField(namespace, obj, "X", DataType.Double, () => x, (v) => { x = v; });
    addStructField(namespace, obj, "Y", DataType.Double, () => y, (v) => { y = v; });
    addStructField(namespace, obj, "Z", DataType.Double, () => z, (v) => { z = v; });
  }

  const deepFolder = namespace.addFolder(folder, { browseName: "DeepNesting" });
  let parent = deepFolder;
  for (let depth = 1; depth <= 10; depth++) {
    const child = namespace.addObject({
      organizedBy: parent,
      browseName: `Level_${depth}`,
    });
    addStructField(namespace, child, "Depth", DataType.UInt32, () => depth, () => {});
    addStructField(namespace, child, "Name", DataType.String, () => `Level ${depth}`, () => {});
    parent = child;
  }
}

function addStructField(namespace, parent, name, dataType, getter, setter) {
  namespace.addVariable({
    componentOf: parent,
    browseName: name,
    dataType: dataType,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get: () => new Variant({ dataType, value: getter() }),
      set: (variant) => {
        setter(variant.value);
        return StatusCodes.Good;
      },
    },
  });
}

module.exports = { buildStructures };
