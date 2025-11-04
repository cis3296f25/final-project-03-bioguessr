import {
  DynamoDBClient,
  PutItemCommand,
  CreateTableCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import fs from "fs";

const client = new DynamoDBClient({
   region: process.env.AWS_REGION,
   credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const tableParams = {
  TableName: "animals",
  AttributeDefinitions: [{ AttributeName: "name", AttributeType: "S" }],
  KeySchema: [{ AttributeName: "name", KeyType: "HASH" }],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
};

try {
  const command = new CreateTableCommand(tableParams);
  const data = await client.send(command);
  console.log(data);
} catch (err) {
  console.log(err);
}

const data = JSON.parse(
  fs.readFileSync("./animal_data/animals_with_images.json", "utf8"),
);

for (const item of data) {
  try {
    const marshalledItem = marshall(
      {
        name: item.name,
        scientific_name: item.taxonomy?.scientific_name,
        image_url: item.image_url,
        taxonomy: item.taxonomy,
        characteristics: item.characteristics,
      },
      { removeUndefinedValues: true },
    );

    if (!marshalledItem.name) {
      console.warn("Skipping item without name:", item);
      continue;
    }

    await client.send(
      new PutItemCommand({
        TableName: "animals",
        Item: marshalledItem,
      }),
    );

    console.log(`Inserted: ${item.name}`);
  } catch (err) {
    console.error(`Error inserting item:`, err);
  }
}
