// lib/parser.ts

/**
 * Safely parses a string that is expected to be JSON.
 * @param jsonString The string to parse.
 * @param fallback The value to return if parsing fails.
 * @returns The parsed object or the fallback value.
 */
function safeJsonParse(jsonString: string | undefined | null, fallback: any = {}) {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn('JSON Parse Error:', e, 'String:', jsonString?.substring(0, 100));
    return fallback;
  }
}

/**
 * Parses a raw assessment document (local or remote) into a fully structured object.
 * This ensures all nested JSON string fields are converted to objects.
 * @param doc The raw assessment document.
 * @returns A fully parsed assessment data object.
 */
export function parseAssessmentData(doc: any): any {
  if (!doc) return null;

  // If the data is already in a `data` property (from local storage), use that.
  const data = doc.data ? doc.data : doc;

  // Parse the main JSON fields
  const parsedLandReference = safeJsonParse(data.land_reference);
  
  // Extract memoranda data from multiple sources for backward compatibility
  const memorandaData = {
    memoranda: data.memorandaContent || 
               parsedLandReference?.memoranda?.memoranda || 
               data.memoranda?.memoranda || 
               ''
  };

  // Extract superseded assessment data from multiple sources
  const supersededData = data.superseded_assessment || 
                         parsedLandReference?.superseded_assessment || 
                         {};
  
  // Build superseded assessment object with individual fields and embedded data
  const supersededAssessment = {
    dateOfEntry: data.supersededDate || supersededData.dateOfEntry || supersededData.date || '',
    pin: data.supersededBy || supersededData.pin || '',
    tdArpNo: supersededData.tdArpNo || '',
    newValue: data.supersededReason || supersededData.newValue || '',
    totalAssessedValue: supersededData.totalAssessedValue || '',
    previousOwner: supersededData.previousOwner || '',
    effectivityOfAssessment: supersededData.effectivityOfAssessment || '',
    date: supersededData.date || data.supersededDate || '',
    recordingPersonnel: supersededData.recordingPersonnel || '',
    assessment: supersededData.assessment || '',
    taxMapping: supersededData.taxMapping || '',
    records: supersededData.records || ''
  };

  return {
    ...data,
    owner_details: safeJsonParse(data.owner_details),
    building_location: safeJsonParse(data.building_location),
    land_reference: parsedLandReference,
    general_description: safeJsonParse(data.general_description),
    structural_materials: safeJsonParse(data.structural_materials),
    property_appraisal: safeJsonParse(data.property_appraisal),
    property_assessment: safeJsonParse(data.property_assessment),
    additionalItems: safeJsonParse(data.additionalItems),
    // Add parsed memoranda and superseded assessment data
    memoranda: memorandaData,
    superseded_assessment: supersededAssessment,
    // Keep individual fields for backward compatibility
    memorandaContent: data.memorandaContent,
    isSuperseded: data.isSuperseded,
    supersededBy: data.supersededBy,
    supersededDate: data.supersededDate,
    supersededReason: data.supersededReason
  };
}
