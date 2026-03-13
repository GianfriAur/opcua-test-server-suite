function buildViews(namespace, rootFolder) {
  const addressSpace = namespace.addressSpace;

  const dynamicFolder = rootFolder.getFolderElementByName("Dynamic");
  const methodsFolder = rootFolder.getFolderElementByName("Methods");
  const historicalFolder = rootFolder.getFolderElementByName("Historical");
  const dataTypesFolder = rootFolder.getFolderElementByName("DataTypes");
  const structuresFolder = rootFolder.getFolderElementByName("Structures");
  const eventsFolder = rootFolder.getFolderElementByName("Events");
  const alarmsFolder = rootFolder.getFolderElementByName("Alarms");

  const operatorView = namespace.addView({
    organizedBy: addressSpace.rootFolder.views,
    browseName: "OperatorView",
  });
  if (dynamicFolder) {
    operatorView.addReference({
      referenceType: "Organizes",
      nodeId: dynamicFolder.nodeId,
    });
  }
  if (methodsFolder) {
    operatorView.addReference({
      referenceType: "Organizes",
      nodeId: methodsFolder.nodeId,
    });
  }
  if (alarmsFolder) {
    operatorView.addReference({
      referenceType: "Organizes",
      nodeId: alarmsFolder.nodeId,
    });
  }

  const engineeringView = namespace.addView({
    organizedBy: addressSpace.rootFolder.views,
    browseName: "EngineeringView",
  });
  engineeringView.addReference({
    referenceType: "Organizes",
    nodeId: rootFolder.nodeId,
  });

  const historicalView = namespace.addView({
    organizedBy: addressSpace.rootFolder.views,
    browseName: "HistoricalView",
  });
  if (historicalFolder) {
    historicalView.addReference({
      referenceType: "Organizes",
      nodeId: historicalFolder.nodeId,
    });
  }

  const dataView = namespace.addView({
    organizedBy: addressSpace.rootFolder.views,
    browseName: "DataView",
  });
  if (dataTypesFolder) {
    dataView.addReference({
      referenceType: "Organizes",
      nodeId: dataTypesFolder.nodeId,
    });
  }
  if (structuresFolder) {
    dataView.addReference({
      referenceType: "Organizes",
      nodeId: structuresFolder.nodeId,
    });
  }
}

module.exports = { buildViews };
