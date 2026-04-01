import { execFileSync } from "node:child_process";

const serviceArn = process.argv[2];
const imageIdentifier = process.argv[3];
const region = process.env.AWS_REGION ?? "eu-west-2";

if (!serviceArn || !imageIdentifier) {
  console.error("Usage: node infra/scripts/update-apprunner-service.mjs <serviceArn> <imageIdentifier>");
  process.exit(1);
}

function aws(args) {
  return execFileSync("aws", [...args, "--region", region, "--output", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function describeService() {
  return JSON.parse(aws(["apprunner", "describe-service", "--service-arn", serviceArn]));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const current = describeService();
const sourceConfiguration = current.Service.SourceConfiguration;

if (!sourceConfiguration?.ImageRepository) {
  console.error("The target App Runner service is not configured from an image repository.");
  process.exit(1);
}

sourceConfiguration.ImageRepository.ImageIdentifier = imageIdentifier;

console.log(`Updating ${current.Service.ServiceName} to ${imageIdentifier}`);

const updateResult = JSON.parse(
  aws([
    "apprunner",
    "update-service",
    "--service-arn",
    serviceArn,
    "--source-configuration",
    JSON.stringify(sourceConfiguration)
  ])
);

console.log(`Started App Runner operation ${updateResult.OperationId}`);

let lastStatus = "";
const deadline = Date.now() + 20 * 60 * 1000;

while (Date.now() < deadline) {
  const latest = describeService();
  const status = latest.Service.Status;

  if (status !== lastStatus) {
    console.log(`Service status: ${status}`);
    lastStatus = status;
  }

  if (status === "RUNNING") {
    console.log(`Service ${latest.Service.ServiceName} is running.`);
    process.exit(0);
  }

  if (status.endsWith("_FAILED") || status === "DELETE_FAILED") {
    console.error(`Service entered failure state: ${status}`);
    process.exit(1);
  }

  await sleep(10000);
}

console.error("Timed out waiting for App Runner service to return to RUNNING.");
process.exit(1);
