/**
 * RPTAS Assessment Service for Appwrite Integration
 * 
 * This module provides a comprehensive service layer for managing property assessments
 * in the RPTAS (Real Property Tax Assessment System) mobile application using Appwrite
 * as the backend database.
 * 
 * KEY FEATURES:
 * ============
 * 1. Complete CRUD Operations - Create, Read, Update, Delete assessments
 * 2. Advanced Search & Filtering - Search by owner details, location-based queries
 * 3. Bulk Synchronization - Sync multiple assessments with progress tracking
 * 4. Offline-First Support - Handle local-to-remote data synchronization
 * 5. Geographic Queries - Find assessments within specific radius
 * 6. Statistics & Analytics - Get assessment counts and sync status
 * 
 * HOW IT WORKS:
 * =============
 * - All methods require user authentication via ensureSession()
 * - Uses Appwrite's database service for cloud storage
 * - Supports offline-first architecture with sync capabilities
 * - Handles error cases and provides detailed progress feedback
 * - Designed for scalability with pagination and query optimization
 * 
 * USAGE EXAMPLES:
 * ===============
 * // Create new assessment
 * const newAssessment = await AppwriteAssessmentService.createAssessment(assessmentData);
 * 
 * // List with pagination
 * const { documents, total } = await AppwriteAssessmentService.listAssessments(25, 0);
 * 
 * // Search by owner
 * const results = await AppwriteAssessmentService.searchAssessments("John Doe");
 * 
 * // Sync local assessments
 * await AppwriteAssessmentService.syncAssessments(localData, (progress) => {
 *   console.log(`${progress.current}/${progress.total} - ${progress.message}`);
 * });
 * 
 * @author RPTAS Development Team
 * @version 1.0.0
 */

// Import Appwrite database and storage instances from configuration
import { databases, storage } from './appwrite_config';
// Import Appwrite Query builder and ID generator for database operations
import { Query, ID } from 'react-native-appwrite';
// Import session management to ensure user is authenticated before operations
import { ensureSession } from './appwrite';

/**
 * Assessment interface defining the structure of assessment data
 * This represents a complete property assessment record in the RPTAS system
 */
export interface Assessment {
  $id?: string;                    // Appwrite document ID (auto-generated)
  local_id?: string;               // Local database ID for offline sync
  owner_details?: any;             // Property owner information (name, contact, etc.)
  property_details?: any;          // Basic property information (address, type, etc.)
  building_details?: any;          // Building specifications (area, materials, etc.)
  land_details?: any;              // Land information (area, classification, etc.)
  property_assessment?: any;       // Assessment calculations and values
  market_value?: any;              // Current market value of the property
  assessment_level?: any;          // Assessment level classification
  assessed_value?: any;            // Final assessed value for taxation
  taxability?: any;                // Tax status and exemptions
  effectivity?: any;               // Assessment effectivity dates
  appraisal_details?: any;         // Detailed appraisal information
  memoranda?: any;                 // Additional notes and remarks
  attachments?: any;               // File attachments (photos, documents)
  building_location?: any;         // GPS coordinates {latitude, longitude}
  created_at?: string;             // ISO timestamp when record was created
  updated_at?: string;             // ISO timestamp when record was last updated
  synced?: boolean;                // Flag indicating if record is synced with server
}

/**
 * Interface for tracking bulk sync progress
 * Used to provide real-time feedback during assessment synchronization
 */
export interface AssessmentSyncProgress {
  stage: 'starting' | 'fetching_remote' | 'saving_database' | 'completed' | 'error';
  current?: number;                // Current item being processed
  total?: number;                  // Total number of items to process
  message: string;                 // Human-readable progress message
}

/**
 * AppwriteAssessmentService - A dedicated service class for managing assessment data
 * 
 * This service provides a complete CRUD (Create, Read, Update, Delete) interface
 * for assessment records stored in Appwrite database. It handles:
 * - Individual assessment operations
 * - Bulk synchronization with progress tracking
 * - Search and filtering capabilities
 * - Location-based queries
 * - Assessment statistics
 * 
 * All methods are static and require user authentication via ensureSession()
 */
export class AppwriteAssessmentService {
  // Appwrite collection ID where assessments are stored (from environment variables)
  private static readonly COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_ASSESSMENTS_COLLECTION_ID!;
  // Appwrite database ID containing the assessments collection
  private static readonly DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;

  /**
   * Create a new assessment record in Appwrite database
   * 
   * @param assessment - Assessment data (without $id as it's auto-generated)
   * @returns Promise<Assessment> - The created assessment with generated $id
   * 
   * Process:
   * 1. Ensure user is authenticated
   * 2. Add timestamps and sync status
   * 3. Create document in Appwrite with unique ID (ASSESSMENTS TABLE ONLY)
   * 4. Return the created assessment record
   * 
   * SIMPLIFIED APPROACH: Only uses assessments table - no separate owners/locations tables.
   * All data is stored as JSON fields within the single assessment document.
   */
  static async createAssessment(assessment: Omit<Assessment, '$id'>): Promise<Assessment> {
    // Ensure user session is valid before proceeding
    await ensureSession();
    
    // Prepare assessment data with metadata
    const assessmentData = {
      ...assessment,                           // Spread all assessment fields
      created_at: new Date().toISOString(),   // Add creation timestamp
      updated_at: new Date().toISOString(),   // Add update timestamp
      synced: true                            // Mark as synced since it's being saved to remote
    };

    // Create document in Appwrite database (ASSESSMENTS TABLE ONLY)
    const response = await databases.createDocument(
      this.DATABASE_ID,     // Target database
      this.COLLECTION_ID,   // Target collection (assessments only)
      ID.unique(),          // Generate unique document ID
      assessmentData        // Document data (all data in single record)
    );

    return response as Assessment;
  }

  /**
   * Retrieve a single assessment by its unique ID
   * 
   * @param assessmentId - The unique document ID of the assessment
   * @returns Promise<Assessment> - The assessment record
   * @throws Error if assessment not found or user not authorized
   * 
   * Process:
   * 1. Ensure user is authenticated
   * 2. Fetch document from Appwrite by ID
   * 3. Return the assessment data
   */
  static async getAssessment(assessmentId: string): Promise<Assessment> {
    // Ensure user session is valid
    await ensureSession();
    
    // Fetch the specific document from Appwrite
    const response = await databases.getDocument(
      this.DATABASE_ID,     // Source database
      this.COLLECTION_ID,   // Source collection
      assessmentId          // Document ID to retrieve
    );

    return response as Assessment;
  }

  /**
   * Update an existing assessment with new data
   * 
   * @param assessmentId - The unique ID of the assessment to update
   * @param updates - Partial assessment data containing only fields to update
   * @returns Promise<Assessment> - The updated assessment record
   * 
   * Process:
   * 1. Ensure user is authenticated
   * 2. Add update timestamp and sync status to changes
   * 3. Update document in Appwrite
   * 4. Return updated assessment
   */
  static async updateAssessment(assessmentId: string, updates: Partial<Assessment>): Promise<Assessment> {
    // Ensure user session is valid
    await ensureSession();
    
    // Prepare update data with metadata
    const updateData = {
      ...updates,                             // Spread the update fields
      updated_at: new Date().toISOString(),   // Update the timestamp
      synced: true                            // Mark as synced
    };

    // Update the document in Appwrite
    const response = await databases.updateDocument(
      this.DATABASE_ID,     // Target database
      this.COLLECTION_ID,   // Target collection
      assessmentId,         // Document ID to update
      updateData            // Data to update
    );

    return response as Assessment;
  }

  /**
   * Permanently delete an assessment from the database
   * 
   * @param assessmentId - The unique ID of the assessment to delete
   * @returns Promise<void> - No return value on successful deletion
   * @throws Error if assessment not found or user not authorized
   * 
   * WARNING: This operation is irreversible!
   * 
   * Process:
   * 1. Ensure user is authenticated
   * 2. Delete document from Appwrite database
   */
  static async deleteAssessment(assessmentId: string): Promise<void> {
    // Ensure user session is valid
    await ensureSession();
    
    // Permanently delete the document from Appwrite
    await databases.deleteDocument(
      this.DATABASE_ID,     // Target database
      this.COLLECTION_ID,   // Target collection
      assessmentId          // Document ID to delete
    );
  }

  /**
   * List assessments with pagination and sorting
   * 
   * @param limit - Maximum number of assessments to return (default: 25)
   * @param offset - Number of assessments to skip for pagination (default: 0)
   * @param orderBy - Field to sort by (default: '$createdAt')
   * @param orderType - Sort direction: 'asc' or 'desc' (default: 'desc')
   * @returns Promise<{documents: Assessment[], total: number}> - Paginated results
   * 
   * Process:
   * 1. Ensure user is authenticated
   * 2. Build query with pagination and sorting parameters
   * 3. Fetch documents from Appwrite
   * 4. Return documents array and total count
   * 
   * Usage: For displaying assessments in lists with pagination controls
   */
  static async listAssessments(
    limit: number = 25,
    offset: number = 0,
    orderBy: string = '$createdAt',
    orderType: 'asc' | 'desc' = 'desc'
  ): Promise<{ documents: Assessment[], total: number }> {
    // Ensure user session is valid
    await ensureSession();
    
    // Build query array with pagination and sorting
    const queries = [
      Query.limit(limit),           // Limit number of results
      Query.offset(offset),         // Skip results for pagination
      Query.orderDesc(orderBy)      // Default to descending order
    ];

    // Change to ascending order if requested
    if (orderType === 'asc') {
      queries[queries.length - 1] = Query.orderAsc(orderBy);
    }

    // Execute query against Appwrite database
    const response = await databases.listDocuments(
      this.DATABASE_ID,     // Source database
      this.COLLECTION_ID,   // Source collection
      queries               // Query parameters
    );

    return {
      documents: response.documents as Assessment[],  // Assessment records
      total: response.total                           // Total count for pagination
    };
  }

  /**
   * Search assessments by text in owner details
   * 
   * @param searchTerm - Text to search for in owner details
   * @returns Promise<Assessment[]> - Array of matching assessments
   * 
   * Process:
   * 1. Ensure user is authenticated
   * 2. Build search query targeting owner_details field
   * 3. Execute search with result limit
   * 4. Return matching assessments
   * 
   * Note: Appwrite's search is limited to specific fields.
   * This searches only in 'owner_details' field.
   * For more complex searches, consider implementing client-side filtering.
   */
  static async searchAssessments(searchTerm: string): Promise<Assessment[]> {
    // Ensure user session is valid
    await ensureSession();
    
    // Build search query - Appwrite searches within the specified field
    const queries = [
      Query.search('owner_details', searchTerm),  // Search in owner details field
      Query.limit(100)                            // Limit results to prevent large responses
    ];

    // Execute search query
    const response = await databases.listDocuments(
      this.DATABASE_ID,     // Source database
      this.COLLECTION_ID,   // Source collection
      queries               // Search parameters
    );

    return response.documents as Assessment[];
  }

  /**
   * Get assessments within a specific geographic radius
   * 
   * @param latitude - Center point latitude
   * @param longitude - Center point longitude
   * @param radius - Search radius in meters (default: 1000m = 1km)
   * @returns Promise<Assessment[]> - Assessments within the specified radius
   * 
   * Process:
   * 1. Ensure user is authenticated
   * 2. Fetch all assessments with location data
   * 3. Filter results by calculating distance from center point
   * 4. Return assessments within radius
   * 
   * Note: Uses simple Euclidean distance calculation.
   * For production use, consider implementing Haversine formula
   * for more accurate geographic distance calculations.
   */
  static async getAssessmentsByLocation(
    latitude: number,
    longitude: number,
    radius: number = 1000 // meters
  ): Promise<Assessment[]> {
    // Ensure user session is valid
    await ensureSession();
    
    // Fetch all assessments that have location data
    const response = await databases.listDocuments(
      this.DATABASE_ID,
      this.COLLECTION_ID,
      [
        Query.isNotNull('building_location'),  // Only get assessments with location
        Query.limit(100)                       // Limit to prevent large responses
      ]
    );

    // Client-side filtering by distance (Appwrite doesn't support geo queries yet)
    const assessments = response.documents as Assessment[];
    return assessments.filter(assessment => {
      // Skip assessments without location data
      if (!assessment.building_location) return false;
      
      // Extract coordinates from building_location
      const { latitude: lat, longitude: lng } = assessment.building_location;
      if (!lat || !lng) return false;
      
      // Simple distance calculation (approximate for small distances)
      // For more accuracy, use Haversine formula
      const distance = Math.sqrt(
        Math.pow(latitude - lat, 2) + Math.pow(longitude - lng, 2)
      ) * 111000; // Convert degrees to meters (approximate)
      
      // Return true if within radius
      return distance <= radius;
    });
  }

  /**
   * Bulk synchronization of assessments from local storage to Appwrite
   * 
   * @param localAssessments - Array of assessments from local database
   * @param onProgress - Optional callback for progress updates
   * @returns Promise with sync results and statistics
   * 
   * Process:
   * 1. Ensure user is authenticated
   * 2. Initialize progress tracking
   * 3. Loop through each assessment:
   *    - If assessment has $id: update existing record
   *    - If no $id: create new record
   * 4. Track success/failure for each operation
   * 5. Provide real-time progress updates via callback
   * 6. Return comprehensive sync results
   * 
   * This method is designed for offline-first apps where assessments
   * are created locally and need to be synced to the server.
   */
  static async syncAssessments(
    localAssessments: Assessment[],
    onProgress?: (progress: AssessmentSyncProgress) => void
  ): Promise<{ success: boolean; synced: number; total: number; results: any[] }> {
    // Ensure user session is valid
    await ensureSession();
    
    // Initialize sync tracking variables
    const total = localAssessments.length;
    let synced = 0;
    const results: any[] = [];

    // Notify start of sync process
    onProgress?.({ stage: 'starting', message: `Starting sync of ${total} assessments` });

    // Process each assessment individually
    for (let i = 0; i < localAssessments.length; i++) {
      const assessment = localAssessments[i];
      
      try {
        // Update progress - currently syncing
        onProgress?.({ 
          stage: 'saving_database', 
          current: i + 1, 
          total, 
          message: `Syncing assessment ${i + 1} of ${total}` 
        });

        let result;
        if (assessment.$id) {
          // Assessment has remote ID - update existing record
          result = await this.updateAssessment(assessment.$id, assessment);
        } else {
          // No remote ID - create new record
          result = await this.createAssessment(assessment);
        }

        // Record successful sync
        results.push({ 
          success: true, 
          local_id: assessment.local_id, 
          remote_id: result.$id 
        });
        synced++;
        
        // Update progress - sync completed for this item
        onProgress?.({ 
          stage: 'saving_database', 
          current: i + 1, 
          total, 
          message: `Synced assessment ${i + 1} of ${total}` 
        });
      } catch (error: any) {
        // Record failed sync with error details
        results.push({ 
          success: false, 
          local_id: assessment.local_id, 
          error: error?.message || String(error) 
        });
        
        // Update progress - error occurred
        onProgress?.({ 
          stage: 'error', 
          current: i + 1, 
          total, 
          message: `Failed to sync assessment ${i + 1}: ${error?.message || error}` 
        });
      }
    }

    // Notify completion of sync process
    onProgress?.({ stage: 'completed', message: `Sync completed: ${synced}/${total} assessments` });
    
    // Return comprehensive sync results
    return { success: true, synced, total, results };
  }

  /**
   * Get assessments that need to be synced from local storage
   * 
   * @returns Promise<Assessment[]> - Assessments pending synchronization
   * 
   * This method should be implemented to query your local database
   * for assessments that:
   * - Have synced = false (created/modified locally)
   * - Have been modified since last sync
   * - Failed to sync in previous attempts
   * 
   * Implementation depends on your local storage solution:
   * - SQLite: Query WHERE synced = false OR updated_at > last_sync
   * - AsyncStorage: Filter stored assessments by sync status
   * - Realm: Query unsynced objects
   * 
   * Currently returns empty array as placeholder.
   */
  static async getUnsyncedAssessments(): Promise<Assessment[]> {
    // TODO: Implement based on your local storage solution
    // Example implementations:
    
    // For SQLite:
    // return await db.getAllAsync('SELECT * FROM assessments WHERE synced = 0');
    
    // For AsyncStorage:
    // const stored = await AsyncStorage.getItem('assessments');
    // const assessments = JSON.parse(stored || '[]');
    // return assessments.filter(a => !a.synced);
    
    // Placeholder return
    return [];
  }

  /**
   * Mark a local assessment as successfully synced
   * 
   * @param localId - Local database ID of the assessment
   * @param remoteId - Appwrite document ID received after sync
   * @returns Promise<void>
   * 
   * This method should update your local database to:
   * - Set synced = true
   * - Store the remote ID for future updates
   * - Update last_sync timestamp
   * 
   * Implementation depends on your local storage solution:
   * - SQLite: UPDATE assessments SET synced = 1, remote_id = ? WHERE local_id = ?
   * - AsyncStorage: Update stored assessment object
   * - Realm: Update object properties
   * 
   * This is crucial for preventing duplicate syncs and enabling
   * proper update operations on subsequent syncs.
   */
  static async markAsSynced(localId: string, remoteId: string): Promise<void> {
    // TODO: Implement based on your local storage solution
    // Example implementations:
    
    // For SQLite:
    // await db.runAsync(
    //   'UPDATE assessments SET synced = 1, remote_id = ?, updated_at = ? WHERE local_id = ?',
    //   [remoteId, new Date().toISOString(), localId]
    // );
    
    // For AsyncStorage:
    // const stored = await AsyncStorage.getItem('assessments');
    // const assessments = JSON.parse(stored || '[]');
    // const index = assessments.findIndex(a => a.local_id === localId);
    // if (index !== -1) {
    //   assessments[index].synced = true;
    //   assessments[index].$id = remoteId;
    //   await AsyncStorage.setItem('assessments', JSON.stringify(assessments));
    // }
    
    // Placeholder logging
    console.log(`Marked assessment ${localId} as synced with remote ID ${remoteId}`);
  }

  /**
   * Get comprehensive assessment statistics
   * 
   * @returns Promise with assessment counts and sync information
   * 
   * Process:
   * 1. Ensure user is authenticated
   * 2. Query Appwrite for total remote assessments
   * 3. Calculate sync statistics
   * 4. Return comprehensive stats object
   * 
   * Note: This is a simplified implementation that only shows
   * remote statistics. For complete stats, you would also need to:
   * - Query local database for unsynced count
   * - Track last sync timestamp
   * - Calculate sync success rates
   * - Monitor sync errors
   */
  static async getAssessmentStats(): Promise<{
    total: number;      // Total assessments in remote database
    synced: number;     // Successfully synced assessments
    unsynced: number;   // Assessments pending sync (from local DB)
    lastSync?: string;  // Last successful sync timestamp
  }> {
    // Ensure user session is valid
    await ensureSession();
    
    // Get total count from Appwrite (minimal query for performance)
    const response = await databases.listDocuments(
      this.DATABASE_ID,
      this.COLLECTION_ID,
      [Query.limit(1)]  // We only need the total count, not the documents
    );

    // TODO: For complete statistics, also query local database:
    // const unsyncedCount = await getUnsyncedAssessments().length;
    // const lastSyncTime = await getLastSyncTimestamp();
    
    // Return simplified statistics (remote only)
    return {
      total: response.total,              // Total remote assessments
      synced: response.total,             // Assuming all remote are synced
      unsynced: 0,                        // Would need local DB query
      lastSync: new Date().toISOString()  // Would need to track actual sync times
    };
  }
}
