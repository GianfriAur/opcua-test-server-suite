const {
  DataType,
  Variant,
  StatusCodes,
  VariantArrayType,
} = require("node-opcua");

function buildMethods(namespace, rootFolder) {
  const methodsFolder = namespace.addFolder(rootFolder, { browseName: "Methods" });

  const addMethod = namespace.addMethod(methodsFolder, {
    browseName: "Add",
    inputArguments: [
      { name: "a", dataType: DataType.Double, description: { text: "First operand" } },
      { name: "b", dataType: DataType.Double, description: { text: "Second operand" } },
    ],
    outputArguments: [
      { name: "result", dataType: DataType.Double, description: { text: "Sum result" } },
    ],
  });
  addMethod.bindMethod((inputArguments, context, callback) => {
    const a = inputArguments[0].value;
    const b = inputArguments[1].value;
    callback(null, {
      statusCode: StatusCodes.Good,
      outputArguments: [{ dataType: DataType.Double, value: a + b }],
    });
  });

  const multiplyMethod = namespace.addMethod(methodsFolder, {
    browseName: "Multiply",
    inputArguments: [
      { name: "a", dataType: DataType.Double, description: { text: "First operand" } },
      { name: "b", dataType: DataType.Double, description: { text: "Second operand" } },
    ],
    outputArguments: [
      { name: "result", dataType: DataType.Double, description: { text: "Product result" } },
    ],
  });
  multiplyMethod.bindMethod((inputArguments, context, callback) => {
    const a = inputArguments[0].value;
    const b = inputArguments[1].value;
    callback(null, {
      statusCode: StatusCodes.Good,
      outputArguments: [{ dataType: DataType.Double, value: a * b }],
    });
  });

  const concatMethod = namespace.addMethod(methodsFolder, {
    browseName: "Concatenate",
    inputArguments: [
      { name: "a", dataType: DataType.String, description: { text: "First string" } },
      { name: "b", dataType: DataType.String, description: { text: "Second string" } },
    ],
    outputArguments: [
      { name: "result", dataType: DataType.String, description: { text: "Concatenated string" } },
    ],
  });
  concatMethod.bindMethod((inputArguments, context, callback) => {
    callback(null, {
      statusCode: StatusCodes.Good,
      outputArguments: [
        { dataType: DataType.String, value: inputArguments[0].value + inputArguments[1].value },
      ],
    });
  });

  const reverseMethod = namespace.addMethod(methodsFolder, {
    browseName: "Reverse",
    inputArguments: [
      { name: "input", dataType: DataType.String, description: { text: "Input string" } },
    ],
    outputArguments: [
      { name: "result", dataType: DataType.String, description: { text: "Reversed string" } },
    ],
  });
  reverseMethod.bindMethod((inputArguments, context, callback) => {
    callback(null, {
      statusCode: StatusCodes.Good,
      outputArguments: [
        { dataType: DataType.String, value: inputArguments[0].value.split("").reverse().join("") },
      ],
    });
  });

  const getTimeMethod = namespace.addMethod(methodsFolder, {
    browseName: "GetServerTime",
    inputArguments: [],
    outputArguments: [
      { name: "time", dataType: DataType.DateTime, description: { text: "Current server time" } },
    ],
  });
  getTimeMethod.bindMethod((inputArguments, context, callback) => {
    callback(null, {
      statusCode: StatusCodes.Good,
      outputArguments: [{ dataType: DataType.DateTime, value: new Date() }],
    });
  });

  const echoMethod = namespace.addMethod(methodsFolder, {
    browseName: "Echo",
    inputArguments: [
      { name: "input", dataType: DataType.Variant, description: { text: "Any value to echo back" } },
    ],
    outputArguments: [
      { name: "output", dataType: DataType.Variant, description: { text: "Echoed value" } },
    ],
  });
  echoMethod.bindMethod((inputArguments, context, callback) => {
    callback(null, {
      statusCode: StatusCodes.Good,
      outputArguments: [inputArguments[0]],
    });
  });

  const genEventMethod = namespace.addMethod(methodsFolder, {
    browseName: "GenerateEvent",
    inputArguments: [
      { name: "message", dataType: DataType.String, description: { text: "Event message" } },
      { name: "severity", dataType: DataType.UInt16, description: { text: "Event severity (0-1000)" } },
    ],
    outputArguments: [],
  });
  genEventMethod.bindMethod((inputArguments, context, callback) => {
    const message = inputArguments[0].value;
    const severity = inputArguments[1].value;
    const addressSpace = namespace.addressSpace;
    const server = addressSpace.rootFolder.objects.server;

    const eventType = addressSpace.findEventType("BaseEventType");
    if (eventType) {
      server.raiseEvent(eventType, {
        message: { dataType: DataType.LocalizedText, value: { text: message } },
        severity: { dataType: DataType.UInt16, value: severity },
        sourceNode: { dataType: DataType.NodeId, value: genEventMethod.nodeId },
        sourceName: { dataType: DataType.String, value: "GenerateEvent Method" },
      });
    }
    callback(null, { statusCode: StatusCodes.Good, outputArguments: [] });
  });

  const longRunningMethod = namespace.addMethod(methodsFolder, {
    browseName: "LongRunning",
    inputArguments: [
      { name: "durationMs", dataType: DataType.UInt32, description: { text: "Duration in milliseconds" } },
    ],
    outputArguments: [
      { name: "completed", dataType: DataType.Boolean, description: { text: "Whether it completed" } },
    ],
  });
  longRunningMethod.bindMethod((inputArguments, context, callback) => {
    const duration = Math.min(inputArguments[0].value, 30000);
    setTimeout(() => {
      callback(null, {
        statusCode: StatusCodes.Good,
        outputArguments: [{ dataType: DataType.Boolean, value: true }],
      });
    }, duration);
  });

  const failingMethod = namespace.addMethod(methodsFolder, {
    browseName: "Failing",
    inputArguments: [],
    outputArguments: [],
  });
  failingMethod.bindMethod((inputArguments, context, callback) => {
    callback(null, { statusCode: StatusCodes.BadInternalError, outputArguments: [] });
  });

  const arraySumMethod = namespace.addMethod(methodsFolder, {
    browseName: "ArraySum",
    inputArguments: [
      {
        name: "values",
        dataType: DataType.Double,
        valueRank: 1,
        description: { text: "Array of doubles to sum" },
      },
    ],
    outputArguments: [
      { name: "sum", dataType: DataType.Double, description: { text: "Sum of all values" } },
    ],
  });
  arraySumMethod.bindMethod((inputArguments, context, callback) => {
    const values = inputArguments[0].value;
    const sum = Array.from(values).reduce((acc, v) => acc + v, 0);
    callback(null, {
      statusCode: StatusCodes.Good,
      outputArguments: [{ dataType: DataType.Double, value: sum }],
    });
  });

  const matrixTransposeMethod = namespace.addMethod(methodsFolder, {
    browseName: "MatrixTranspose",
    inputArguments: [
      { name: "matrix", dataType: DataType.Double, valueRank: 1, description: { text: "Flat matrix data" } },
      { name: "rows", dataType: DataType.UInt32, description: { text: "Number of rows" } },
      { name: "cols", dataType: DataType.UInt32, description: { text: "Number of columns" } },
    ],
    outputArguments: [
      { name: "result", dataType: DataType.Double, valueRank: 1, description: { text: "Transposed matrix" } },
    ],
  });
  matrixTransposeMethod.bindMethod((inputArguments, context, callback) => {
    const matrix = Array.from(inputArguments[0].value);
    const rows = inputArguments[1].value;
    const cols = inputArguments[2].value;
    if (matrix.length !== rows * cols) {
      callback(null, { statusCode: StatusCodes.BadInvalidArgument, outputArguments: [] });
      return;
    }
    const result = new Float64Array(rows * cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result[c * rows + r] = matrix[r * cols + c];
      }
    }
    callback(null, {
      statusCode: StatusCodes.Good,
      outputArguments: [
        { dataType: DataType.Double, arrayType: VariantArrayType.Array, value: result },
      ],
    });
  });

  const multiOutputMethod = namespace.addMethod(methodsFolder, {
    browseName: "MultiOutput",
    inputArguments: [],
    outputArguments: [
      { name: "intValue", dataType: DataType.Int32, description: { text: "An integer" } },
      { name: "stringValue", dataType: DataType.String, description: { text: "A string" } },
      { name: "boolValue", dataType: DataType.Boolean, description: { text: "A boolean" } },
    ],
  });
  multiOutputMethod.bindMethod((inputArguments, context, callback) => {
    callback(null, {
      statusCode: StatusCodes.Good,
      outputArguments: [
        { dataType: DataType.Int32, value: 42 },
        { dataType: DataType.String, value: "hello" },
        { dataType: DataType.Boolean, value: true },
      ],
    });
  });
}

module.exports = { buildMethods };
