const {
  DataType,
  DataValue,
  Variant,
  StatusCodes,
} = require("node-opcua");

const timers = [];

function buildDynamic(namespace, rootFolder) {
  const folder = namespace.addFolder(rootFolder, { browseName: "Dynamic" });

  const startTime = Date.now();

  let counterValue = 0;
  const counter = namespace.addVariable({
    componentOf: folder,
    browseName: "Counter",
    dataType: DataType.UInt32,
    value: { get: () => new Variant({ dataType: DataType.UInt32, value: counterValue }) },
  });
  timers.push(setInterval(() => { counterValue++; }, 1000));

  let fastCounterValue = 0;
  namespace.addVariable({
    componentOf: folder,
    browseName: "FastCounter",
    dataType: DataType.UInt32,
    value: { get: () => new Variant({ dataType: DataType.UInt32, value: fastCounterValue }) },
  });
  timers.push(setInterval(() => { fastCounterValue++; }, 100));

  let slowCounterValue = 0;
  namespace.addVariable({
    componentOf: folder,
    browseName: "SlowCounter",
    dataType: DataType.UInt32,
    value: { get: () => new Variant({ dataType: DataType.UInt32, value: slowCounterValue }) },
  });
  timers.push(setInterval(() => { slowCounterValue++; }, 10000));

  let randomValue = Math.random();
  namespace.addVariable({
    componentOf: folder,
    browseName: "Random",
    dataType: DataType.Double,
    value: { get: () => new Variant({ dataType: DataType.Double, value: randomValue }) },
  });
  timers.push(setInterval(() => { randomValue = Math.random(); }, 500));

  let randomIntValue = 0;
  namespace.addVariable({
    componentOf: folder,
    browseName: "RandomInt",
    dataType: DataType.Int32,
    value: { get: () => new Variant({ dataType: DataType.Int32, value: randomIntValue }) },
  });
  timers.push(setInterval(() => {
    randomIntValue = Math.floor(Math.random() * 2001) - 1000;
  }, 1000));

  namespace.addVariable({
    componentOf: folder,
    browseName: "SineWave",
    dataType: DataType.Double,
    value: {
      get: () => {
        const elapsed = (Date.now() - startTime) / 1000;
        return new Variant({ dataType: DataType.Double, value: Math.sin(2 * Math.PI * elapsed / 10) });
      },
    },
  });

  namespace.addVariable({
    componentOf: folder,
    browseName: "SawTooth",
    dataType: DataType.Double,
    value: {
      get: () => {
        const elapsed = (Date.now() - startTime) / 1000;
        return new Variant({ dataType: DataType.Double, value: (elapsed % 5) / 5 });
      },
    },
  });

  namespace.addVariable({
    componentOf: folder,
    browseName: "Square",
    dataType: DataType.Boolean,
    value: {
      get: () => {
        const elapsed = (Date.now() - startTime) / 1000;
        return new Variant({ dataType: DataType.Boolean, value: (elapsed % 2) < 1 });
      },
    },
  });

  namespace.addVariable({
    componentOf: folder,
    browseName: "Timestamp",
    dataType: DataType.DateTime,
    value: {
      get: () => new Variant({ dataType: DataType.DateTime, value: new Date() }),
    },
  });

  let randomStringValue = "initial";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  namespace.addVariable({
    componentOf: folder,
    browseName: "RandomString",
    dataType: DataType.String,
    value: { get: () => new Variant({ dataType: DataType.String, value: randomStringValue }) },
  });
  timers.push(setInterval(() => {
    const len = 8 + Math.floor(Math.random() * 16);
    randomStringValue = "";
    for (let i = 0; i < len; i++) {
      randomStringValue += chars[Math.floor(Math.random() * chars.length)];
    }
  }, 2000));

  const statusCycle = [StatusCodes.Good, StatusCodes.BadCommunicationError, StatusCodes.UncertainLastUsableValue];
  let statusIdx = 0;
  namespace.addVariable({
    componentOf: folder,
    browseName: "StatusVariable",
    dataType: DataType.StatusCode,
    value: {
      get: () => new Variant({ dataType: DataType.StatusCode, value: statusCycle[statusIdx] }),
    },
  });
  timers.push(setInterval(() => {
    statusIdx = (statusIdx + 1) % statusCycle.length;
  }, 3000));

  let nullableHasValue = true;
  let nullableValue = 42.0;
  namespace.addVariable({
    componentOf: folder,
    browseName: "NullableDouble",
    dataType: DataType.Double,
    value: {
      timestamped_get: () => {
        if (nullableHasValue) {
          return new DataValue({
            value: new Variant({ dataType: DataType.Double, value: nullableValue }),
            statusCode: StatusCodes.Good,
            sourceTimestamp: new Date(),
          });
        }
        return new DataValue({
          value: new Variant({ dataType: DataType.Double, value: 0 }),
          statusCode: StatusCodes.BadNoData,
          sourceTimestamp: new Date(),
        });
      },
    },
  });
  timers.push(setInterval(() => {
    nullableHasValue = !nullableHasValue;
    if (nullableHasValue) nullableValue = Math.random() * 100;
  }, 4000));

  namespace.addVariable({
    componentOf: folder,
    browseName: "TriangleWave",
    dataType: DataType.Double,
    value: {
      get: () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const period = 8;
        const t = (elapsed % period) / period;
        const val = t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
        return new Variant({ dataType: DataType.Double, value: val });
      },
    },
  });
}

function stopDynamic() {
  for (const t of timers) clearInterval(t);
  timers.length = 0;
}

module.exports = { buildDynamic, stopDynamic };
