// PropertyAppraisalFormAdapted.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet
} from 'react-native';
import { useFormContext, Controller } from 'react-hook-form';
import { constructionCosts } from './GeneralDescriptionForm';

interface PropertyAppraisal {
  description: string;
  area: string;
  unit_value: string;
  bucc: string;
  baseMarketValue: string;
  depreciation: string;
  depreciationCost: string;
  marketValue: string;
}

const headers: { key: keyof PropertyAppraisal; title: string; minWidth: number }[] = [
  { key: 'description', title: 'Description', minWidth: 200 },
  { key: 'area', title: 'Area', minWidth: 120 },
  { key: 'unit_value', title: 'Unit Value', minWidth: 140 },
  { key: 'bucc', title: '% of BUCC (SMV)', minWidth: 140 },
  { key: 'baseMarketValue', title: 'Base Market Value', minWidth: 160 },
  { key: 'depreciation', title: '%Depn.', minWidth: 120 },
  { key: 'depreciationCost', title: 'Depreciation Cost', minWidth: 160 },
  { key: 'marketValue', title: 'Market Value', minWidth: 160 }
];

const PropertyAppraisalFormAdapted: React.FC = () => {
  const { control, watch } = useFormContext<any>();

  // Get total floor area from general description to auto-populate the area field
  const totalFloorArea = watch('general_description.totalFloorArea');
  const structuralType = watch('general_description.structuralType');
  const kindOfBuilding = watch('general_description.kindOfBuilding');

  // Calculate totals for summary
  const watchedPropertyAppraisal = watch('property_appraisal');

  // property_appraisal may be:
  // - an array of items, OR
  // - an object with a nested `general_description` array, OR
  // - a single object representing one appraisal row (this is what dummy_data uses)
  // Normalize to an array and compute the base path used for Controller names.
  let rows: PropertyAppraisal[] = [];
  let basePath = 'property_appraisal';
  let isSingleObject = false;

  if (Array.isArray(watchedPropertyAppraisal)) {
    rows = watchedPropertyAppraisal as PropertyAppraisal[];
    basePath = 'property_appraisal';
  } else if (watchedPropertyAppraisal && Array.isArray(watchedPropertyAppraisal.general_description)) {
    rows = watchedPropertyAppraisal.general_description as PropertyAppraisal[];
    basePath = 'property_appraisal.general_description';
  } else if (watchedPropertyAppraisal && typeof watchedPropertyAppraisal === 'object' && (watchedPropertyAppraisal.description !== undefined || watchedPropertyAppraisal.area !== undefined)) {
    // single object case: wrap into an array and render controllers without an index
    rows = [watchedPropertyAppraisal as PropertyAppraisal];
    basePath = 'property_appraisal';
    isSingleObject = true;
  } else {
    rows = [];
  }

  const totalBaseMarketValue = rows.reduce((sum: number, item: PropertyAppraisal) => {
    return sum + (parseFloat(String(item.baseMarketValue)) || 0);
  }, 0);

  const totalDepreciationCost = rows.reduce((sum: number, item: PropertyAppraisal) => {
    return sum + (parseFloat(String(item.depreciationCost)) || 0);
  }, 0);

  const totalMarketValue = rows.reduce((sum: number, item: PropertyAppraisal) => {
    return sum + (parseFloat(String(item.marketValue)) || 0);
  }, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Property Appraisal</Text>

      <View style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableInner}>
            {/* Header */}
            <View style={styles.headerRow}>
              {headers.map((h) => (
                <View
                  key={String(h.key)}
                  style={[styles.headerCell, { minWidth: h.minWidth }]}
                >
                  <Text style={styles.headerText}>{h.title}</Text>
                </View>
              ))}
            </View>

            {/* Body - rows controlled by react-hook-form */}
            <View>
              {rows.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No property appraisal data</Text>
                </View>
              ) : (
                rows.map((_row: PropertyAppraisal, rowIndex: number) => (
                  <View key={rowIndex} style={styles.row}>
                    {headers.map((h) => {
                      const controllerName = isSingleObject
                        ? `${basePath}.${String(h.key)}`
                        : `${basePath}.${rowIndex}.${String(h.key)}`;

                      return (
                        <View
                          key={`${rowIndex}-${String(h.key)}`}
                          style={[styles.cell, { minWidth: h.minWidth }]}
                        >
                          <Controller
                            control={control}
                            name={controllerName}
                            render={({ field: { value } }) => {
                              const isAreaColumn = String(h.key) === 'area';
                              const isUnitColumn = String(h.key) === 'unit_value';
                              const isBaseColumn = String(h.key) === 'baseMarketValue';
                              const fieldString = value !== undefined && value !== null ? String(value) : '';

                              let displayValue = fieldString;

                              // Description fallback: structuralType + ' ' + kindOfBuilding
                              if (String(h.key) === 'description' && fieldString.trim() === '') {
                                const struct = structuralType ? String(structuralType) : '';
                                const kind = kindOfBuilding ? String(kindOfBuilding) : '';
                                displayValue = `${struct}${struct && kind ? ' ' : ''}${kind}`.trim();
                              }

                              if (isAreaColumn && fieldString.trim() === '') {
                                displayValue = String(totalFloorArea ?? '');
                              }

                              if (isUnitColumn && fieldString.trim() === '') {
                                const unitCost = constructionCosts[structuralType as string]?.[kindOfBuilding as string];
                                displayValue = unitCost !== undefined && unitCost !== null ? String(unitCost) : fieldString;
                              }

                              // Compute base market value as area * unit_value when requested
                              if (isBaseColumn) {
                                // Build names for area and unit_value for this row
                                const areaName = isSingleObject ? `${basePath}.area` : `${basePath}.${rowIndex}.area`;
                                const unitName = isSingleObject ? `${basePath}.unit_value` : `${basePath}.${rowIndex}.unit_value`;

                                const rawArea = watch(areaName);
                                const rawUnit = watch(unitName);

                                // Determine numeric area: prefer row area, then totalFloorArea
                                let numericArea = parseFloat(String(rawArea ?? '')) || 0;
                                if ((!rawArea || String(rawArea).trim() === '') && totalFloorArea) {
                                  numericArea = parseFloat(String(totalFloorArea)) || numericArea;
                                }

                                // Determine numeric unit: prefer row unit, then constructionCosts lookup
                                let numericUnit = parseFloat(String(rawUnit ?? '')) || 0;
                                if ((!rawUnit || String(rawUnit).trim() === '')) {
                                  const unitCost = constructionCosts[structuralType as string]?.[kindOfBuilding as string];
                                  if (unitCost !== undefined && unitCost !== null) numericUnit = Number(unitCost);
                                }

                                const computed = numericArea * numericUnit;
                                displayValue = computed ? computed.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';
                              }

                              // BUCC (SMV) default/display: show 100% when empty; ensure a '%' suffix
                              if (String(h.key) === 'bucc') {
                                const trimmed = displayValue.trim();
                                if (!trimmed) {
                                  displayValue = '100%';
                                } else if (!trimmed.endsWith('%')) {
                                  displayValue = `${trimmed}%`;
                                }
                              }
                              return (
                                <TextInput
                                  value={displayValue || ''}
                                  style={styles.readOnlyInput}
                                  editable={false}
                                  selectTextOnFocus={false}
                                />
                              );
                            }}
                          />
                        </View>
                      );
                    })}
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Base Market Value:</Text>
          <Text style={styles.summaryValue}>
            ₱{totalBaseMarketValue.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Depreciation Cost:</Text>
          <Text style={styles.summaryValue}>
            ₱{totalDepreciationCost.toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Market Value:</Text>
          <Text style={[styles.summaryValue, styles.totalValue]}>
            ₱{totalMarketValue.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827'
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16
  },
  tableInner: {
    minWidth: 900
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#2563eb'
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#1e40af',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center'
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  emptyRow: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14
  },
  readOnlyInput: {
    width: '100%',
    padding: 6,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669'
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46'
  }
});

export default PropertyAppraisalFormAdapted;