// Lightweight Appwrite provisioning script for assessments schema
// Usage (PowerShell):
//  $env:APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"; $env:APPWRITE_PROJECT_ID="..."; $env:APPWRITE_API_KEY="..."; node ./scripts/appwrite-setup.js
// Optional inputs: APPWRITE_DATABASE_ID, APPWRITE_ASSESSMENTS_COLLECTION_ID

/* eslint-disable no-console */
const sdk = require('node-appwrite');

async function main() {
    const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;
    let databaseId = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '';
    let collectionId = process.env.APPWRITE_ASSESSMENTS_COLLECTION_ID || '';

    if (!endpoint || !projectId || !apiKey) {
        console.error('Missing required env: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
        process.exit(1);
    }

    const client = new sdk.Client()
        .setEndpoint(String(endpoint))
        .setProject(String(projectId))
        .setKey(String(apiKey));

    const databases = new sdk.Databases(client);

    // 1) Ensure database exists
    if (!databaseId) {
        const name = 'RPTAS';
        const resp = await databases.create(sdk.ID.unique(), name);
        databaseId = resp.$id;
        console.log('Created database:', databaseId);
    } else {
        try {
            const db = await databases.get(databaseId);
            console.log('Using database:', db.$id, db.name);
        } catch (e) {
            console.log('Database not found, creating new…');
            const resp = await databases.create(databaseId, 'RPTAS');
            databaseId = resp.$id;
            console.log('Created database:', databaseId);
        }
    }

    // 2) Ensure collection exists (assessments)
    if (!collectionId) {
        const created = await databases.createCollection(databaseId, sdk.ID.unique(), 'assessments');
        collectionId = created.$id;
        console.log('Created collection assessments:', collectionId);
    } else {
        try {
            const c = await databases.getCollection(databaseId, collectionId);
            console.log('Using collection:', c.$id, c.name);
        } catch (e) {
            const created = await databases.createCollection(databaseId, collectionId, 'assessments');
            collectionId = created.$id;
            console.log('Created collection assessments:', collectionId);
        }
    }

    // 2b) Create related collections: owners, locations
    async function ensureCollection(name, idEnvVar) {
        let cid = process.env[idEnvVar] || '';
        if (!cid) {
            const created = await databases.createCollection(databaseId, sdk.ID.unique(), name);
            console.log(`Created collection ${name}:`, created.$id);
            return created.$id;
        }
        try {
            const c = await databases.getCollection(databaseId, cid);
            console.log(`Using collection ${name}:`, c.$id);
            return c.$id;
        } catch (e) {
            const created = await databases.createCollection(databaseId, cid, name);
            console.log(`Created collection ${name}:`, created.$id);
            return created.$id;
        }
    }

    const ownersCollectionId = await ensureCollection('owners', 'APPWRITE_OWNERS_COLLECTION_ID');
    const locationsCollectionId = await ensureCollection('locations', 'APPWRITE_LOCATIONS_COLLECTION_ID');

    // Helper for attribute creation in arbitrary collection
    async function ensureAttributeIn(collection, key, create) {
        try {
            const list = await databases.listAttributes(databaseId, collection);
            const exists = (list.attributes || []).some((a) => a.key === key);
            if (exists) return;
        } catch (_) { }
        await create();
        console.log(`Created attribute in ${collection}:`, key);
    }

    // Owners attributes
    await ensureAttributeIn(ownersCollectionId, 'name', () => databases.createStringAttribute(databaseId, ownersCollectionId, 'name', 255, true));
    await ensureAttributeIn(ownersCollectionId, 'address', () => databases.createStringAttribute(databaseId, ownersCollectionId, 'address', 1024, false));
    await ensureAttributeIn(ownersCollectionId, 'tin', () => databases.createStringAttribute(databaseId, ownersCollectionId, 'tin', 64, false));
    await ensureAttributeIn(ownersCollectionId, 'telNo', () => databases.createStringAttribute(databaseId, ownersCollectionId, 'telNo', 64, false));
    await ensureAttributeIn(ownersCollectionId, 'hasAdministratorBeneficiary', () => databases.createBooleanAttribute(databaseId, ownersCollectionId, 'hasAdministratorBeneficiary', false));
    await ensureAttributeIn(ownersCollectionId, 'administratorBeneficiary', async () => {
        if (typeof databases.createJsonAttribute === 'function') {
            return databases.createJsonAttribute(databaseId, ownersCollectionId, 'administratorBeneficiary', false);
        }
        return databases.createStringAttribute(databaseId, ownersCollectionId, 'administratorBeneficiary', 4096, false);
    });

    // Owners indexes
    async function ensureIndexIn(collection, key, type, attrs) {
        try {
            const list = await databases.listIndexes(databaseId, collection);
            const exists = (list.indexes || []).some((i) => i.key === key);
            if (exists) return;
        } catch (_) { }
        await databases.createIndex(databaseId, collection, key, type, attrs, attrs.map(() => 'asc'));
        console.log(`Created index in ${collection}:`, key);
    }
    await ensureIndexIn(ownersCollectionId, 'idx_owner_name', 'key', ['name']);
    await ensureIndexIn(ownersCollectionId, 'idx_owner_tin', 'key', ['tin']);

    // Locations attributes
    await ensureAttributeIn(locationsCollectionId, 'street', () => databases.createStringAttribute(databaseId, locationsCollectionId, 'street', 255, false));
    await ensureAttributeIn(locationsCollectionId, 'barangay', () => databases.createStringAttribute(databaseId, locationsCollectionId, 'barangay', 128, false));
    await ensureAttributeIn(locationsCollectionId, 'municipality', () => databases.createStringAttribute(databaseId, locationsCollectionId, 'municipality', 128, false));
    await ensureAttributeIn(locationsCollectionId, 'province', () => databases.createStringAttribute(databaseId, locationsCollectionId, 'province', 128, false));
    await ensureIndexIn(locationsCollectionId, 'idx_muni_brgy', 'key', ['municipality', 'barangay']);

    // 2c) Relationships from assessments -> owners, locations (fallback to string ids if not supported)
    async function ensureRelationship(fromCollection, key, toCollection, fallbackKey) {
        try {
            if (typeof databases.createRelationshipAttribute === 'function') {
                // Attempt one-to-one relationship
                await databases.createRelationshipAttribute(
                    databaseId,
                    fromCollection,
                    key,
                    toCollection,
                    'oneToOne',
                    false,
                    undefined,
                    'setNull'
                );
                console.log('Created relationship:', key);
                return;
            }
            throw new Error('Relationship API not available');
        } catch (e) {
            // Fallback: plain string attr to store related $id
            try {
                await ensureAttributeIn(fromCollection, fallbackKey, () => databases.createStringAttribute(databaseId, fromCollection, fallbackKey, 64, false));
                console.log('Relationship fallback to string id:', fallbackKey);
            } catch (e2) {
                console.warn('Failed to create relationship or fallback for', key, e2?.message || e2);
            }
        }
    }

    // Always create string id fields for relationships so client can safely set them
    await ensureAttribute('string', 'ownerRefId', () => databases.createStringAttribute(databaseId, collectionId, 'ownerRefId', 64, false));
    await ensureAttribute('string', 'locationRefId', () => databases.createStringAttribute(databaseId, collectionId, 'locationRefId', 64, false));
    await ensureRelationship(collectionId, 'ownerRef', ownersCollectionId, 'ownerRefId');
    await ensureRelationship(collectionId, 'locationRef', locationsCollectionId, 'locationRefId');

    // Helper: create attribute if missing
    async function ensureAttribute(fn, key, create) {
        try {
            const list = await databases.listAttributes(databaseId, collectionId);
            const exists = (list.attributes || []).some((a) => a.key === key);
            if (exists) return;
        } catch (_) {
            // continue to attempt creation
        }
        await create();
        console.log('Created attribute:', key);
    }

    // 3) Create flattened/indexable attributes
    await ensureAttribute('string', 'clientLocalId', () => databases.createStringAttribute(databaseId, collectionId, 'clientLocalId', 64, false));
    await ensureAttribute('datetime', 'createdAt', () => databases.createDatetimeAttribute(databaseId, collectionId, 'createdAt', false));
    await ensureAttribute('datetime', 'updatedAt', () => databases.createDatetimeAttribute(databaseId, collectionId, 'updatedAt', false));
    await ensureAttribute('string', 'userId', () => databases.createStringAttribute(databaseId, collectionId, 'userId', 64, false));
    await ensureAttribute('boolean', 'synced', () => databases.createBooleanAttribute(databaseId, collectionId, 'synced', false));

    await ensureAttribute('string', 'ownerName', () => databases.createStringAttribute(databaseId, collectionId, 'ownerName', 255, false));
    await ensureAttribute('string', 'transactionCode', () => databases.createStringAttribute(databaseId, collectionId, 'transactionCode', 64, false));
    await ensureAttribute('string', 'tdArp', () => databases.createStringAttribute(databaseId, collectionId, 'tdArp', 64, false));
    await ensureAttribute('string', 'pin', () => databases.createStringAttribute(databaseId, collectionId, 'pin', 64, false));
    await ensureAttribute('string', 'barangay', () => databases.createStringAttribute(databaseId, collectionId, 'barangay', 128, false));
    await ensureAttribute('string', 'municipality', () => databases.createStringAttribute(databaseId, collectionId, 'municipality', 128, false));
    await ensureAttribute('string', 'province', () => databases.createStringAttribute(databaseId, collectionId, 'province', 128, false));

    await ensureAttribute('float', 'marketValueTotal', () => databases.createFloatAttribute(databaseId, collectionId, 'marketValueTotal', false));
    await ensureAttribute('boolean', 'taxable', () => databases.createBooleanAttribute(databaseId, collectionId, 'taxable', false));
    await ensureAttribute('string', 'effYear', () => databases.createStringAttribute(databaseId, collectionId, 'effYear', 8, false));
    await ensureAttribute('string', 'effQuarter', () => databases.createStringAttribute(databaseId, collectionId, 'effQuarter', 8, false));
    await ensureAttribute('float', 'totalArea', () => databases.createFloatAttribute(databaseId, collectionId, 'totalArea', false));
    await ensureAttribute('string', 'additionalItem', () => databases.createStringAttribute(databaseId, collectionId, 'additionalItem', 255, false));

    // 4) JSON blocks (fallback to string if JSON not supported)
    async function createJsonOrString(key) {
        try {
            if (typeof databases.createJsonAttribute === 'function') {
                await databases.createJsonAttribute(databaseId, collectionId, key, false);
            } else {
                await databases.createStringAttribute(databaseId, collectionId, key, 16384, false);
            }
        } catch (e) {
            // fallback to string if JSON creation failed
            try {
                await databases.createStringAttribute(databaseId, collectionId, key, 16384, false);
            } catch (e2) {
                throw e2;
            }
        }
    }

    const jsonKeys = [
        'owner_details',
        'building_location',
        'land_reference',
        'general_description',
        'structural_materials',
        'property_appraisal',
        'property_assessment',
        'additionalItems'
    ];
    for (const key of jsonKeys) {
        await ensureAttribute('json', key, () => createJsonOrString(key));
    }

    // 5) Indexes for common queries
    async function ensureIndex(key, type, attrs) {
        try {
            const list = await databases.listIndexes(databaseId, collectionId);
            const exists = (list.indexes || []).some((i) => i.key === key);
            if (exists) return;
        } catch (_) { }
        await databases.createIndex(databaseId, collectionId, key, type, attrs, attrs.map(() => 'asc'));
        console.log('Created index:', key);
    }

    await ensureIndex('idx_ownerName', 'key', ['ownerName']);
    await ensureIndex('idx_transactionCode', 'key', ['transactionCode']);
    await ensureIndex('idx_tdArp', 'key', ['tdArp']);
    await ensureIndex('idx_pin', 'key', ['pin']);
    await ensureIndex('idx_location', 'key', ['municipality', 'barangay']);

    console.log('\nDone. Save these IDs for your env:');
    console.log('APPWRITE_DATABASE_ID=', databaseId);
    console.log('APPWRITE_ASSESSMENTS_COLLECTION_ID=', collectionId);
    console.log('APPWRITE_OWNERS_COLLECTION_ID=', ownersCollectionId);
    console.log('APPWRITE_LOCATIONS_COLLECTION_ID=', locationsCollectionId);
}

main().catch((err) => {
    console.error('Setup failed:', err?.message || err);
    process.exit(1);
});
