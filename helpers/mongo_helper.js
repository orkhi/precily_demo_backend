const MongoClient = require('mongodb').MongoClient;
// const client = new MongoClient(process.env.DB_URL, { maxPoolSize: process.env.DB_MAX_POOL_SIZE });

const client = new MongoClient(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });


async function listDatabases(client) {
    databasesList = await client.db().admin().listDatabases();
    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

module.exports = {

    dbInit: async function () {
        try {
            // Connect to the MongoDB cluster
            await client.connect();
            console.log('DB connected successfully!')

            // Make the appropriate DB calls
            // await listDatabases(client);
            return (client)

        } catch (e) {
            console.error(e);
            console.log("Something went wrong while conencting to DB!")
        }

    },
    dbClose: async function () {
        await client.close();
    },
    findOne: async function (collectionName, option) {
        const result = await client.db(process.env.DB_NAME).collection(collectionName).findOne(option);
        return result;
    },
    find: async function (collectionName, option) {
        const result = await client.db(process.env.DB_NAME).collection(collectionName).find(option);
        return result.toArray();
    },
    insertOne: async function (collectionName, newItem) {
        const result = await client.db(process.env.DB_NAME).collection(collectionName).insertOne(newItem);
        return result;
    },
    insertMany: async function (collectionName, newItems) {
        const result = await client.db(process.env.DB_NAME).collection(collectionName).insertMany(newItems);
        return result;
    },
    updateOne: async function (collectionName, updateObject, updateParams, pushParams) {
        const result = await client.db(process.env.DB_NAME).collection(collectionName)
            .updateOne(updateObject, { $set: updateParams, $push: pushParams });
        return result;
    },
    deleteOne: async function (collectionName, item) {
        const result = await client.db(process.env.DB_NAME).collection(collectionName).deleteOne(item);
        return result;
    },
    aggregate: async function (collectionName, pipeLine) {
        const aggregationCursor = await client.db(process.env.DB_NAME).collection(collectionName).aggregate(pipeLine);
        let result = [];
        await aggregationCursor.forEach(item => {
            result.push(item);
        });
        return result;
    }


}