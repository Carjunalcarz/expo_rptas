#!/usr/bin/env node

/**
 * Appwrite Database Seeding Script for RPTAS
 * 
 * This script adds sample assessment data to your Appwrite database
 * to test the document ID saving functionality and provide realistic data.
 * 
 * Prerequisites:
 * - Run appwrite-setup.js first to create the database structure
 * - Set environment variables for Appwrite connection
 * 
 * Usage:
 * npm run appwrite:seed
 */

const sdk = require('node-appwrite');

// Sample assessment data
const sampleAssessments = [
  {
    ownerName: 'Juan Dela Cruz',
    transactionCode: 'TXN-2024-001',
    tdArp: 'TD-001-2024',
    pin: 'PIN-001-2024',
    barangay: 'Poblacion',
    municipality: 'Quezon City',
    province: 'Metro Manila',
    marketValueTotal: 2500000,
    taxable: true,
    effYear: '2024',
    effQuarter: 'QTR1',
    totalArea: 150.5,
    additionalItem: 'Swimming pool',
    owner_details: JSON.stringify({
      owner: 'Juan Dela Cruz',
      address: '123 Main Street, Poblacion, Quezon City',
      tin: '123-456-789-000',
      telNo: '+63 912 345 6789',
      hasAdministratorBeneficiary: false
    }),
    building_location: JSON.stringify({
      street: '123 Main Street',
      barangay: 'Poblacion',
      municipality: 'Quezon City',
      province: 'Metro Manila',
      latitude: 14.6760,
      longitude: 121.0437,
      buildingImages: []
    }),
    land_reference: JSON.stringify({
      owner: 'Juan Dela Cruz',
      titleNumber: 'TCT-12345',
      lotNumber: 'Lot 1',
      blockNumber: 'Block 1',
      surveyNumber: 'Survey-001',
      tdnArpNumber: 'TDN-001',
      area: '150.5'
    }),
    general_description: JSON.stringify({
      kindOfBuilding: 'Residential',
      structuralType: 'Concrete',
      buildingPermitNo: 'BP-2023-001',
      dateConstructed: '2023-01-15',
      dateOccupied: '2023-06-01',
      buildingAge: '1',
      numberOfStoreys: '2',
      totalFloorArea: '150.5',
      floorPlanImages: []
    }),
    property_assessment: JSON.stringify({
      market_value: 2500000,
      building_category: 'Residential',
      assessment_level: 'Class A',
      assessment_value: 2000000,
      taxable: 1,
      eff_year: '2024',
      eff_quarter: 'QTR1',
      total_area: '150.5'
    })
  },
  {
    ownerName: 'Maria Santos',
    transactionCode: 'TXN-2024-002',
    tdArp: 'TD-002-2024',
    pin: 'PIN-002-2024',
    barangay: 'San Antonio',
    municipality: 'Makati City',
    province: 'Metro Manila',
    marketValueTotal: 4500000,
    taxable: true,
    effYear: '2024',
    effQuarter: 'QTR1',
    totalArea: 200.0,
    additionalItem: 'Garage',
    owner_details: JSON.stringify({
      owner: 'Maria Santos',
      address: '456 Business Ave, San Antonio, Makati City',
      tin: '987-654-321-000',
      telNo: '+63 917 123 4567',
      hasAdministratorBeneficiary: true,
      administratorBeneficiary: {
        name: 'Pedro Santos',
        address: '456 Business Ave, San Antonio, Makati City',
        tin: '111-222-333-000',
        telNo: '+63 918 765 4321'
      }
    }),
    building_location: JSON.stringify({
      street: '456 Business Avenue',
      barangay: 'San Antonio',
      municipality: 'Makati City',
      province: 'Metro Manila',
      latitude: 14.5547,
      longitude: 121.0244,
      buildingImages: []
    }),
    land_reference: JSON.stringify({
      owner: 'Maria Santos',
      titleNumber: 'TCT-67890',
      lotNumber: 'Lot 5',
      blockNumber: 'Block 3',
      surveyNumber: 'Survey-002',
      tdnArpNumber: 'TDN-002',
      area: '200.0'
    }),
    general_description: JSON.stringify({
      kindOfBuilding: 'Commercial',
      structuralType: 'Steel and Concrete',
      buildingPermitNo: 'BP-2022-045',
      dateConstructed: '2022-03-10',
      dateOccupied: '2022-08-15',
      buildingAge: '2',
      numberOfStoreys: '3',
      totalFloorArea: '200.0',
      floorPlanImages: []
    }),
    property_assessment: JSON.stringify({
      market_value: 4500000,
      building_category: 'Commercial',
      assessment_level: 'Class B',
      assessment_value: 3600000,
      taxable: 1,
      eff_year: '2024',
      eff_quarter: 'QTR1',
      total_area: '200.0'
    })
  },
  {
    ownerName: 'Roberto Garcia',
    transactionCode: 'TXN-2024-003',
    tdArp: 'TD-003-2024',
    pin: 'PIN-003-2024',
    barangay: 'Barangay 1',
    municipality: 'Pasig City',
    province: 'Metro Manila',
    marketValueTotal: 1800000,
    taxable: false,
    effYear: '2024',
    effQuarter: 'QTR2',
    totalArea: 120.0,
    additionalItem: 'Garden',
    owner_details: JSON.stringify({
      owner: 'Roberto Garcia',
      address: '789 Residential St, Barangay 1, Pasig City',
      tin: '555-666-777-000',
      telNo: '+63 915 987 6543',
      hasAdministratorBeneficiary: false
    }),
    building_location: JSON.stringify({
      street: '789 Residential Street',
      barangay: 'Barangay 1',
      municipality: 'Pasig City',
      province: 'Metro Manila',
      latitude: 14.5764,
      longitude: 121.0851,
      buildingImages: []
    }),
    land_reference: JSON.stringify({
      owner: 'Roberto Garcia',
      titleNumber: 'TCT-11111',
      lotNumber: 'Lot 8',
      blockNumber: 'Block 2',
      surveyNumber: 'Survey-003',
      tdnArpNumber: 'TDN-003',
      area: '120.0'
    }),
    general_description: JSON.stringify({
      kindOfBuilding: 'Residential',
      structuralType: 'Wood and Concrete',
      buildingPermitNo: 'BP-2021-078',
      dateConstructed: '2021-05-20',
      dateOccupied: '2021-09-01',
      buildingAge: '3',
      numberOfStoreys: '1',
      totalFloorArea: '120.0',
      floorPlanImages: []
    }),
    property_assessment: JSON.stringify({
      market_value: 1800000,
      building_category: 'Residential',
      assessment_level: 'Class C',
      assessment_value: 1440000,
      taxable: 0,
      eff_year: '2024',
      eff_quarter: 'QTR2',
      total_area: '120.0'
    })
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  // Get configuration from environment
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_ASSESSMENTS_COLLECTION_ID || process.env.EXPO_PUBLIC_APPWRITE_ASSESSMENTS_COLLECTION_ID;

  // Validate configuration
  if (!endpoint || !projectId || !apiKey || !databaseId || !collectionId) {
    console.error('❌ Missing required environment variables:');
    console.error('Required: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
    console.error('Required: APPWRITE_DATABASE_ID, APPWRITE_ASSESSMENTS_COLLECTION_ID');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Project: ${projectId}`);
  console.log(`  Database: ${databaseId}`);
  console.log(`  Collection: ${collectionId}`);

  // Initialize Appwrite client
  const client = new sdk.Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new sdk.Databases(client);

  try {
    // Verify database and collection exist
    console.log('\n🔍 Verifying database structure...');
    
    const database = await databases.get(databaseId);
    console.log(`✅ Database found: ${database.name}`);
    
    const collection = await databases.getCollection(databaseId, collectionId);
    console.log(`✅ Collection found: ${collection.name}`);

    // Check if collection already has documents
    const existingDocs = await databases.listDocuments(databaseId, collectionId, [
      sdk.Query.limit(1)
    ]);
    
    if (existingDocs.total > 0) {
      console.log(`\n⚠️  Collection already contains ${existingDocs.total} documents.`);
      console.log('Do you want to add sample data anyway? (This will not delete existing data)');
      
      // For automation, we'll proceed. In interactive mode, you could prompt here.
      console.log('Proceeding with seeding...');
    }

    // Create sample assessments
    console.log('\n📝 Creating sample assessments...');
    const createdAssessments = [];

    for (let i = 0; i < sampleAssessments.length; i++) {
      const assessment = sampleAssessments[i];
      
      try {
        console.log(`  Creating assessment ${i + 1}/${sampleAssessments.length}: ${assessment.ownerName}`);
        
        // Add timestamps
        const now = new Date().toISOString();
        const assessmentData = {
          ...assessment,
          clientLocalId: `seed-${Date.now()}-${i}`,
          createdAt: now,
          updatedAt: now,
          synced: true
        };

        const created = await databases.createDocument(
          databaseId,
          collectionId,
          sdk.ID.unique(),
          assessmentData
        );

        createdAssessments.push(created);
        console.log(`    ✅ Created: ${created.$id}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`    ❌ Failed to create assessment for ${assessment.ownerName}:`, error.message);
      }
    }

    // Summary
    console.log('\n🎉 Seeding completed!');
    console.log(`📊 Results:`);
    console.log(`  Total assessments created: ${createdAssessments.length}`);
    console.log(`  Failed: ${sampleAssessments.length - createdAssessments.length}`);
    
    if (createdAssessments.length > 0) {
      console.log('\n📋 Created Assessment IDs:');
      createdAssessments.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.ownerName}: ${doc.$id}`);
      });
    }

    console.log('\n✨ Your database is now seeded with sample data!');
    console.log('You can now test the document ID saving functionality in your mobile app.');

  } catch (error) {
    console.error('\n💥 Seeding failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure you ran the setup script first: npm run appwrite:setup');
    console.error('2. Verify your environment variables are correct');
    console.error('3. Check that your API key has the necessary permissions');
    console.error('4. Ensure your Appwrite server is running and accessible');
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleAssessments };
