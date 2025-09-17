import images from '@/constants/images';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
export class FaasPrintService {

  private static formatValue(value: any): string {
    return value === null || value === undefined || value === '' ? '' : String(value);
  }

  private static renderCheckbox(label: string, checked: boolean): string {
    return `<div class="checkbox">${checked ? '☑' : '☐'} ${label}</div>`;
  }

  private static renderField(label: string, value: any, isFullWidth = false): string {
    const colClass = isFullWidth ? 'full-width' : 'half-width';
    return `<div class="${colClass}"><div class="field-label">${label}</div><div class="field-box">${this.formatValue(value)}</div></div>`;
  }

  private static renderRow(fields: Array<{ label: string, value: any, fullWidth?: boolean }>): string {
    return `<div class="row">${fields.map(f => this.renderField(f.label, f.value, f.fullWidth)).join('')}</div>`;
  }

  private static async getLogoBase64(): Promise<string> {
    try {
      const Asset = require('expo-asset').Asset;
      const asset = Asset.fromModule(images.pganLogo);
      
      // Ensure the asset is downloaded
      if (!asset.downloaded) {
        await asset.downloadAsync();
      }
      
      // Get the local URI
      const localUri = asset.localUri || asset.uri;
      
      if (!localUri) {
        throw new Error('Could not get logo URI');
      }
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      
      if (!fileInfo.exists) {
        throw new Error('Logo file does not exist at URI');
      }
      
      // Read as base64
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (!base64) {
        throw new Error('Failed to convert logo to base64');
      }
      
      // Determine the correct MIME type based on the file
      const mimeType = localUri.toLowerCase().includes('.png') ? 'image/png' : 
                     localUri.toLowerCase().includes('.jpg') || localUri.toLowerCase().includes('.jpeg') ? 'image/jpeg' :
                     localUri.toLowerCase().includes('.webp') ? 'image/webp' : 'image/png';
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      // Try alternative approach with bundled asset path
      try {
        const Asset = require('expo-asset').Asset;
        const bundleUri = Asset.fromModule(images.pganLogo).uri;
        
        if (bundleUri) {
          const base64 = await FileSystem.readAsStringAsync(bundleUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          if (base64) {
            return `data:image/png;base64,${base64}`;
          }
        }
      } catch (altError) {
        // Silent fallback
      }
      
      // Final fallback: return empty string (will show placeholder)
      return '';
    }
  }

  private static async generatePrintHTML(assessment: any): Promise<string> {
    const ownerDetails = assessment.owner_details || {};
    const logoBase64 = await this.getLogoBase64();

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Official FAAS Document</title><style>
@page{size:legal;margin:.5in}body{font-family:'Times New Roman',serif;margin:0;padding:0;font-size:14px;line-height:1.4;color:#000;background:white}
.page-container{max-width:100%;margin:0 auto;background:white;position:relative}
.official-header{text-align:center;margin-bottom:20px;padding:15px 0;border-bottom:1px solid #ccc;position:relative}
.government-seal{position:absolute;left:20px;top:10px;width:60px;height:60px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:bold;text-align:center}
.republic{font-size:14px;font-weight:bold;margin-bottom:3px;letter-spacing:1px}
.province,.city{font-size:11px;margin-bottom:2px;font-style:italic}
.office-title{font-size:10px;font-weight:bold;margin:8px 0;text-transform:uppercase}
.document-title{font-size:16px;font-weight:bold;margin:12px 0 4px 0;text-transform:uppercase;letter-spacing:2px}
.document-subtitle{font-size:14px;font-weight:bold;margin-bottom:10px;color:#333}
.document-number{position:absolute;right:20px;top:20px;font-size:10px;text-align:right}
.classification{background:#ff0000;color:white;padding:2px 8px;font-size:10px;font-weight:bold;position:absolute;right:20px;top:50px;transform:rotate(-15deg)}
.section-header{background:linear-gradient(135deg,#4472C4 0%,#2E5A9B 100%);color:white;font-weight:bold;text-align:center;padding:8px;margin:12px 0 6px 0;font-size:12px;border:1px solid #ccc;text-transform:uppercase;letter-spacing:1px;box-shadow:0 1px 2px rgba(0,0,0,0.1)}
.row{display:flex;margin-bottom:4px;page-break-inside:avoid}
.half-width{flex:1;padding:0 3px}.full-width{width:100%;padding:0 3px}
.field-label{font-size:10px;font-weight:bold;margin-bottom:2px;color:#333;text-transform:uppercase}
.field-box{border:1px solid #999;padding:4px 6px;min-height:18px;font-size:16px;font-weight:bold;word-wrap:break-word;background:#fafafa;font-family:'Courier New',monospace}
.checkbox{font-size:6px;margin:1px 0}
.struct-grid{display:flex;gap:2px;margin-bottom:6px}
.struct-col{flex:1;border:1px solid #ccc;padding:6px;background:#fff}
.struct-header{font-weight:bold;font-size:9px;text-align:center;margin-bottom:6px;background:#e8e8e8;padding:3px;border:1px solid #ddd}
.page-break-before{page-break-before:always;break-before:page}
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:72px;color:rgba(0,0,0,0.05);font-weight:bold;z-index:-1;pointer-events:none}
.footer-section{margin-top:30px;border-top:1px solid #ccc;padding-top:15px}
.signature-section{display:flex;justify-content:space-between;margin-top:40px;page-break-inside:avoid}
.signature-box{width:30%;text-align:center;border:1px solid #ccc;padding:10px;background:#f9f9f9}
.signature-line{border-bottom:1px solid #999;margin:30px 0 10px 0;height:1px}
.official-seal-area{width:100px;height:100px;border:1px solid #999;border-radius:50%;margin:20px auto;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:bold;text-align:center;background:#f0f0f0}
.legal-notice{font-size:7px;text-align:center;margin-top:20px;padding:10px;border:1px dashed #666;background:#f9f9f9;font-style:italic}
.document-security{position:absolute;bottom:10px;right:10px;font-size:6px;color:#666}
@media print{.page-container{max-width:none}.watermark{position:fixed}}
</style></head>
      <body>
        <div class="watermark">OFFICIAL</div>
        <div class="page-container">
          ${this.renderOfficialHeader(logoBase64)}
          ${this.renderOwnerSection(assessment, ownerDetails)}
          ${this.renderBuildingLocationSection(assessment)}
          ${this.renderLandReferenceSection(assessment)}
          ${this.renderGeneralDescriptionSection(assessment)}
          ${this.renderStructuralMaterialsSection(assessment)}
          ${this.renderPropertyAppraisalSection(assessment)}
          ${this.renderAdditionalItemsSection(assessment)}
          ${this.renderPropertyAssessmentSection(assessment)}
          ${this.renderOfficialFooterSection()}
        </div>
        <div class="document-security">
          Doc ID: FAAS-${String(Math.floor(Math.random() * 9000) + 1000)} | Generated: ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
  }

  private static renderOfficialHeader(logoBase64: string): string {
    const logoContent = logoBase64 
      ? `<img src="${logoBase64}" alt="PGAN Logo" style="width:80px;height:80px;object-fit:contain;">`
      : `<div style="width:80px;height:80px;border:2px solid #333;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:bold;text-align:center;background:#f0f0f0;">PGAN<br>LOGO</div>`;
    
    return `
      <div class="official-header">
        <div class="government-seal">
          ${logoContent}
        </div>
        <div class="document-number">
          Document No.: FAAS-${String(Math.floor(Math.random() * 9000) + 1000)}<br>
          Series of ${new Date().getFullYear()}
        </div>
        <div class="classification">OFFICIAL</div>
        
        <div class="republic">REPUBLIC OF THE PHILIPPINES</div>
        <div class="province">Province of Agusan del Norte</div>
        
        <div class="document-title">FIELD APPRAISAL AND ASSESSMENT SHEET</div>
        <div class="document-subtitle">(FAAS)</div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 9px; border: 1px solid #ccc; padding: 8px; background: #f9f9f9;">
          <div style="flex: 1;">
            <div style="margin-bottom: 6px;">
              <span style="font-weight: bold;">Property Index No.:</span>
              <span style="border-bottom: 1px solid #999; display: inline-block; width: 140px; margin-left: 8px; padding: 2px;"></span>
            </div>
            <div>
              <span style="font-weight: bold;">Assessment Date:</span>
              <span style="border-bottom: 1px solid #999; display: inline-block; width: 140px; margin-left: 8px; padding: 2px;"></span>
            </div>
          </div>
          <div style="flex: 1; text-align: right;">
            <div style="margin-bottom: 6px;">
              <span style="font-weight: bold;">Revision No.:</span>
              <span style="border-bottom: 1px solid #999; display: inline-block; width: 140px; margin-left: 8px; padding: 2px;"></span>
            </div>
            <div>
              <span style="font-weight: bold;">Supersedes PIN:</span>
              <span style="border-bottom: 1px solid #999; display: inline-block; width: 140px; margin-left: 8px; padding: 2px;"></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private static renderOwnerSection(assessment: any, ownerDetails: any): string {
    let ownerSection = `${this.renderRow([{ label: 'TD / ARP No.', value: assessment.tdArp || ownerDetails.tdArp }, { label: 'TRANSACTION CODE', value: assessment.transactionCode || ownerDetails.transactionCode }])}
${this.renderRow([{ label: 'PIN', value: assessment.pin || ownerDetails.pin, fullWidth: true }])}
<div class="section-header">OWNER</div>
${this.renderRow([{ label: 'OWNER', value: assessment.ownerName || ownerDetails.owner }, { label: 'TIN', value: ownerDetails.tin }])}
${this.renderRow([{ label: 'ADDRESS', value: ownerDetails.address }, { label: 'Tel. No.', value: ownerDetails.telNo }])}`;

    // Add Administrator/Beneficiary section if present
    if (ownerDetails.hasAdministratorBeneficiary && ownerDetails.administratorBeneficiary) {
      const admin = ownerDetails.administratorBeneficiary;
      ownerSection += `
<div class="section-header">ADMINISTRATOR/BENEFICIARY</div>
${this.renderRow([{ label: 'NAME', value: admin.name }, { label: 'TIN', value: admin.tin }])}
${this.renderRow([{ label: 'ADDRESS', value: admin.address }, { label: 'Tel. No.', value: admin.telNo }])}`;
    }

    return ownerSection;
  }

  private static renderBuildingLocationSection(assessment: any): string {
    const bl = assessment.building_location || {};
    return `<div class="section-header">BUILDING LOCATION</div>
${this.renderRow([{ label: 'No./Street', value: bl.street, fullWidth: true }])}
${this.renderRow([{ label: 'Barangay', value: assessment.barangay || bl.barangay }, { label: 'City/Municipality', value: assessment.municipality || bl.municipality }])}
${this.renderRow([{ label: 'Province', value: assessment.province || bl.province, fullWidth: true }])}`;
  }

  private static renderLandReferenceSection(assessment: any): string {
    const lr = assessment.land_reference || {};
    return `<div class="section-header">LAND REFERENCE</div>
${this.renderRow([{ label: 'Owner:', value: lr.owner }, { label: 'OCT/TCT/CLOA/CSC No.:', value: lr.titleNumber }])}
${this.renderRow([{ label: 'Lot No.:', value: lr.lotNumber }, { label: 'Block No.:', value: lr.blockNumber }])}
${this.renderRow([{ label: 'Survey No.:', value: lr.surveyNumber }, { label: 'TDN/ARP No.:', value: lr.tdnArpNumber }])}
${this.renderRow([{ label: 'Area:', value: lr.area ? `${lr.area} sq.m` : '', fullWidth: true }])}`;
  }

  private static renderGeneralDescriptionSection(assessment: any): string {
    const gd = assessment.general_description || {};
    return `<div class="page-break-before"></div><div class="section-header">GENERAL DESCRIPTION</div>
${this.renderRow([{ label: 'Kind of Bldg.', value: gd.kindOfBuilding }, { label: 'Bldg. Age', value: gd.buildingAge ? `${gd.buildingAge} years` : '' }])}
${this.renderRow([{ label: 'Structural Type', value: gd.structuralType }, { label: 'No. of Storeys:', value: gd.numberOfStoreys }])}
${this.renderRow([{ label: 'Bldg. Permit No.', value: gd.buildingPermitNo }, { label: 'Total Floor Area', value: gd.totalFloorArea ? `${gd.totalFloorArea} sq.m` : '' }])}
${this.renderRow([{ label: 'Date Constructed', value: gd.dateConstructed ? new Date(gd.dateConstructed).toLocaleDateString() : '' }, { label: 'Date Occupied', value: gd.dateOccupied ? new Date(gd.dateOccupied).toLocaleDateString() : '' }])}
${this.renderRow([{ label: 'Condominium CCT', value: gd.condominiumCCT }, { label: 'Unit Value', value: gd.unit_value ? `PHP ${Number(gd.unit_value).toLocaleString()}` : '' }])}`;
  }

  private static renderStructuralMaterialsSection(assessment: any): string {
    const sm = assessment.structural_materials || {};
    const renderStructCol = (title: string, items: any) => `<div class="struct-col"><div class="struct-header">${title}</div>${Object.entries(items || {}).map(([key, val]) => this.renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), val as boolean)).join('')}</div>`;

    return `<div style="font-size:7px;text-align:center;margin:10px 0;font-style:italic;color:#666;border:1px dashed #ccc;padding:6px;background:#fafafa">Note: Attached the building plan/sketch of floor plan. A photograph may also be attached if necessary.</div>
<div class="section-header">STRUCTURAL MATERIALS (Checklists)</div>
<div class="struct-grid">
${renderStructCol('FOUNDATION', sm.foundation)}
${renderStructCol('COLUMNS', sm.columns)}
${renderStructCol('BEAMS', sm.beams)}
${renderStructCol('TRUSS FRAMING', sm.trussFraming)}
</div>
<div class="struct-grid">
<div class="struct-col"><div class="struct-header">ROOF</div>${['reinforceConcrete', 'tiles', 'giSheet', 'aluminum', 'asbestos', 'longSpan', 'concreteDesk', 'nipaAnahawCogon', 'others'].map(key => this.renderCheckbox(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()), sm.roof?.[key])).join('')}</div>
<div class="struct-col"><div class="struct-header">FLOORING</div>${sm.flooring?.map ? sm.flooring.map((f: any) => `<div style="font-size:8px;margin-bottom:3px"><b>${f.floorName}:</b><div style="margin-left:8px">${f.material}</div></div>`).join('') : this.renderCheckbox('Reinforced Concrete', false) + this.renderCheckbox('Tiles (Ceramic)', false)}</div>
<div class="struct-col"><div class="struct-header">Walls & Partitions</div>${sm.wallsPartitions?.map ? sm.wallsPartitions.map((w: any) => `<div style="font-size:8px;margin-bottom:3px"><b>${w.wallName}:</b><div style="margin-left:8px">${w.material}</div></div>`).join('') : this.renderCheckbox('Concrete Hollow Blocks (CHB)', false) + this.renderCheckbox('Others (Specify)', false)}</div>
</div>`;
  }

  private static renderPropertyAppraisalSection(assessment: any): string {
    if (!assessment.property_appraisal) return '';
    const pa = assessment.property_appraisal;
    return `<div class="section-header">PROPERTY APPRAISAL</div>
${this.renderRow([{ label: 'Area', value: pa.area ? `${pa.area} sq.m` : '' }, { label: 'Unit Value', value: pa.unit_value ? `PHP ${pa.unit_value.toLocaleString()}` : '' }])}
${this.renderRow([{ label: 'BUCC', value: pa.bucc }, { label: 'Base Market Value', value: pa.baseMarketValue ? `PHP ${pa.baseMarketValue.toLocaleString()}` : '' }])}
${this.renderRow([{ label: 'Depreciation', value: pa.depreciation }, { label: 'Depreciation Cost', value: pa.depreciationCost ? `PHP ${pa.depreciationCost.toLocaleString()}` : '' }])}
${this.renderRow([{ label: 'Market Value', value: pa.marketValue ? `PHP ${pa.marketValue.toLocaleString()}` : '', fullWidth: true }])}`;
  }

  private static renderAdditionalItemsSection(assessment: any): string {
    if (!assessment.additionalItems?.items?.length) return '';
    return `<div class="section-header">ADDITIONAL ITEMS</div>
${assessment.additionalItems.items.map((item: any) => this.renderRow([{ label: `${item.label}:`, value: `Qty: ${item.quantity}` }, { label: 'Amount:', value: item.amount ? `PHP ${item.amount.toLocaleString()}` : '' }])).join('')}
${this.renderRow([{ label: 'Total Additional:', value: assessment.additionalItems.total ? `PHP ${assessment.additionalItems.total.toLocaleString()}` : '', fullWidth: true }])}`;
  }

  private static renderPropertyAssessmentSection(assessment: any): string {
    if (!assessment.property_assessment) return '';
    const pa = assessment.property_assessment;
    return `<div class="page-break-before"></div><div class="section-header">PROPERTY ASSESSMENT</div>
${this.renderRow([{ label: 'Market Value:', value: pa.market_value ? `PHP ${pa.market_value.toLocaleString()}` : '' }, { label: 'Assessment Value', value: pa.assessment_value ? `PHP ${pa.assessment_value.toLocaleString()}` : '' }])}
${this.renderRow([{ label: 'Building Category', value: pa.building_category }, { label: 'Assessment Level', value: pa.assessment_level ? `${pa.assessment_level}%` : '' }])}
${this.renderRow([{ label: 'Taxable', value: pa.taxable ? 'Yes' : 'No' }, { label: 'Total Area', value: pa.total_area ? `${pa.total_area} sq.m` : '' }])}
${this.renderRow([{ label: 'Effective Year', value: pa.eff_year }, { label: 'Effective Quarter', value: pa.eff_quarter }])}`;
  }

  private static renderOfficialFooterSection(): string {
    const renderSigBox = (title: string, role: string, extra = '') => `<div class="signature-box"><b style="margin-bottom:10px">${title}</b><div class="signature-line"></div><div style="font-size:8px;margin-top:5px"><b>Name & Signature</b><div>${role}</div><div>${extra || 'License No.: _____________'}</div></div><div style="margin-top:15px;font-size:8px">Date: _______________</div></div>`;

    return `<div class="footer-section"><div class="legal-notice"><b>LEGAL NOTICE:</b> This is an official government document issued by the Office of the City/Municipal Assessor. Any unauthorized reproduction, alteration, or misuse of this document is punishable by law under the Revised Penal Code and other applicable laws of the Philippines. This document contains confidential information and should be handled accordingly.</div>
<div class="signature-section">${renderSigBox('APPRAISED BY:', 'Real Property Appraiser')}${renderSigBox('REVIEWED BY:', 'Supervising Appraiser')}${renderSigBox('APPROVED BY:', 'City/Municipal Assessor', 'Position: _______________')}</div>
        <div class="official-seal-area">
          OFFICIAL SEAL<br>
          OF THE<br>
          CITY/MUNICIPAL<br>
          ASSESSOR
        </div>
<div style="text-align:center;margin-top:20px;font-size:8px;border:2px solid #000;padding:10px;background:#f0f0f0"><b style="margin-bottom:5px">CERTIFICATION</b><div>I hereby certify that this Field Appraisal and Assessment Sheet (FAAS) has been prepared in accordance with the provisions of Republic Act No. 7160 (Local Government Code) and other applicable laws and regulations.</div><div style="margin-top:10px">This document is valid for official purposes and legal proceedings.</div></div>
<div style="display:flex;justify-content:space-between;margin-top:15px;font-size:7px;color:#666"><div>Form No.: FAAS-2026</div><div>Revision: 6th</div><div>Effective Date: January 1, ${new Date().getFullYear()}</div></div></div>`;
  }

  public static async printDocument(assessment: any): Promise<void> {
    try {
      await Print.printAsync({
        html: await this.generatePrintHTML(assessment),
        width: 612,
        height: 792,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to print document');
    }
  }

  public static async savePDF(assessment: any): Promise<void> {
    try {
      const { uri } = await Print.printToFileAsync({
        html: await this.generatePrintHTML(assessment),
        width: 612,
        height: 792,
        base64: false,
        margins: {
          left: 36,
          top: 36,
          right: 36,
          bottom: 36,
        },
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save FAAS Report PDF',
        });
      } else {
        Alert.alert('Success', 'PDF saved successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save PDF');
    }
  }
}
