const axios = require("axios");

const url = "https://api-ext.zluri.com/ext/integrations/sync-sdk";
const appId = ""; // to be replaced with your app id
const instanceIdentifier = "sdk-slack-test"; // to be replaced with your instance identifier [unique for each instance]
const apiKey = ""; // to be replaced with your api key

const globalHeaders = {
  "Content-Type": "application/json",
  api_key: apiKey,
};

async function makeRequest(method, url, payload) {
  try {
    const response = await axios({
      method: method,
      url: url,
      headers: globalHeaders,
      data: payload,
    });
    return response;
  } catch (error) {
    console.error("error", error.response.status, error.response.data);
    throw new Error(`${error.response.status} ${error.response.data.message}`);
  }
}

async function getOrCreateInstance() {
  console.log("getting or creating instance");
  const payload = {
    appId: appId,
    instanceIdentifier: instanceIdentifier,
  };
  const response = await makeRequest(
    "POST",
    `${url}/getOrCreateOrgIntegration`,
    payload
  );
  if (response.status === 200) {
    console.log("instance already exists");
  }
  if (response.status === 201) {
    console.log("created new instance");
  }
  return response.data.data;
}

async function initSync(orgIntegrationId) {
  console.log("initialising sync");
  const payload = {
    orgIntegrationId: orgIntegrationId,
    forceSync: true,
  };
  const response = await makeRequest("POST", `${url}/init-sync`, payload);
  if (response.status === 201) {
    console.log("sync initialised");
  }
  return response.data;
}

async function uploadData(
  orgIntegrationId,
  syncId,
  dataPointEnum,
  data,
  index = 1
) {
  try {
    console.log("uploading data");
    const payload = {
      orgIntegrationId: orgIntegrationId,
      syncId: syncId,
      dataPointEnum: dataPointEnum,
      data: data,
      index,
    };
    const response = await makeRequest("PUT", `${url}/upload-data`, payload);
    if (response.status === 200) {
      console.log("data uploaded");
    }
    return response?.data;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function finishSync(orgIntegrationId, syncId) {
  console.log("finishing sync");
  const payload = {
    orgIntegrationId: orgIntegrationId,
    syncId: syncId,
  };
  const response = await makeRequest("PUT", `${url}/finish-sync`, payload);
  if (response.status === 200) {
    console.log("sync finished");
  }
  return response.data;
}

async function getAvailableDataPoints(dataPointEnum) {
  console.log("getting available data points");
  const response = await makeRequest("GET", `${url}/datapoints`, null);
  const data = response.data.data;
  const dataPoints = data.filter((x) => x.enum === dataPointEnum);
  return dataPoints[0].schema;
}

async function main() {
  try {
    const instance = await getOrCreateInstance();
    const orgIntegrationId = instance._id;
    console.log("orgIntegrationId", orgIntegrationId);

    const dataPointEnum = "user_information";

    // you can get the available data points using getAvailableDataPoints()
    // const dataPoints = await getAvailableDataPoints(dataPointEnum);
    // console.log('dataPoints', dataPoints);

    const syncResponse = await initSync(orgIntegrationId);
    const syncId = syncResponse.syncId;
    console.log("syncId", syncId);

    const data = [
      {
        email: "test@zlurihq.com",
        name: "Test User",
        role: "User",
        last_used: "2023-10-25T11:10:02.736Z",
        reportingmanager: "test2@zlurihq.com",
      },
      // Add more records as needed
    ];

    const batchSize = 1000; // You can change this value as needed
    const totalRecords = data.length; // logic can be modified as applicable

    for (let index = 0; index < totalRecords; index += batchSize) {
      const batch = data.slice(index, index + batchSize);
      await uploadData(
        orgIntegrationId,
        syncId,
        dataPointEnum,
        batch,
        index / batchSize
      );
    }

    await finishSync(orgIntegrationId, syncId);
  } catch (error) {
    console.error("Error in main function", error?.message);
  }
}

main();
