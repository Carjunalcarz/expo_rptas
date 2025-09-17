import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FaasPrintService } from './FaasPrintService';

interface FaasReportProps {
  assessment: any;
}

const FaasReport: React.FC<FaasReportProps> = ({ assessment }) => {
  const ownerDetails = assessment?.owner_details || {};
  const buildingLocation = assessment?.building_location || {};
  const landReference = assessment?.land_reference || {};
  const generalDescription = assessment?.general_description || {};
  const structuralMaterials = assessment?.structural_materials || {};

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };


  const handlePrint = async () => {
    await FaasPrintService.printDocument(assessment);
  };

  const handleSavePDF = async () => {
    await FaasPrintService.savePDF(assessment);
  };

  const renderFormField = (label: string, value: any, width: number | string = '48%') => (
    <View style={[styles.formField, { width: width as any }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <Text style={styles.fieldValue}>{formatValue(value)}</Text>
      </View>
    </View>
  );

  const renderCheckbox = (label: string, checked: boolean) => (
    <View style={styles.checkboxRow}>
      <View style={styles.checkbox}>
        <Text style={styles.checkboxMark}>{checked ? '✓' : ''}</Text>
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Text style={styles.buttonText}>🖨️ Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pdfButton} onPress={handleSavePDF}>
          <Text style={styles.buttonText}>📄 Save PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.republic}>Republic of the Philippines</Text>
            <Text style={styles.province}>Province of _________________</Text>
            <Text style={styles.city}>City/Municipality of _________________</Text>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>FIELD APPRAISAL AND ASSESSMENT SHEET</Text>
            <Text style={styles.subtitle}>(FAAS)</Text>
          </View>
          <View style={styles.headerBottom}>
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Property Index No.: _______________</Text>
              <Text style={styles.headerLabel}>Revision No.: _______________</Text>
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Date: _______________</Text>
              <Text style={styles.headerLabel}>Supersedes PIN: _______________</Text>
            </View>
          </View>
        </View>

        {/* Transaction Code and PIN */}
        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>TD / ARP No.</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.tdArp || ownerDetails.tdArp)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>TRANSACTION CODE</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.transactionCode || ownerDetails.transactionCode)}</Text>
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>PIN</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.pin || ownerDetails.pin)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Owner Details */}
        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>OWNER</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.ownerName || ownerDetails.owner)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>TIN</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(ownerDetails.tin)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>ADDRESS</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(ownerDetails.address)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Tel. No.</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(ownerDetails.telNo)}</Text>
              </View>
            </View>
          </View>
        </View>

        {ownerDetails.hasAdministratorBeneficiary && (
          <>
            <View style={styles.row}>
              <View style={styles.leftColumn}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Administrator/Beneficial User:</Text>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldValue}>{formatValue(ownerDetails.administratorBeneficiary?.name)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.rightColumn}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>TIN</Text>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldValue}>{formatValue(ownerDetails.administratorBeneficiary?.tin)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.leftColumn}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Address:</Text>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldValue}>{formatValue(ownerDetails.administratorBeneficiary?.address)}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.rightColumn}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Tel. No.</Text>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldValue}>{formatValue(ownerDetails.administratorBeneficiary?.telNo)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Building Location */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>BUILDING LOCATION</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.fullWidth}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>No./Street</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(buildingLocation.street)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.thirdColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Barangay</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.barangay || buildingLocation.barangay)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.thirdColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>City</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.municipality || buildingLocation.municipality)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.thirdColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Province</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.province || buildingLocation.province)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Land Reference */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LAND REFERENCE</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Owner:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(landReference.owner)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>OCT/TCT/CLOA/CSC No.:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(landReference.titleNumber)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.thirdColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Lot No.:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(landReference.lotNumber)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.thirdColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Block No.:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(landReference.blockNumber)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.thirdColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Survey No.:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(landReference.surveyNumber)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>TDN/ARP No.</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(landReference.tdnArpNumber)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Area</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(landReference.area)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* General Description */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>GENERAL DESCRIPTION</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Kind of Bldg.</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.kindOfBuilding)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Bldg. Age</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.buildingAge)}</Text>
              </View>
            </View>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>FLOOR PLAN</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>Available</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Structural Type:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.structuralType)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>No. of Storeys:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.numberOfStoreys)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Bldg. Permit No.</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.buildingPermitNo)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            {generalDescription.floorAreas && generalDescription.floorAreas.length > 0 && (
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Area of 1st flr.:</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{formatValue(generalDescription.floorAreas[0]?.area)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Condominium Certificate of Title (CCT)</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.condominiumCCT)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            {generalDescription.floorAreas && generalDescription.floorAreas.length > 1 && (
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Area of 2nd flr.:</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{formatValue(generalDescription.floorAreas[1]?.area)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Certificate of Completion Issued On:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.completionCertificateDate ? new Date(generalDescription.completionCertificateDate).toLocaleDateString() : '')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            {generalDescription.floorAreas && generalDescription.floorAreas.length > 2 && (
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Area of 3rd flr.:</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{formatValue(generalDescription.floorAreas[2]?.area)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Certificate of Occupancy Issued On:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.occupancyCertificateDate ? new Date(generalDescription.occupancyCertificateDate).toLocaleDateString() : '')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            {generalDescription.floorAreas && generalDescription.floorAreas.length > 3 && (
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Area of 4th flr.:</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{formatValue(generalDescription.floorAreas[3]?.area)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date Constructed/Completed:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.dateConstructed ? new Date(generalDescription.dateConstructed).toLocaleDateString() : '')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Total Floor Area</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.totalFloorArea)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Date Occupied:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(generalDescription.dateOccupied ? new Date(generalDescription.dateOccupied).toLocaleDateString() : '')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteText}>
            Note: Attached the building plan/sketch of floor plan. A photograph may also be attached if necessary.
          </Text>
        </View>

        {/* Structural Materials */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>STRUCTURAL MATERIALS (Checklists)</Text>
        </View>

        {/* Foundation, Columns, Beams, Truss Framing Row */}
        <View style={styles.structuralRow}>
          <View style={styles.structuralColumn}>
            <Text style={styles.structuralHeader}>FOUNDATION</Text>
            {renderCheckbox('Reinforced Concrete', structuralMaterials.foundation?.reinforceConcrete)}
            {renderCheckbox('Plain Concrete', structuralMaterials.foundation?.plainConcrete)}
            {renderCheckbox('Others (Specify)', structuralMaterials.foundation?.others)}
            {structuralMaterials.foundation?.othersSpecify && (
              <Text style={styles.specifyText}>{structuralMaterials.foundation.othersSpecify}</Text>
            )}
          </View>

          <View style={styles.structuralColumn}>
            <Text style={styles.structuralHeader}>COLUMNS</Text>
            {renderCheckbox('Steel', structuralMaterials.columns?.steel)}
            {renderCheckbox('Reinforced Concrete', structuralMaterials.columns?.reinforceConcrete)}
            {renderCheckbox('Wood', structuralMaterials.columns?.wood)}
            {renderCheckbox('Others (Specify)', structuralMaterials.columns?.others)}
            {structuralMaterials.columns?.othersSpecify && (
              <Text style={styles.specifyText}>{structuralMaterials.columns.othersSpecify}</Text>
            )}
          </View>

          <View style={styles.structuralColumn}>
            <Text style={styles.structuralHeader}>BEAMS</Text>
            {renderCheckbox('Steel', structuralMaterials.beams?.steel)}
            {renderCheckbox('Reinforced Concrete', structuralMaterials.beams?.reinforceConcrete)}
            {renderCheckbox('Wood', structuralMaterials.beams?.wood)}
            {renderCheckbox('Others (Specify)', structuralMaterials.beams?.others)}
            {structuralMaterials.beams?.othersSpecify && (
              <Text style={styles.specifyText}>{structuralMaterials.beams.othersSpecify}</Text>
            )}
          </View>

          <View style={styles.structuralColumn}>
            <Text style={styles.structuralHeader}>TRUSS FRAMING</Text>
            {renderCheckbox('Steel', structuralMaterials.trussFraming?.steel)}
            {renderCheckbox('Wood', structuralMaterials.trussFraming?.wood)}
            {renderCheckbox('Others (Specify)', structuralMaterials.trussFraming?.others)}
            {structuralMaterials.trussFraming?.othersSpecify && (
              <Text style={styles.specifyText}>{structuralMaterials.trussFraming.othersSpecify}</Text>
            )}
          </View>
        </View>

        {/* Roof, Flooring, Walls & Partitions Row */}
        <View style={styles.structuralRow}>
          <View style={styles.structuralColumn}>
            <Text style={styles.structuralHeader}>ROOF</Text>
            {renderCheckbox('Reinforced Concrete', structuralMaterials.roof?.reinforceConcrete)}
            {renderCheckbox('Tiles', structuralMaterials.roof?.tiles)}
            {renderCheckbox('G.I. Sheet', structuralMaterials.roof?.giSheet)}
            {renderCheckbox('Aluminum', structuralMaterials.roof?.aluminum)}
            {renderCheckbox('Asbestos', structuralMaterials.roof?.asbestos)}
            {renderCheckbox('Long Span', structuralMaterials.roof?.longSpan)}
            {renderCheckbox('Concrete Desk', structuralMaterials.roof?.concreteDesk)}
            {renderCheckbox('Nipa/Anahaw/Cogon', structuralMaterials.roof?.nipaAnahawCogon)}
            {renderCheckbox('Others (Specify)', structuralMaterials.roof?.others)}
            {structuralMaterials.roof?.othersSpecify && (
              <Text style={styles.specifyText}>{structuralMaterials.roof.othersSpecify}</Text>
            )}
          </View>

          <View style={styles.structuralColumn}>
            <Text style={styles.structuralHeader}>FLOORING</Text>
            {structuralMaterials.flooring && structuralMaterials.flooring.map((floor: any, index: number) => (
              <View key={`floor-${floor.id || floor.floorName || index}`} style={styles.floorItem}>
                <Text style={styles.floorName}>{floor.floorName}:</Text>
                <Text style={styles.floorMaterial}>{floor.material}</Text>
                {floor.otherSpecify && (
                  <Text style={styles.specifyText}>{floor.otherSpecify}</Text>
                )}
              </View>
            ))}

            <View style={styles.floorPlanGrid}>
              <Text style={styles.floorPlanHeader}>1st Flr</Text>
              <Text style={styles.floorPlanHeader}>2nd Flr</Text>
              <Text style={styles.floorPlanHeader}>3rd Flr</Text>
              <Text style={styles.floorPlanHeader}>4th Flr</Text>
            </View>
          </View>

          <View style={styles.structuralColumn}>
            <Text style={styles.structuralHeader}>Walls & Partitions</Text>
            {structuralMaterials.wallsPartitions && structuralMaterials.wallsPartitions.map((wall: any, index: number) => (
              <View key={`wall-${wall.id || wall.wallName || index}`} style={styles.wallItem}>
                <Text style={styles.wallName}>{wall.wallName}:</Text>
                <Text style={styles.wallMaterial}>{wall.material}</Text>
                {wall.otherSpecify && (
                  <Text style={styles.specifyText}>{wall.otherSpecify}</Text>
                )}
              </View>
            ))}

            <View style={styles.floorPlanGrid}>
              <Text style={styles.floorPlanHeader}>1st Flr</Text>
              <Text style={styles.floorPlanHeader}>2nd Flr</Text>
              <Text style={styles.floorPlanHeader}>3rd Flr</Text>
              <Text style={styles.floorPlanHeader}>4th Flr</Text>
            </View>
          </View>
        </View>

        {/* Page Break Indicator */}
        <View style={styles.pageBreakIndicator}>
          <View style={styles.pageBreakLine} />
          <Text style={styles.pageBreakText}>PAGE 2</Text>
          <View style={styles.pageBreakLine} />
        </View>

        {/* Property Appraisal */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PROPERTY APPRAISAL</Text>
        </View>

        {/* Description */}
        {assessment.property_appraisal?.description && assessment.property_appraisal.description.length > 0 && (
          <View style={styles.row}>
            <View style={styles.leftColumn}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Kind of Building:</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{formatValue(assessment.property_appraisal.description[0]?.kindOfBuilding)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.rightColumn}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Structural Type:</Text>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldValue}>{formatValue(assessment.property_appraisal.description[0]?.structuralType)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Area and Unit Value */}
        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Area (sq.m):</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.property_appraisal?.area)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Unit Value:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>₱{formatValue(assessment.property_appraisal?.unit_value?.toLocaleString())}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* BUCC and Base Market Value */}
        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>BUCC:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.property_appraisal?.bucc)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Base Market Value:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>₱{formatValue(assessment.property_appraisal?.baseMarketValue?.toLocaleString())}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Depreciation Details */}
        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Depreciation:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.property_appraisal?.depreciation)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Depreciation Cost:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>₱{formatValue(assessment.property_appraisal?.depreciationCost?.toLocaleString())}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Market Value */}
        <View style={styles.row}>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Market Value:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>₱{formatValue(assessment.property_appraisal?.marketValue?.toLocaleString())}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Items */}
        {assessment.additionalItems && assessment.additionalItems.items && assessment.additionalItems.items.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ADDITIONAL ITEMS</Text>
            </View>
            {assessment.additionalItems.items.map((item: any, index: number) => (
              <View key={`faas-additional-${index}-${item.id || 'no-id'}-${item.label?.replace(/\s+/g, '-') || 'no-label'}`} style={styles.row}>
                <View style={styles.leftColumn}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>{item.label}:</Text>
                    <View style={styles.fieldBox}>
                      <Text style={styles.fieldValue}>Qty: {item.quantity}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rightColumn}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Amount:</Text>
                    <View style={styles.fieldBox}>
                      <Text style={styles.fieldValue}>₱{formatValue(item.amount?.toLocaleString())}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            <View style={styles.row}>
              <View style={styles.rightColumn}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Total Additional:</Text>
                  <View style={styles.fieldBox}>
                    <Text style={styles.fieldValue}>₱{formatValue(assessment.additionalItems.total?.toLocaleString())}</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Property Assessment Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PROPERTY ASSESSMENT</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Market Value:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>₱{formatValue(assessment.property_assessment?.market_value?.toLocaleString())}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Assessment Value:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>₱{formatValue(assessment.property_assessment?.assessment_value?.toLocaleString())}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Building Category:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.property_assessment?.building_category)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Assessment Level:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.property_assessment?.assessment_level)}%</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Total Area:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.property_assessment?.total_area)} sq.m</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Taxable:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{assessment.property_assessment?.taxable ? 'Yes' : 'No'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.leftColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Effective Year:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.property_assessment?.eff_year)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Effective Quarter:</Text>
              <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(assessment.property_assessment?.eff_quarter)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default FaasReport;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  page: {
    width: 794, // A4 width at 96 DPI (210mm)
    backgroundColor: "#fff",
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSection: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  mainTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
    backgroundColor: "#4472C4",
    padding: 8,
    marginBottom: 2,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    color: "#fff",
    backgroundColor: "#4472C4",
    padding: 6,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  leftColumn: {
    flex: 2,
    marginRight: 8,
  },
  rightColumn: {
    flex: 1,
  },
  fullWidth: {
    flex: 1,
  },
  thirdColumn: {
    flex: 1,
    marginRight: 4,
  },
  formField: {
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
  },
  fieldBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 4,
    minHeight: 20,
    backgroundColor: "#fff",
  },
  fieldValue: {
    fontSize: 9,
    color: "#000",
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
    backgroundColor: "#D9D9D9",
    padding: 4,
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  noteSection: {
    marginTop: 12,
    marginBottom: 12,
    padding: 6,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  noteText: {
    fontSize: 8,
    color: "#000",
    fontStyle: "italic",
  },
  structuralRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  structuralColumn: {
    flex: 1,
    marginRight: 4,
    borderWidth: 1,
    borderColor: "#000",
    padding: 6,
    backgroundColor: "#fff",
  },
  structuralHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    backgroundColor: "#D9D9D9",
    padding: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#000",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxMark: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000",
  },
  checkboxLabel: {
    fontSize: 7,
    color: "#000",
    flex: 1,
  },
  specifyText: {
    fontSize: 7,
    color: "#000",
    fontStyle: "italic",
    marginLeft: 16,
    marginTop: 2,
  },
  floorPlanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  floorPlanHeader: {
    width: '25%',
    textAlign: 'center',
    fontSize: 8,
    fontWeight: 'bold',
    padding: 2,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  floorItem: {
    marginBottom: 4,
  },
  floorName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
  floorMaterial: {
    fontSize: 8,
    color: '#000',
    marginLeft: 4,
  },
  wallItem: {
    marginBottom: 4,
  },
  wallName: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
  },
  wallMaterial: {
    fontSize: 8,
    color: '#000',
    marginLeft: 4,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 10,
  },
  republic: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  province: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 2,
  },
  city: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 5,
  },
  headerCenter: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerBottom: {
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  headerLabel: {
    fontSize: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 15,
  },
  printButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pdfButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pageBreakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 10,
  },
  pageBreakLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  pageBreakText: {
    marginHorizontal: 15,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
});
