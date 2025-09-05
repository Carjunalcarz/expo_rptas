// Usage:
//   Set env vars then run: npm run appwrite:fix-storage-perms
// Required env:
//   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_BUCKET_ID
// Optional:
//   LIMIT (default 200)

const sdk = require('node-appwrite');

async function main() {
    const endpoint = process.env.APPWRITE_ENDPOINT;
    const project = process.env.APPWRITE_PROJECT_ID;
    const key = process.env.APPWRITE_API_KEY;
    const bucketId = process.env.APPWRITE_BUCKET_ID;
    const limit = parseInt(process.env.LIMIT || '200', 10);

    if (!endpoint || !project || !key || !bucketId) {
        console.error('Missing required env: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_BUCKET_ID');
        process.exit(1);
    }

    const client = new sdk.Client()
        .setEndpoint(String(endpoint))
        .setProject(String(project))
        .setKey(String(key));

    const storage = new sdk.Storage(client);
    const Permission = sdk.Permission;
    const Role = sdk.Role;

    const list = await storage.listFiles(bucketId, undefined, limit);
    let ok = 0, fail = 0;
    for (const f of list.files) {
        try {
            await storage.updateFile(bucketId, f.$id, undefined, [Permission.read(Role.any())]);
            ok++;
        } catch (e) {
            fail++;
            console.warn('Failed to update perms for file', f.$id, e?.message || e);
        }
    }
    console.log(`Done. Public read set: ${ok}. Failed: ${fail}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
