const {
  OPCUAServer,
  SecurityPolicy,
  MessageSecurityMode,
  OPCUACertificateManager,
  ServerState,
  nodesets,
} = require("node-opcua");
const path = require("path");
const fs = require("fs");

const config = require("./config");
const { createUserManager } = require("./user-manager");
const { constructAddressSpace } = require("./address-space");
const { stopDynamic } = require("./address-space/dynamic");
const { stopEvents } = require("./address-space/events-alarms");
const { stopHistorical } = require("./address-space/historical");

const securityPolicyMap = {
  None: SecurityPolicy.None,
  Basic128Rsa15: SecurityPolicy.Basic128Rsa15,
  Basic256: SecurityPolicy.Basic256,
  Basic256Sha256: SecurityPolicy.Basic256Sha256,
  Aes128_Sha256_RsaOaep: SecurityPolicy.Aes128_Sha256_RsaOaep,
  Aes256_Sha256_RsaPss: SecurityPolicy.Aes256_Sha256_RsaPss,
};

const securityModeMap = {
  None: MessageSecurityMode.None,
  Sign: MessageSecurityMode.Sign,
  SignAndEncrypt: MessageSecurityMode.SignAndEncrypt,
};

async function main() {
  console.log("=".repeat(60));
  console.log("OPC UA Test Server Starting");
  console.log("=".repeat(60));
  console.log(`Port: ${config.port}`);
  console.log(`Server Name: ${config.serverName}`);
  console.log(`Security Policies: ${config.securityPolicies.join(", ")}`);
  console.log(`Security Modes: ${config.securityModes.join(", ")}`);
  console.log(`Allow Anonymous: ${config.allowAnonymous}`);
  console.log(`Auth Users: ${config.authUsers}`);
  console.log(`Auth Certificate: ${config.authCertificate}`);
  console.log(`Auto Accept Certs: ${config.autoAcceptCerts}`);
  console.log("=".repeat(60));

  const securityPolicies = config.securityPolicies.map((p) => {
    const policy = securityPolicyMap[p];
    if (!policy) {
      console.warn(`[Config] Unknown security policy: ${p}, using None`);
      return SecurityPolicy.None;
    }
    return policy;
  });

  const securityModes = config.securityModes.map((m) => {
    const mode = securityModeMap[m];
    if (!mode) {
      console.warn(`[Config] Unknown security mode: ${m}, using None`);
      return MessageSecurityMode.None;
    }
    return mode;
  });

  const needsCerts =
    securityPolicies.some((p) => p !== SecurityPolicy.None) ||
    securityModes.some((m) => m !== MessageSecurityMode.None);

  const serverOptions = {
    port: config.port,
    hostname: config.hostname,
    resourcePath: config.resourcePath,

    buildInfo: {
      productName: config.serverName,
      buildNumber: "1.0.0",
      buildDate: new Date(),
      manufacturerName: "OPC UA Test Server",
      productUri: "urn:opcua:test-server",
      softwareVersion: "1.0.0",
    },

    serverInfo: {
      applicationUri: `urn:opcua:test-server:${config.serverName}`,
      productUri: "urn:opcua:test-server",
      applicationName: { text: config.serverName, locale: "en" },
    },

    securityPolicies,
    securityModes,
    allowAnonymous: config.allowAnonymous,

    maxAllowedSessionNumber: config.maxSessions,
    maxConnectionsPerEndpoint: config.maxSessions,

    nodeset_filename: [
      nodesets.standard,
      nodesets.di,
    ],
  };

  if (needsCerts && fs.existsSync(config.certificateFile) && fs.existsSync(config.privateKeyFile)) {
    console.log("[Certs] Loading server certificate...");
    serverOptions.certificateFile = config.certificateFile;
    serverOptions.privateKeyFile = config.privateKeyFile;

    const pkiRoot = path.join(process.env.OPCUA_ROOT || path.resolve(__dirname, ".."), "pki");
    fs.mkdirSync(pkiRoot, { recursive: true });

    const certificateManager = new OPCUACertificateManager({
      automaticallyAcceptUnknownCertificate: config.autoAcceptCerts,
      rootFolder: pkiRoot,
    });
    await certificateManager.initialize();

    const pkiTrustedDir = path.join(pkiRoot, "trusted", "certs");
    if (fs.existsSync(config.trustedCertsDir)) {
      const files = fs.readdirSync(config.trustedCertsDir);
      for (const f of files) {
        if (f.endsWith(".pem") || f.endsWith(".der")) {
          const src = path.join(config.trustedCertsDir, f);
          const dst = path.join(pkiTrustedDir, f);
          try { fs.copyFileSync(src, dst); } catch (e) { }
        }
      }
    }

    const pkiIssuersDir = path.join(pkiRoot, "issuers", "certs");
    if (fs.existsSync(config.caCertFile)) {
      try {
        fs.copyFileSync(config.caCertFile, path.join(pkiIssuersDir, "ca-cert.pem"));
      } catch (e) { }
    }

    serverOptions.serverCertificateManager = certificateManager;
  } else if (needsCerts) {
    console.warn("[Certs] Certificate files not found, server will generate self-signed certs");
  }

  if (config.authUsers || config.authCertificate) {
    const userManager = createUserManager();
    serverOptions.userManager = {
      isValidUser: (userName, password) => {
        if (!config.authUsers) return false;
        return userManager.isValidUser(userName, password);
      },
      getUserRoles: (user) => {
        return userManager.getUserRoles(user);
      },
    };

    if (config.authCertificate) {
      serverOptions.isValidUserAsync = async (userIdentityToken, session) => {
        return true;
      };
    }
  }

  if (config.discoveryUrl) {
    serverOptions.registerServerMethod = 2;
    serverOptions.discoveryServerEndpointUrl = config.discoveryUrl;
  }

  if (config.isDiscovery) {
    console.log("[Server] Starting as Discovery Server...");
    const { OPCUADiscoveryServer } = require("node-opcua");
    const discoveryServer = new OPCUADiscoveryServer({
      port: config.port,
      serverCertificateManager: serverOptions.serverCertificateManager,
      certificateFile: serverOptions.certificateFile,
      privateKeyFile: serverOptions.privateKeyFile,
    });
    await discoveryServer.start();
    console.log("\n" + "=".repeat(60));
    console.log(`OPC UA Discovery Server RUNNING on port ${config.port}`);
    console.log("=".repeat(60));

    async function shutdownDiscovery() {
      console.log("\n[Discovery] Shutting down...");
      await discoveryServer.shutdown();
      console.log("[Discovery] Stopped");
      process.exit(0);
    }
    process.on("SIGINT", shutdownDiscovery);
    process.on("SIGTERM", shutdownDiscovery);
    return;
  }

  const server = new OPCUAServer(serverOptions);

  await server.initialize();
  console.log("[Server] Initialized");

  await constructAddressSpace(server);

  await server.start();

  console.log("\n" + "=".repeat(60));
  console.log("OPC UA Test Server RUNNING");
  console.log("=".repeat(60));

  const endpoints = server.endpoints;
  for (const ep of endpoints) {
    const endpointDescriptions = ep.endpointDescriptions();
    for (const desc of endpointDescriptions) {
      console.log(`  Endpoint: ${desc.endpointUrl}`);
      console.log(`    Security: ${SecurityPolicy[desc.securityPolicyUri] || desc.securityPolicyUri}`);
      console.log(`    Mode: ${MessageSecurityMode[desc.securityMode]}`);
      const tokens = (desc.userIdentityTokens || []).map((t) => t.policyId).join(", ");
      console.log(`    Auth: ${tokens}`);
    }
  }
  console.log("=".repeat(60));

  async function shutdown() {
    console.log("\n[Server] Shutting down...");
    stopDynamic();
    stopEvents();
    stopHistorical();
    await server.shutdown(1000);
    console.log("[Server] Stopped");
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", (err) => {
    console.error("[Server] Uncaught exception:", err);
  });
}

main().catch((err) => {
  console.error("[Server] Fatal error:", err);
  process.exit(1);
});
