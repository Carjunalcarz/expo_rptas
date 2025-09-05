const OfflineStorage = require('./lib/offline-storage').default;

const propertyData = {
    street: "123 Main St",
    barangay: "Soriano",
    municipality: "Cabadbaran City",
    province: "Agusan del Norte",
    buildingImages: [
        "file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540ajncarz%252Frestate/ImagePicker/b20f0cca-c24e-4e27-b1b7-b34c7a5d3ddd.jpeg",
        "file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540ajncarz%252Frestate/ImagePicker/e3e4da95-2139-4bb0-8d75-e3d6ed471900.jpeg",
        "file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540ajncarz%252Frestate/ImagePicker/a7d47c57-8881-477b-b6aa-687cdec5eb30.jpeg"
    ]
};

(async () => {
    const saved = await OfflineStorage.saveOffline(propertyData);
    console.log('Saved offline:', saved);
    const synced = await OfflineStorage.syncOne(saved.localId);
    console.log('Synced:', synced);
})();
