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

  return {
    ...data,
    owner_details: safeJsonParse(data.owner_details),
    building_location: safeJsonParse(data.building_location),
    land_reference: safeJsonParse(data.land_reference),
    general_description: safeJsonParse(data.general_description),
    structural_materials: safeJsonParse(data.structural_materials),
    property_appraisal: safeJsonParse(data.property_appraisal),
    property_assessment: safeJsonParse(data.property_assessment),
    additionalItems: safeJsonParse(data.additionalItems),
  };
}
