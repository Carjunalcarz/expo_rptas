import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { FaasPrintService } from './FaasPrintService';
import images from '@/constants/images';

interface FaasReportProps {
    assessment: any;
}

const FaasReport: React.FC<FaasReportProps> = ({ assessment }) => {
    const ownerDetails = assessment?.owner_details || {};
    const buildingLocation = assessment?.building_location || {};
    const landReference = assessment?.land_reference || {};
    const generalDescription = assessment?.general_description || {};
    const structuralMaterials = assessment?.structural_materials || {};
    const propertyAssessment = assessment?.property_assessment || {};
    const propertyAppraisal = assessment?.property_appraisal || {};

    const formatValue = (value: any) => {
        if (value === null || value === undefined || value === '') return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    const formatCurrency = (value: any) => {
        if (value === null || value === undefined || value === '') return '';
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : Number(value);
        if (isNaN(numValue)) return String(value);
        return `PHP ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handlePrint = async () => {
        await FaasPrintService.printDocument(assessment);
    };

    const handleSavePDF = async () => {
        await FaasPrintService.savePDF(assessment);
    };


    const renderFormField = (label: string, value: any, fullWidth: boolean = false) => (
        <View style={[styles.formField, fullWidth && styles.fullWidthField]}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <View style={styles.fieldBox}>
                <Text style={styles.fieldValue}>{formatValue(value)}</Text>
            </View>
        </View>
    );

    const renderMobileRow = (fields: Array<{ label: string, value: any, fullWidth?: boolean }>) => (
        <View style={styles.mobileRow}>
            {fields.map((field, index) => (
                <View key={index} style={field.fullWidth ? styles.fullWidthField : styles.halfWidthField}>
                    {renderFormField(field.label, field.value, field.fullWidth)}
                </View>
            ))}
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
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
            >

                {/* Report Content */}
                <View style={styles.reportContent}>
                    {/* Official Header */}
                    <View style={styles.officialHeader}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={images.pganLogo}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={styles.headerCenter}>
                            <Text style={styles.republic}>REPUBLIC OF THE PHILIPPINES</Text>
                            <Text style={styles.province}>Province of Agusan del Norte</Text>
                            <Text style={styles.title}>FIELD APPRAISAL AND ASSESSMENT SHEET</Text>
                            <Text style={styles.subtitle}>(FAAS)</Text>
                        </View>
                        <View style={styles.documentInfo}>
                            <Text style={styles.docNumber}>Document No.: FAAS-{Math.floor(Math.random() * 9000) + 1000}</Text>
                            <Text style={styles.series}>Series of {new Date().getFullYear()}</Text>
                            <View style={styles.classification}>
                                <Text style={styles.classificationText}>OFFICIAL</Text>
                            </View>
                        </View>
                    </View>

                    {/* Property Index and Assessment Info */}
                    <View style={styles.propertyIndexSection}>
                        <View style={styles.row}>
                            {renderFormField('Property Index No.', '')}
                            {renderFormField('Revision No.', '')}
                        </View>
                        <View style={styles.row}>
                            {renderFormField('Assessment Date', '')}
                            {renderFormField('Supersedes PIN', '')}
                        </View>
                    </View>

                    {/* TD/ARP and Transaction Code */}
                    <View style={styles.section}>
                        <View style={styles.row}>
                            {renderFormField('TD / ARP No.', ownerDetails.tdArp || assessment.tdArp)}
                            {renderFormField('TRANSACTION CODE', ownerDetails.transactionCode || assessment.transactionCode)}
                        </View>
                        {renderFormField('PIN', ownerDetails.pin || assessment.pin, true)}
                    </View>

                    {/* Owner Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>OWNER</Text>
                        <View style={styles.row}>
                            {renderFormField('OWNER', ownerDetails.owner)}
                            {renderFormField('TIN', ownerDetails.tin)}
                        </View>
                        <View style={styles.row}>
                            {renderFormField('ADDRESS', ownerDetails.address)}
                            {renderFormField('Tel. No.', ownerDetails.telNo)}
                        </View>
                    </View>

                    {/* Administrator/Beneficiary (if applicable) */}
                    {ownerDetails.hasAdministratorBeneficiary && ownerDetails.administratorBeneficiary && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>ADMINISTRATOR/BENEFICIARY</Text>
                            <View style={styles.row}>
                                {renderFormField('NAME', ownerDetails.administratorBeneficiary.name)}
                                {renderFormField('TIN', ownerDetails.administratorBeneficiary.tin)}
                            </View>
                            <View style={styles.row}>
                                {renderFormField('ADDRESS', ownerDetails.administratorBeneficiary.address)}
                                {renderFormField('Tel. No.', ownerDetails.administratorBeneficiary.telNo)}
                            </View>
                        </View>
                    )}

                    {/* Building Location */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>BUILDING LOCATION</Text>
                        {renderFormField('No./Street', buildingLocation.street, true)}
                        <View style={styles.row}>
                            {renderFormField('Barangay', buildingLocation.barangay)}
                            {renderFormField('City/Municipality', buildingLocation.municipality)}
                        </View>
                        {renderFormField('Province', buildingLocation.province, true)}
                    </View>

                    {/* Land Reference */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>LAND REFERENCE</Text>
                        <View style={styles.row}>
                            {renderFormField('Owner:', landReference.owner)}
                            {renderFormField('OCT/TCT/CLOA/CSC No.:', landReference.titleNumber)}
                        </View>
                        <View style={styles.row}>
                            {renderFormField('Lot No.:', landReference.lotNumber)}
                            {renderFormField('Block No.:', landReference.blockNumber)}
                        </View>
                        <View style={styles.row}>
                            {renderFormField('Survey No.:', landReference.surveyNumber)}
                            {renderFormField('TDN/ARP No.:', landReference.tdnArpNumber)}
                        </View>
                        {renderFormField('Area:', landReference.area ? `${landReference.area} sq.m` : '', true)}
                    </View>

                    {/* General Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>GENERAL DESCRIPTION</Text>
                        <View style={styles.row}>
                            {renderFormField('Kind of Bldg.', generalDescription.kindOfBuilding)}
                            {renderFormField('Bldg. Age', generalDescription.buildingAge ? `${generalDescription.buildingAge} years` : '')}
                        </View>
                        <View style={styles.row}>
                            {renderFormField('Structural Type', generalDescription.structuralType)}
                            {renderFormField('No. of Storeys:', generalDescription.numberOfStoreys)}
                        </View>
                        <View style={styles.row}>
                            {renderFormField('Bldg. Permit No.', generalDescription.buildingPermitNo)}
                            {renderFormField('Total Floor Area', generalDescription.totalFloorArea ? `${generalDescription.totalFloorArea} sq.m` : '')}
                        </View>
                        <View style={styles.row}>
                            {renderFormField('Date Constructed', generalDescription.dateConstructed ? new Date(generalDescription.dateConstructed).toLocaleDateString() : '')}
                            {renderFormField('Date Occupied', generalDescription.dateOccupied ? new Date(generalDescription.dateOccupied).toLocaleDateString() : '')}
                        </View>
                        <View style={styles.row}>
                            {renderFormField('Condominium CCT', generalDescription.condominiumCCT)}
                            {renderFormField('Unit Value', generalDescription.unit_value ? `PHP ${Number(generalDescription.unit_value).toLocaleString()}` : '')}
                        </View>
                    </View>

                    {/* Note */}
                    <View style={styles.noteSection}>
                        <Text style={styles.noteText}>
                            Note: Attached the building plan/sketch of floor plan. A photograph may also be attached if necessary.
                        </Text>
                    </View>

                    {/* Structural Materials */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>STRUCTURAL MATERIALS (Checklists)</Text>
                        
                        {/* Foundation */}
                        <View style={styles.mobileCheckboxSection}>
                            <Text style={styles.checkboxColumnTitle}>FOUNDATION</Text>
                            {Object.entries(structuralMaterials.foundation || {}).map(([key, value], index) =>
                                <View key={`foundation-${key}-${index}`}>
                                    {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value as boolean)}
                                </View>
                            )}
                        </View>

                        {/* Columns */}
                        <View style={styles.mobileCheckboxSection}>
                            <Text style={styles.checkboxColumnTitle}>COLUMNS</Text>
                            {Object.entries(structuralMaterials.columns || {}).map(([key, value], index) =>
                                <View key={`columns-${key}-${index}`}>
                                    {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value as boolean)}
                                </View>
                            )}
                        </View>

                        {/* Beams */}
                        <View style={styles.mobileCheckboxSection}>
                            <Text style={styles.checkboxColumnTitle}>BEAMS</Text>
                            {Object.entries(structuralMaterials.beams || {}).map(([key, value], index) =>
                                <View key={`beams-${key}-${index}`}>
                                    {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value as boolean)}
                                </View>
                            )}
                        </View>

                        {/* Truss Framing */}
                        <View style={styles.mobileCheckboxSection}>
                            <Text style={styles.checkboxColumnTitle}>TRUSS FRAMING</Text>
                            {Object.entries(structuralMaterials.trussFraming || {}).map(([key, value], index) =>
                                <View key={`truss-${key}-${index}`}>
                                    {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value as boolean)}
                                </View>
                            )}
                        </View>

                        {/* Roof */}
                        <View style={styles.mobileCheckboxSection}>
                            <Text style={styles.checkboxColumnTitle}>ROOF</Text>
                            {['reinforceConcrete', 'tiles', 'giSheet', 'aluminum', 'asbestos', 'longSpan', 'concreteDesk', 'nipaAnahawCogon', 'others'].map((key, index) =>
                                <View key={`roof-${key}-${index}`}>
                                    {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), structuralMaterials.roof?.[key] || false)}
                                </View>
                            )}
                        </View>

                        {/* Flooring */}
                        <View style={styles.mobileCheckboxSection}>
                            <Text style={styles.checkboxColumnTitle}>FLOORING</Text>
                            {structuralMaterials.flooring?.map ?
                                structuralMaterials.flooring.map((f: any, index: number) => (
                                    <View key={`flooring-${index}`} style={styles.floorItem}>
                                        <Text style={styles.floorName}>{f.floorName}:</Text>
                                        <Text style={styles.floorMaterial}>{f.material}</Text>
                                    </View>
                                )) :
                                <>
                                    {renderCheckbox('Reinforced Concrete', false)}
                                    {renderCheckbox('Tiles (Ceramic)', false)}
                                </>
                            }
                        </View>

                        {/* Walls & Partitions */}
                        <View style={styles.mobileCheckboxSection}>
                            <Text style={styles.checkboxColumnTitle}>Walls & Partitions</Text>
                            {structuralMaterials.wallsPartitions?.map ?
                                structuralMaterials.wallsPartitions.map((w: any, index: number) => (
                                    <View key={`walls-${index}`} style={styles.floorItem}>
                                        <Text style={styles.floorName}>{w.wallName}:</Text>
                                        <Text style={styles.floorMaterial}>{w.material}</Text>
                                    </View>
                                )) :
                                <>
                                    {renderCheckbox('Concrete Hollow Blocks (CHB)', false)}
                                    {renderCheckbox('Others (Specify)', false)}
                                </>
                            }
                        </View>
                    </View>

                    {/* Property Appraisal */}
                    {propertyAppraisal && Object.keys(propertyAppraisal).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PROPERTY APPRAISAL</Text>
                            <View style={styles.row}>
                                {renderFormField('Area', propertyAppraisal.area ? `${propertyAppraisal.area} sq.m` : '')}
                                {renderFormField('Unit Value', formatCurrency(propertyAppraisal.unit_value))}
                            </View>
                            <View style={styles.row}>
                                {renderFormField('BUCC', propertyAppraisal.bucc)}
                                {renderFormField('Base Market Value', formatCurrency(propertyAppraisal.baseMarketValue))}
                            </View>
                            <View style={styles.row}>
                                {renderFormField('Depreciation', propertyAppraisal.depreciation)}
                                {renderFormField('Depreciation Cost', formatCurrency(propertyAppraisal.depreciationCost))}
                            </View>
                            {renderFormField('Market Value', formatCurrency(propertyAppraisal.marketValue), true)}
                        </View>
                    )}

                    {/* Additional Items */}
                    {assessment.additionalItems?.items?.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>ADDITIONAL ITEMS</Text>
                            {assessment.additionalItems.items.map((item: any, index: number) => (
                                <View key={`additional-${index}`} style={styles.additionalItemContainer}>
                                    <Text style={styles.additionalItemTitle}>{item.label}</Text>
                                    {renderFormField('Quantity:', `${item.quantity}`)}
                                    {renderFormField('Amount:', formatCurrency(item.amount))}
                                </View>
                            ))}
                            {renderFormField('Total Additional:', formatCurrency(assessment.additionalItems.total), true)}
                        </View>
                    )}

                    {/* Property Assessment */}
                    {propertyAssessment && Object.keys(propertyAssessment).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PROPERTY ASSESSMENT</Text>
                            {renderFormField('Market Value:', formatCurrency(propertyAssessment.market_value))}
                            {renderFormField('Assessment Value', formatCurrency(propertyAssessment.assessment_value))}
                            {renderFormField('Building Category', propertyAssessment.building_category)}
                            {renderFormField('Assessment Level', propertyAssessment.assessment_level ? `${propertyAssessment.assessment_level}%` : '')}
                            {renderFormField('Taxable', propertyAssessment.taxable ? 'Yes' : 'No')}
                            {renderFormField('Total Area', propertyAssessment.total_area ? `${propertyAssessment.total_area} sq.m` : '')}
                            {renderFormField('Effective Year', propertyAssessment.eff_year)}
                            {renderFormField('Effective Quarter', propertyAssessment.eff_quarter)}
                        </View>
                    )}

                    {/* Official Footer */}
                    <View style={styles.footerSection}>
                        <View style={styles.legalNotice}>
                            <Text style={styles.legalTitle}>LEGAL NOTICE:</Text>
                            <Text style={styles.legalText}>
                                This is an official government document issued by the Office of the City/Municipal Assessor.
                                Any unauthorized reproduction, alteration, or misuse of this document is punishable by law under
                                the Revised Penal Code and other applicable laws of the Philippines. This document contains
                                confidential information and should be handled accordingly.
                            </Text>
                        </View>

                        <View style={styles.signatureSection}>
                            <View style={styles.signatureBox}>
                                <Text style={styles.sigTitle}>APPRAISED BY:</Text>
                                <View style={styles.signatureLine} />
                                <Text style={styles.sigRole}>Real Property Appraiser</Text>
                                <Text style={styles.sigLicense}>License No.: _____________</Text>
                                <Text style={styles.sigDate}>Date: _______________</Text>
                            </View>
                            <View style={styles.signatureBox}>
                                <Text style={styles.sigTitle}>REVIEWED BY:</Text>
                                <View style={styles.signatureLine} />
                                <Text style={styles.sigRole}>Supervising Appraiser</Text>
                                <Text style={styles.sigLicense}>License No.: _____________</Text>
                                <Text style={styles.sigDate}>Date: _______________</Text>
                            </View>
                            <View style={styles.signatureBox}>
                                <Text style={styles.sigTitle}>APPROVED BY:</Text>
                                <View style={styles.signatureLine} />
                                <Text style={styles.sigRole}>City/Municipal Assessor</Text>
                                <Text style={styles.sigLicense}>Position: _______________</Text>
                                <Text style={styles.sigDate}>Date: _______________</Text>
                            </View>
                        </View>

                        <View style={styles.officialSeal}>
                            <Text style={styles.sealText}>
                                OFFICIAL SEAL{'\n'}OF THE{'\n'}CITY/MUNICIPAL{'\n'}ASSESSOR
                            </Text>
                        </View>

                        <View style={styles.certification}>
                            <Text style={styles.certTitle}>CERTIFICATION</Text>
                            <Text style={styles.certText}>
                                I hereby certify that this Field Appraisal and Assessment Sheet (FAAS) has been prepared
                                in accordance with the provisions of Republic Act No. 7160 (Local Government Code) and
                                other applicable laws and regulations.
                            </Text>
                            <Text style={styles.certText}>
                                This document is valid for official purposes and legal proceedings.
                            </Text>
                        </View>

                        <View style={styles.formInfo}>
                            <Text style={styles.formText}>Form No.: FAAS-2026</Text>
                            <Text style={styles.formText}>Revision: 6th</Text>
                            <Text style={styles.formText}>Effective Date: January 1, {new Date().getFullYear()}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
            
            {/* Floating Action Buttons */}
            <View style={styles.floatingButtons}>
                <TouchableOpacity style={styles.floatingPrintButton} onPress={handlePrint}>
                    <Text style={styles.floatingButtonText}>🖨️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.floatingShareButton} onPress={handleSavePDF}>
                    <Text style={styles.floatingButtonText}>📄</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 120,
    },
    // Mobile-friendly layout styles
    mobileRow: {
        flexDirection: 'column',
        marginBottom: 12,
    },
    halfWidthField: {
        marginBottom: 8,
    },
    fullWidthField: {
        width: '100%',
        marginBottom: 8,
    },
    // Additional Items Styles
    additionalItemContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#4472C4',
    },
    additionalItemTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4472C4',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    printButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 2,
    },
    pdfButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 2,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 2,
    },
    testButton: {
        backgroundColor: '#FF9800',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 2,
    },
    secondaryButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    reportContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 16,
    },
    // Official Header Styles - Mobile Optimized
    officialHeader: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    logoContainer: {
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    logoImage: {
        width: 60,
        height: 60,
    },
    headerCenter: {
        alignItems: 'center',
        marginBottom: 8,
    },
    republic: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 3,
        letterSpacing: 1,
    },
    province: {
        fontSize: 11,
        marginBottom: 2,
        fontStyle: 'italic',
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
        textAlign: 'center',
    },
    documentInfo: {
        alignItems: 'center',
        width: '100%',
    },
    docNumber: {
        fontSize: 10,
        marginBottom: 4,
    },
    series: {
        fontSize: 10,
        marginBottom: 8,
    },
    classification: {
        backgroundColor: '#ff0000',
        paddingHorizontal: 8,
        paddingVertical: 2,
        transform: [{ rotate: '-15deg' }],
    },
    classificationText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    // Floating Action Button Styles
    floatingButtons: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'column',
        gap: 12,
    },
    floatingPrintButton: {
        backgroundColor: '#4CAF50',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    floatingShareButton: {
        backgroundColor: '#2196F3',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    floatingButtonText: {
        color: '#fff',
        fontSize: 20,
        textAlign: 'center',
    },
    // Property Index Section
    propertyIndexSection: {
        marginBottom: 15,
        padding: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#f9f9f9',
    },
    // Note Section
    noteSection: {
        marginVertical: 10,
        padding: 6,
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed',
        backgroundColor: '#fafafa',
    },
    noteText: {
        fontSize: 7,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#666',
    },
    // Structural Materials Grid
    structuralGrid: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    // Floor and Wall Items
    floorItem: {
        marginBottom: 3,
    },
    floorName: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    floorMaterial: {
        fontSize: 10,
        marginLeft: 8,
    },
    // Section Styles - Mobile Optimized
    section: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        backgroundColor: '#4472C4',
        color: '#fff',
        padding: 12,
        textAlign: 'center',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
        borderRadius: 6,
    },
    row: {
        flexDirection: 'column',
        marginBottom: 12,
    },
    formField: {
        marginBottom: 12,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
        textTransform: 'uppercase',
    },
    fieldBox: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        minHeight: 44,
        backgroundColor: '#fafafa',
        borderRadius: 6,
    },
    fieldValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        lineHeight: 20,
    },
    // Checkbox Styles - Mobile Optimized
    checkboxSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    mobileCheckboxSection: {
        marginBottom: 16,
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
        padding: 12,
    },
    checkboxColumn: {
        flex: 1,
        marginHorizontal: 2,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 6,
        backgroundColor: '#fff',
    },
    checkboxColumnTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 12,
        color: '#4472C4',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 4,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1,
        borderColor: '#333',
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
    },
    checkboxMark: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4472C4',
    },
    checkboxLabel: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    // Footer Styles
    footerSection: {
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
        paddingTop: 15,
    },
    legalNotice: {
        fontSize: 8,
        textAlign: 'center',
        marginTop: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#666',
        borderStyle: 'dashed',
        backgroundColor: '#f9f9f9',
        marginBottom: 20,
    },
    legalTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        fontSize: 8,
    },
    legalText: {
        fontStyle: 'italic',
        lineHeight: 10,
        fontSize: 7,
    },
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
        marginBottom: 20,
    },
    signatureBox: {
        width: '30%',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    sigTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
        fontSize: 8,
    },
    signatureLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#999',
        marginVertical: 30,
        height: 1,
    },
    sigRole: {
        fontSize: 8,
        marginTop: 5,
    },
    sigLicense: {
        fontSize: 8,
        marginTop: 2,
    },
    sigDate: {
        fontSize: 8,
        marginTop: 15,
    },
    officialSeal: {
        width: 100,
        height: 100,
        borderWidth: 1,
        borderColor: '#999',
        borderRadius: 50,
        margin: 20,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
    },
    sealText: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    certification: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 7,
        borderWidth: 2,
        borderColor: '#000',
        padding: 10,
        backgroundColor: '#f0f0f0',
    },
    certTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        fontSize: 8,
    },
    certText: {
        marginTop: 10,
        lineHeight: 10,
        fontSize: 7,
    },
    formInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        fontSize: 7,
        color: '#666',
    },
    formText: {
        fontSize: 7,
        color: '#666',
    },
});

export default FaasReport;
