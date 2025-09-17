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

    const handlePrint = async () => {
        await FaasPrintService.printDocument(assessment);
    };

    const handleSavePDF = async () => {
        await FaasPrintService.savePDF(assessment);
    };

    const renderFormField = (label: string, value: any, width: string = '48%') => (
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
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
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
                        {renderFormField('PIN', ownerDetails.pin || assessment.pin, '100%')}
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
                        {renderFormField('No./Street', buildingLocation.street, '100%')}
                        <View style={styles.row}>
                            {renderFormField('Barangay', buildingLocation.barangay)}
                            {renderFormField('City/Municipality', buildingLocation.municipality)}
                        </View>
                        {renderFormField('Province', buildingLocation.province, '100%')}
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
                        {renderFormField('Area:', landReference.area ? `${landReference.area} sq.m` : '', '100%')}
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
                        <View style={styles.structuralGrid}>
                            <View style={styles.checkboxColumn}>
                                <Text style={styles.checkboxColumnTitle}>FOUNDATION</Text>
                                {Object.entries(structuralMaterials.foundation || {}).map(([key, value], index) =>
                                    <View key={`foundation-${key}-${index}`}>
                                        {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value as boolean)}
                                    </View>
                                )}
                            </View>
                            <View style={styles.checkboxColumn}>
                                <Text style={styles.checkboxColumnTitle}>COLUMNS</Text>
                                {Object.entries(structuralMaterials.columns || {}).map(([key, value], index) =>
                                    <View key={`columns-${key}-${index}`}>
                                        {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value as boolean)}
                                    </View>
                                )}
                            </View>
                            <View style={styles.checkboxColumn}>
                                <Text style={styles.checkboxColumnTitle}>BEAMS</Text>
                                {Object.entries(structuralMaterials.beams || {}).map(([key, value], index) =>
                                    <View key={`beams-${key}-${index}`}>
                                        {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value as boolean)}
                                    </View>
                                )}
                            </View>
                            <View style={styles.checkboxColumn}>
                                <Text style={styles.checkboxColumnTitle}>TRUSS FRAMING</Text>
                                {Object.entries(structuralMaterials.trussFraming || {}).map(([key, value], index) =>
                                    <View key={`truss-${key}-${index}`}>
                                        {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), value as boolean)}
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={styles.structuralGrid}>
                            <View style={styles.checkboxColumn}>
                                <Text style={styles.checkboxColumnTitle}>ROOF</Text>
                                {['reinforceConcrete', 'tiles', 'giSheet', 'aluminum', 'asbestos', 'longSpan', 'concreteDesk', 'nipaAnahawCogon', 'others'].map((key, index) =>
                                    <View key={`roof-${key}-${index}`}>
                                        {renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), structuralMaterials.roof?.[key] || false)}
                                    </View>
                                )}
                            </View>
                            <View style={styles.checkboxColumn}>
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
                            <View style={styles.checkboxColumn}>
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
                    </View>

                    {/* Property Appraisal */}
                    {propertyAppraisal && Object.keys(propertyAppraisal).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PROPERTY APPRAISAL</Text>
                            <View style={styles.row}>
                                {renderFormField('Area', propertyAppraisal.area ? `${propertyAppraisal.area} sq.m` : '')}
                                {renderFormField('Unit Value', propertyAppraisal.unit_value ? `PHP ${propertyAppraisal.unit_value.toLocaleString()}` : '')}
                            </View>
                            <View style={styles.row}>
                                {renderFormField('BUCC', propertyAppraisal.bucc)}
                                {renderFormField('Base Market Value', propertyAppraisal.baseMarketValue ? `PHP ${propertyAppraisal.baseMarketValue.toLocaleString()}` : '')}
                            </View>
                            <View style={styles.row}>
                                {renderFormField('Depreciation', propertyAppraisal.depreciation)}
                                {renderFormField('Depreciation Cost', propertyAppraisal.depreciationCost ? `PHP ${propertyAppraisal.depreciationCost.toLocaleString()}` : '')}
                            </View>
                            {renderFormField('Market Value', propertyAppraisal.marketValue ? `PHP ${propertyAppraisal.marketValue.toLocaleString()}` : '', '100%')}
                        </View>
                    )}

                    {/* Additional Items */}
                    {assessment.additionalItems?.items?.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>ADDITIONAL ITEMS</Text>
                            {assessment.additionalItems.items.map((item: any, index: number) => (
                                <View key={`additional-${index}`} style={styles.row}>
                                    {renderFormField(`${item.label}:`, `Qty: ${item.quantity}`)}
                                    {renderFormField('Amount:', item.amount ? `PHP ${item.amount.toLocaleString()}` : '')}
                                </View>
                            ))}
                            {renderFormField('Total Additional:', assessment.additionalItems.total ? `PHP ${assessment.additionalItems.total.toLocaleString()}` : '', '100%')}
                        </View>
                    )}

                    {/* Property Assessment */}
                    {propertyAssessment && Object.keys(propertyAssessment).length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PROPERTY ASSESSMENT</Text>
                            <View style={styles.row}>
                                {renderFormField('Market Value:', propertyAssessment.market_value ? `PHP ${propertyAssessment.market_value.toLocaleString()}` : '')}
                                {renderFormField('Assessment Value', propertyAssessment.assessment_value ? `PHP ${propertyAssessment.assessment_value.toLocaleString()}` : '')}
                            </View>
                            <View style={styles.row}>
                                {renderFormField('Building Category', propertyAssessment.building_category)}
                                {renderFormField('Assessment Level', propertyAssessment.assessment_level ? `${propertyAssessment.assessment_level}%` : '')}
                            </View>
                            <View style={styles.row}>
                                {renderFormField('Taxable', propertyAssessment.taxable ? 'Yes' : 'No')}
                                {renderFormField('Total Area', propertyAssessment.total_area ? `${propertyAssessment.total_area} sq.m` : '')}
                            </View>
                            <View style={styles.row}>
                                {renderFormField('Effective Year', propertyAssessment.eff_year)}
                                {renderFormField('Effective Quarter', propertyAssessment.eff_quarter)}
                            </View>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 100,
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
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    reportContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        elevation: 1,
    },
    // Official Header Styles
    officialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    logoContainer: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 80,
        height: 80,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 20,
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
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 2,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    documentInfo: {
        alignItems: 'flex-end',
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
    // Section Styles
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: '#4472C4',
        color: '#fff',
        padding: 8,
        textAlign: 'center',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    formField: {
        marginBottom: 8,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#333',
        textTransform: 'uppercase',
    },
    fieldBox: {
        borderWidth: 1,
        borderColor: '#999',
        padding: 4,
        minHeight: 18,
        backgroundColor: '#fafafa',
    },
    fieldValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
    },
    // Checkbox Styles
    checkboxSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 6,
        backgroundColor: '#e8e8e8',
        padding: 3,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 1,
    },
    checkbox: {
        width: 12,
        height: 12,
        borderWidth: 1,
        borderColor: '#333',
        marginRight: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxMark: {
        fontSize: 8,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: 10,
        flex: 1,
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
