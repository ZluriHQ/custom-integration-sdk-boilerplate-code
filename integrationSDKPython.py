import requests
import json

url = "https://api-ext.zluri.com/ext/integrations/sync-sdk"
appId = "" # to be replaced with your app id
instanceIdentifier = "yourapp-CustomIntegration-ID" # to be replaced with your instance identifier [unique for each instance]
apiKey = "" # to be replaced with your api key


globalHeaders = {
  'Content-Type': 'application/json',
  'api_key': apiKey
}




def makeRequest(method, url, payload):
  response = requests.request(method, url, headers=globalHeaders, data=payload)
  if(response.status_code>=400):
    print('error',response.status_code,response.text, response.json())
    raise Exception(response.text + " " + response.json().get('message'))
  return response

  

def getOrCreateInstance():
  print('getting or creating instance')
  payload = json.dumps({
  "appId": appId,
  "instanceIdentifier": instanceIdentifier,
  })
  response = makeRequest("POST", url+"/getOrCreateOrgIntegration", payload)
  if response.status_code == 200:
     print('instance already exists')
  if response.status_code == 201:
     print('created new instance') 
  return response.json().get('data')

def initSync(orgIntegrationId):
  print('initialising sync')
  payload = json.dumps({
  "orgIntegrationId": orgIntegrationId  
  })
  response = makeRequest("POST", url+"/init-sync", payload)
  if response.status_code == 201:
    print('sync initialised')
  return response.json()

def uploadData(orgIntegrationId,syncId,dataPointEnum,data):
  print('uploading data')
  payload = json.dumps({
  "orgIntegrationId": orgIntegrationId,
  "syncId": syncId,
  "dataPointEnum": dataPointEnum,
  "data": data,
  })
  response = makeRequest("PUT", url+"/upload-data", payload)
  if response.status_code == 200: 
        print('data uploaded')
  return response.json()

def finishSync(orgIntegrationId,syncId):
    print('finishing sync')
    payload = json.dumps({
    "orgIntegrationId": orgIntegrationId,
    "syncId": syncId,
    })
    response = makeRequest("PUT", url+"/finish-sync", payload)
    if response.status_code == 200:
        print('sync finished')
    return response.json()

def getAvailableDataPoints(dataPointEnum):
    print('getting available data points')
    response = makeRequest("GET", url+"/datapoints",payload=None)
    data= response.json().get('data')
    dataPoints = list(filter(lambda x: x.get('enum') == dataPointEnum, data))
    return dataPoints[0].get('schema')

def main():
    orgIntegrationId = getOrCreateInstance().get('_id')
    print('orgIntegrationId',orgIntegrationId)
    dataPointEnum = "user_information"

    # you can get the available data points using getAvailableDataPoints()
    # dataPoints = getAvailableDataPoints(dataPointEnum)
    # print('dataPoints',dataPoints)

    syncId = initSync(orgIntegrationId).get('syncId')
    print('syncId',syncId)
    

    data = [
      {
          "email": "test@zlurihq.com",
          "name": "Test User",
          "role": "User",
          "last_used": "2023-10-25T11:10:02.736Z"
      },
      {
          "last_used": "2023-10-25T11:10:02.736Z",
          "name": "Test User2",
          "role": "Admin",
          "email": "test2@zlurihq.com"
      },
      {
          "email": "test3@zlurihq.com",
          "last_used": "2023-10-25T11:10:02.736Z",
          "name": "Test User3",
          "role": "Guest"
      }
  ]

    batch_size = 1000  # You can set this to any desired value

    for index in range(0, len(data), batch_size):
      batch = data[index:index + batch_size]
      uploadData(orgIntegrationId,syncId,dataPointEnum,batch)

    finishSync(orgIntegrationId,syncId)
  
main()



