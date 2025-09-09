import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
} from 'react-native';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { constructionCosts } from './GeneralDescriptionForm';
import { PRIMARY_COLOR } from '../constants/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Description {
  kindOfBuilding: string;
  structuralType: string;
}
interface PropertyAppraisalData {
  description: Description[];
  area: string;
  unit_value: string;
  bucc: string;
  baseMarketValue: string;
  depreciation: string;
  depreciationCost: string;
  marketValue: string;
}

const headers: { key: keyof PropertyAppraisalData; title: string; minWidth: number }[] = [
  { key: 'description', title: 'Description', minWidth: 200 },
  { key: 'area', title: 'Area', minWidth: 120 },
  { key: 'unit_value', title: 'Unit Value', minWidth: 140 },
  { key: 'bucc', title: '% of BUCC (SMV)', minWidth: 140 },
  { key: 'baseMarketValue', title: 'Base Market Value', minWidth: 160 },
  { key: 'depreciation', title: '%Depn.', minWidth: 120 },
  { key: 'depreciationCost', title: 'Depreciation Cost', minWidth: 160 },
  { key: 'marketValue', title: 'Market Value', minWidth: 160 }
];

const PropertyAppraisalForm: React.FC = () => {
  const { control, watch, setValue } = useFormContext<any>();

  // Subscribe to these fields so changes trigger recomputation
  const totalFloorArea = useWatch({ control, name: 'general_description.totalFloorArea' });
  const structuralType = useWatch({ control, name: 'general_description.structuralType' });
  const kindOfBuilding = useWatch({ control, name: 'general_description.kindOfBuilding' });

  // Calculate totals for summary - subscribe to property_appraisal changes
  const watchedPropertyAppraisal = useWatch({ control, name: 'property_appraisal' });

  // property_appraisal may be:
  // - an array of items, OR
  // - an object with a nested `general_description` array, OR
  // - a single object representing one appraisal row (this is what dummy_data uses)
  // Normalize to an array and compute the base path used for Controller names.
  let rows: PropertyAppraisalData[] = [];
  let basePath = 'property_appraisal';
  let isSingleObject = false;

  if (Array.isArray(watchedPropertyAppraisal)) {
    rows = watchedPropertyAppraisal as PropertyAppraisalData[];
    basePath = 'property_appraisal';
  } else if (watchedPropertyAppraisal && Array.isArray(watchedPropertyAppraisal.general_description)) {
    rows = watchedPropertyAppraisal.general_description as PropertyAppraisalData[];
    basePath = 'property_appraisal.general_description';
  } else if (watchedPropertyAppraisal && typeof watchedPropertyAppraisal === 'object' && (watchedPropertyAppraisal.description !== undefined || watchedPropertyAppraisal.area !== undefined)) {
    // single object case: wrap into an array and render controllers without an index
    rows = [watchedPropertyAppraisal as PropertyAppraisalData];
    basePath = 'property_appraisal';
    isSingleObject = true;
  } else {
    rows = [];
  }

  // Persist computed and fallback values into form state for each row inside effect to avoid setState-in-render
  const prevRef = React.useRef({ totalFloorArea, structuralType, kindOfBuilding });

  React.useEffect(() => {
    // collect current values and compute desired ones, then call setValue only when different
    // effect triggered
    const descChanged = prevRef.current.structuralType !== structuralType || prevRef.current.kindOfBuilding !== kindOfBuilding;
    const areaChanged = prevRef.current.totalFloorArea !== totalFloorArea;
    rows.forEach((r, idx) => {
      // processing row
      const descriptionName = isSingleObject ? `${basePath}.description` : `${basePath}.${idx}.description`;
      const curDesc = watch(descriptionName);
      const desiredDesc = [{ kindOfBuilding: String(kindOfBuilding || ''), structuralType: String(structuralType || '') }];
      const descDifferent = (() => {
        if (!curDesc) return true;
        try {
          if (Array.isArray(curDesc)) {
            const first = curDesc[0] || {};
            return (String(first.kindOfBuilding || '') !== String(desiredDesc[0].kindOfBuilding)) || (String(first.structuralType || '') !== String(desiredDesc[0].structuralType));
          }
          return true;
        } catch (e) {
          return true;
        }
      })();
      if (descDifferent) {
        setValue(descriptionName, desiredDesc);
      }

      const areaName = isSingleObject ? `${basePath}.area` : `${basePath}.${idx}.area`;
      const unitName = isSingleObject ? `${basePath}.unit_value` : `${basePath}.${idx}.unit_value`;
      const buccName = isSingleObject ? `${basePath}.bucc` : `${basePath}.${idx}.bucc`;
      const baseName = isSingleObject ? `${basePath}.baseMarketValue` : `${basePath}.${idx}.baseMarketValue`;
      const depName = isSingleObject ? `${basePath}.depreciation` : `${basePath}.${idx}.depreciation`;
      const depCostName = isSingleObject ? `${basePath}.depreciationCost` : `${basePath}.${idx}.depreciationCost`;
      const marketName = isSingleObject ? `${basePath}.marketValue` : `${basePath}.${idx}.marketValue`;

      const curArea = watch(areaName);
      const curUnit = watch(unitName);
      const curBucc = watch(buccName);
      const curDep = watch(depName);
      const curBase = watch(baseName);
      const curDepCost = watch(depCostName);
      const curMarket = watch(marketName);

      // fallback area: update when empty OR when totalFloorArea changed and current equals previous fallback
      let desiredArea = curArea;
      const prevAreaFallback = prevRef.current.totalFloorArea ? String(prevRef.current.totalFloorArea) : '';
      if (totalFloorArea) {
        if ((!curArea || String(curArea).trim() === '') || (areaChanged && (String(curArea || '') === prevAreaFallback))) {
          desiredArea = String(totalFloorArea);
        }
      }
      if (desiredArea !== curArea && desiredArea !== undefined) {
        setValue(areaName, desiredArea);
      }

      // fallback unit: update when empty OR when description changed
      let desiredUnit = curUnit;
      const lookupUnit = constructionCosts[structuralType as string]?.[kindOfBuilding as string];
      if (descChanged) {
        if (lookupUnit !== undefined && lookupUnit !== null) {
          desiredUnit = String(lookupUnit);
        }
      } else if ((!curUnit || String(curUnit).trim() === '')) {
        if (lookupUnit !== undefined && lookupUnit !== null) desiredUnit = String(lookupUnit);
      }
      if (desiredUnit !== curUnit && desiredUnit !== undefined) {
        setValue(unitName, desiredUnit);
      }

      // Persist BUCC
      let desiredBucc = curBucc;
      if (!curBucc || String(curBucc).trim() === '') desiredBucc = '100%';
      else if (!String(curBucc).trim().endsWith('%')) desiredBucc = `${String(curBucc).trim()}%`;
      if (desiredBucc !== curBucc && desiredBucc !== undefined) {
        setValue(buccName, desiredBucc);
      }

      // Persist Depreciation
      let desiredDep = curDep;
      if (!curDep || String(curDep).trim() === '') desiredDep = '12%';
      else if (!String(curDep).trim().endsWith('%')) desiredDep = `${String(curDep).trim()}%`;
      if (desiredDep !== curDep && desiredDep !== undefined) {
        setValue(depName, desiredDep);
      }

      // compute numerics
      const numericArea = parseFloat(String(desiredArea ?? curArea ?? '')) || 0;
      const numericUnit = parseFloat(String(desiredUnit ?? curUnit ?? '')) || 0;

      const computedBase = numericArea * numericUnit;
      const baseStr = String(Math.round((computedBase + Number.EPSILON) * 100) / 100);
      if (baseStr !== String(curBase ?? '')) {
        setValue(baseName, baseStr);
      }

      // depreciation percent
      let depPercent = 12;
      if (curDep !== undefined && curDep !== null && String(curDep).trim() !== '') {
        const cleaned = String(curDep).trim().endsWith('%') ? String(curDep).trim().slice(0, -1) : String(curDep).trim();
        const parsed = parseFloat(cleaned);
        if (!Number.isNaN(parsed)) depPercent = parsed;
      }

      const computedDepCost = computedBase * (depPercent / 100);
      const depCostStr = String(Math.round((computedDepCost + Number.EPSILON) * 100) / 100);
      if (depCostStr !== String(curDepCost ?? '')) {
        setValue(depCostName, depCostStr);
      }

      const computedMarket = computedBase - computedDepCost;
      const marketStr = String(Math.round((computedMarket + Number.EPSILON) * 100) / 100);
      if (marketStr !== String(curMarket ?? '')) {
        setValue(marketName, marketStr);
      }
    });
    // update prevRef for next run
    prevRef.current = { totalFloorArea, structuralType, kindOfBuilding };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedPropertyAppraisal, totalFloorArea, structuralType, kindOfBuilding]);

  const totalBaseMarketValue = rows.reduce((sum: number, item: PropertyAppraisalData) => {
    return sum + (parseFloat(String(item.baseMarketValue)) || 0);
  }, 0);

  const totalDepreciationCost = rows.reduce((sum: number, item: PropertyAppraisalData) => {
    return sum + (parseFloat(String(item.depreciationCost)) || 0);
  }, 0);

  const totalMarketValue = rows.reduce((sum: number, item: PropertyAppraisalData) => {
    return sum + (parseFloat(String(item.marketValue)) || 0);
  }, 0);

  // Focused effect: ensure area and unit_value update immediately when general_description changes
  React.useEffect(() => {
    try {
      if (!rows || rows.length === 0) return;
      rows.forEach((r, idx) => {
        const areaName = isSingleObject ? `${basePath}.area` : `${basePath}.${idx}.area`;
        const unitName = isSingleObject ? `${basePath}.unit_value` : `${basePath}.${idx}.unit_value`;

        const curArea = watch(areaName);
        const curUnit = watch(unitName);

        const prevAreaFallback = prevRef.current.totalFloorArea ? String(prevRef.current.totalFloorArea) : '';
        if (totalFloorArea) {
          if ((!curArea || String(curArea).trim() === '') || String(curArea || '') === prevAreaFallback) {
            const desired = String(totalFloorArea);
            if (desired !== curArea) {
              setValue(areaName, desired);
            }
          }
        }

        const lookupUnit = constructionCosts[structuralType as string]?.[kindOfBuilding as string];
        if (lookupUnit !== undefined && lookupUnit !== null) {
          // if unit empty or description changed, set it
          const descChanged = prevRef.current.structuralType !== structuralType || prevRef.current.kindOfBuilding !== kindOfBuilding;
          if ((!curUnit || String(curUnit).trim() === '') || descChanged) {
            const desiredUnit = String(lookupUnit);
            if (desiredUnit !== curUnit) setValue(unitName, desiredUnit);
          }
        }
      });
    } catch (e) {
      console.debug('[PropertyAppraisalForm] focused effect error', e);
    }
  }, [totalFloorArea, structuralType, kindOfBuilding, watchedPropertyAppraisal]);

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <View className="flex-row items-center justify-between mb-4 p-3 bg-blue-100 rounded-lg border-l-4" style={{ borderLeftColor: PRIMARY_COLOR }}>
        <Text className="text-lg font-bold" style={{ color: PRIMARY_COLOR }}>PROPERTY APPRAISAL</Text>
        <Icon name="assessment" size={24} style={{ color: PRIMARY_COLOR }} />
      </View>

      <View className="bg-white rounded-lg overflow-hidden mb-4 shadow-sm">
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View className="min-w-[900px]">
            {/* Header */}
            <View className="flex-row" style={{ backgroundColor: PRIMARY_COLOR }}>
              {headers.map((h) => (
                <View
                  key={String(h.key)}
                  className="py-3 px-2 items-center justify-center"
                  style={{ minWidth: h.minWidth }}
                >
                  <Text className="text-white font-semibold text-center">{h.title}</Text>
                </View>
              ))}
            </View>

            {/* Body - rows controlled by react-hook-form */}
            <View>
              {rows.length === 0 ? (
                <View className="py-6 items-center justify-center">
                  <Text className="text-gray-500">No property appraisal data</Text>
                </View>
              ) : (
                rows.map((_row: PropertyAppraisalData, rowIndex: number) => (
                  <View key={rowIndex} className="flex-row">
                    {headers.map((h) => {
                      const controllerName = isSingleObject
                        ? `${basePath}.${String(h.key)}`
                        : `${basePath}.${rowIndex}.${String(h.key)}`;

                      return (
                        <View
                          key={`${rowIndex}-${String(h.key)}`}
                          className="py-2 px-2 items-center justify-center flex-shrink-0"
                          style={{ minWidth: h.minWidth }}
                        >
                          <Controller
                            control={control}
                            name={controllerName}
                            render={({ field: { value } }) => {
                              const isAreaColumn = String(h.key) === 'area';
                              const isUnitColumn = String(h.key) === 'unit_value';
                              const isBaseColumn = String(h.key) === 'baseMarketValue';
                              const isDepCostColumn = String(h.key) === 'depreciationCost';
                              const isMarketColumn = String(h.key) === 'marketValue';
                              // description may be an array of Description objects per your shape.
                              let fieldString = '';
                              if (Array.isArray(value)) {
                                const first = value[0];
                                if (first) {
                                  const struct = first.structuralType ? String(first.structuralType) : '';
                                  const kind = first.kindOfBuilding ? String(first.kindOfBuilding) : '';
                                  fieldString = `${struct}${struct && kind ? ' ' : ''}${kind}`.trim();
                                } else {
                                  fieldString = '';
                                }
                              } else {
                                fieldString = value !== undefined && value !== null ? String(value) : '';
                              }

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
                                // If depreciation cost column is requested, compute below (we still set base here)
                                // but depreciationCost handling occurs after base computation.
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

                              // Depreciation default/display: show 12% when empty; ensure a '%' suffix
                              if (String(h.key) === 'depreciation') {
                                const trimmed = displayValue.trim();
                                if (!trimmed) {
                                  displayValue = '12%';
                                } else if (!trimmed.endsWith('%')) {
                                  displayValue = `${trimmed}%`;
                                }
                              }

                              // Depreciation Cost: compute as baseMarketValue * depreciation%
                              if (isDepCostColumn) {
                                // Build names for area, unit and depreciation for this row
                                const areaName = isSingleObject ? `${basePath}.area` : `${basePath}.${rowIndex}.area`;
                                const unitName = isSingleObject ? `${basePath}.unit_value` : `${basePath}.${rowIndex}.unit_value`;
                                const depName = isSingleObject ? `${basePath}.depreciation` : `${basePath}.${rowIndex}.depreciation`;

                                const rawArea = watch(areaName);
                                const rawUnit = watch(unitName);
                                const rawDep = watch(depName);

                                let numericArea = parseFloat(String(rawArea ?? '')) || 0;
                                if ((!rawArea || String(rawArea).trim() === '') && totalFloorArea) {
                                  numericArea = parseFloat(String(totalFloorArea)) || numericArea;
                                }

                                let numericUnit = parseFloat(String(rawUnit ?? '')) || 0;
                                if ((!rawUnit || String(rawUnit).trim() === '')) {
                                  const unitCost = constructionCosts[structuralType as string]?.[kindOfBuilding as string];
                                  if (unitCost !== undefined && unitCost !== null) numericUnit = Number(unitCost);
                                }

                                // parse depreciation percent (e.g. '12%' or '12')
                                let depPercent = 12;
                                if (rawDep !== undefined && rawDep !== null) {
                                  const depStr = String(rawDep).trim();
                                  if (depStr !== '') {
                                    const cleaned = depStr.endsWith('%') ? depStr.slice(0, -1) : depStr;
                                    const parsed = parseFloat(cleaned);
                                    if (!Number.isNaN(parsed)) depPercent = parsed;
                                  }
                                }

                                const base = numericArea * numericUnit;
                                const depCost = base * (depPercent / 100);
                                displayValue = depCost ? depCost.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';
                              }

                              // Market Value: baseMarketValue - depreciationCost
                              if (isMarketColumn) {
                                const areaName = isSingleObject ? `${basePath}.area` : `${basePath}.${rowIndex}.area`;
                                const unitName = isSingleObject ? `${basePath}.unit_value` : `${basePath}.${rowIndex}.unit_value`;
                                const depName = isSingleObject ? `${basePath}.depreciation` : `${basePath}.${rowIndex}.depreciation`;

                                const rawArea = watch(areaName);
                                const rawUnit = watch(unitName);
                                const rawDep = watch(depName);

                                let numericArea = parseFloat(String(rawArea ?? '')) || 0;
                                if ((!rawArea || String(rawArea).trim() === '') && totalFloorArea) {
                                  numericArea = parseFloat(String(totalFloorArea)) || numericArea;
                                }

                                let numericUnit = parseFloat(String(rawUnit ?? '')) || 0;
                                if ((!rawUnit || String(rawUnit).trim() === '')) {
                                  const unitCost = constructionCosts[structuralType as string]?.[kindOfBuilding as string];
                                  if (unitCost !== undefined && unitCost !== null) numericUnit = Number(unitCost);
                                }

                                let depPercent = 12;
                                if (rawDep !== undefined && rawDep !== null) {
                                  const depStr = String(rawDep).trim();
                                  if (depStr !== '') {
                                    const cleaned = depStr.endsWith('%') ? depStr.slice(0, -1) : depStr;
                                    const parsed = parseFloat(cleaned);
                                    if (!Number.isNaN(parsed)) depPercent = parsed;
                                  }
                                }

                                const base = numericArea * numericUnit;
                                const depCost = base * (depPercent / 100);
                                const market = base - depCost;
                                displayValue = market ? market.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';
                              }
                              return (
                                <TextInput
                                  value={displayValue || ''}
                                  className="w-full p-1 text-sm text-gray-500 text-center bg-gray-50 border border-gray-200 rounded"
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
      <View className="bg-white p-4 rounded-lg border border-gray-200">
        <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
          <Text className="text-sm font-semibold text-gray-700">Total Base Market Value:</Text>
          <Text className="text-sm font-semibold text-green-600">
            ₱{totalBaseMarketValue.toLocaleString()}
          </Text>
        </View>
        <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
          <Text className="text-sm font-semibold text-gray-700">Total Depreciation Cost:</Text>
          <Text className="text-sm font-semibold text-green-600">
            ₱{totalDepreciationCost.toLocaleString()}
          </Text>
        </View>
        <View className="flex-row justify-between items-center py-2">
          <Text className="text-sm font-semibold text-gray-700">Total Market Value:</Text>
          <Text className="text-base font-bold text-green-700">
            ₱{totalMarketValue.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PropertyAppraisalForm;