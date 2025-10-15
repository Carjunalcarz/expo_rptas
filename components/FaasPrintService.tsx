import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Image, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';
import { storage, config, uploadSingleForDebug } from '../lib/appwrite';
// Note: expo-media-library needs to be installed: npm install expo-media-library
// import * as MediaLibrary from 'expo-media-library';

export class FaasPrintService {
  private static logoCache: string | null = null;
  private static logoCacheTimestamp: number = 0;
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private static formatValue(value: any): string {
    return value === null || value === undefined || value === '' ? '' : String(value);
  }

  private static formatCurrency(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : Number(value);
    if (isNaN(numValue)) return String(value);
    return `PHP ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  public static async getLogoBase64(): Promise<string> {
    try {
      // Check if we have a valid cached logo
      const now = Date.now();
      if (this.logoCache && (now - this.logoCacheTimestamp) < this.CACHE_DURATION) {
        console.log('✅ Using cached PGAN logo');
        return this.logoCache;
      }

      console.log('🔄 Fetching PGAN logo from Appwrite (cache expired or empty)...');
      
      // Try to load logo from Appwrite storage URL
      const logoUrl = 'https://fra.cloud.appwrite.io/v1/storage/buckets/68b9247b0010e5800f42/files/68ca241f002eddd24ccb/view?project=68a430620012d1b0268b&mode=admin';
      
      const response = await fetch(logoUrl);
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        
        return new Promise((resolve) => {
          reader.onloadend = () => {
            const base64 = reader.result as string;
            
            // Cache the logo
            this.logoCache = base64;
            this.logoCacheTimestamp = now;
            
            console.log('✅ Successfully loaded and cached PGAN logo from Appwrite, base64 length:', base64.length);
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        console.log('⚠️ Failed to fetch logo from Appwrite, status:', response.status);
        return '';
      }
      
    } catch (error) {
      console.error('❌ Error loading PGAN logo from Appwrite:', error);
      console.log('🚫 NO LOGO will be displayed - logo loading failed completely');
      return '';
    }
  }

  public static clearLogoCache(): void {
    this.logoCache = null;
    this.logoCacheTimestamp = 0;
    console.log('🗑️ Logo cache cleared');
  }


  private static generatePrintHTML(assessment: any, logoBase64: string = ''): string {
    const ownerDetails = assessment.owner_details || {};
    console.log('Generating HTML with logo:', logoBase64 ? 'Logo present' : 'No logo');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Official FAAS Document</title><style>
@page{size:legal;margin:0.5in}body{font-family:'Times New Roman',serif;margin:0;padding:0;font-size:14px;line-height:1.4;color:#000;background:white}
.page-container{max-width:100%;margin:0 auto;background:white;position:relative}
.official-header{text-align:center;margin-bottom:20px;padding:15px 0;border-bottom:1px solid #ccc;position:relative}
.government-seal{position:absolute;left:20px;top:10px;width:80px;height:80px;display:flex;align-items:center;justify-content:center}
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
          ${this.renderMemorandaSection(assessment)}
          ${this.renderSupersededAssessmentSection(assessment)}
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
      ? `<img src="${logoBase64}" style="width:80px;height:80px;border-radius:50%;border:2px solid #ccc;object-fit:cover;display:block;" alt="PGAN Logo" />`
      : `<div style="width:80px;height:80px;border:3px solid #1a365d;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;text-align:center;background:#f7fafc;color:#1a365d;">
          <div>PGAN<br/>SEAL</div>
        </div>`;

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
${this.renderRow([{ label: 'Condominium CCT', value: gd.condominiumCCT }, { label: 'Unit Value', value: this.formatCurrency(gd.unit_value) }])}`;
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
${this.renderRow([{ label: 'Area', value: pa.area ? `${pa.area} sq.m` : '' }, { label: 'Unit Value', value: this.formatCurrency(pa.unit_value) }])}
${this.renderRow([{ label: 'BUCC', value: pa.bucc }, { label: 'Base Market Value', value: this.formatCurrency(pa.baseMarketValue) }])}
${this.renderRow([{ label: 'Depreciation', value: pa.depreciation }, { label: 'Depreciation Cost', value: this.formatCurrency(pa.depreciationCost) }])}
${this.renderRow([{ label: 'Market Value', value: this.formatCurrency(pa.marketValue), fullWidth: true }])}`;
  }

  private static renderAdditionalItemsSection(assessment: any): string {
    if (!assessment.additionalItems?.items?.length) return '';
    return `<div class="section-header">ADDITIONAL ITEMS</div>
${assessment.additionalItems.items.map((item: any) => this.renderRow([{ label: `${item.label}:`, value: `Qty: ${item.quantity}` }, { label: 'Amount:', value: this.formatCurrency(item.amount) }])).join('')}
${this.renderRow([{ label: 'Total Additional:', value: this.formatCurrency(assessment.additionalItems.total), fullWidth: true }])}`;
  }

  private static renderPropertyAssessmentSection(assessment: any): string {
    if (!assessment.property_assessment) return '';
    const pa = assessment.property_assessment;
    return `<div class="page-break-before"></div><div class="section-header">PROPERTY ASSESSMENT</div>
${this.renderRow([{ label: 'Market Value:', value: this.formatCurrency(pa.market_value) }, { label: 'Assessment Value', value: this.formatCurrency(pa.assessment_value) }])}
${this.renderRow([{ label: 'Building Category', value: pa.building_category }, { label: 'Assessment Level', value: pa.assessment_level ? `${pa.assessment_level}%` : '' }])}
${this.renderRow([{ label: 'Taxable', value: pa.taxable ? 'Yes' : 'No' }, { label: 'Total Area', value: pa.total_area ? `${pa.total_area} sq.m` : '' }])}
${this.renderRow([{ label: 'Effective Year', value: pa.eff_year }, { label: 'Effective Quarter', value: pa.eff_quarter }])}`;
  }

  private static renderMemorandaSection(assessment: any): string {
    // Get memoranda from multiple sources for backward compatibility
    const memorandaText = assessment?.memorandaContent || 
                         assessment?.land_reference?.memoranda?.memoranda || 
                         assessment?.memoranda?.memoranda;
    
    if (!memorandaText) return '';
    
    return `<div class="section-header">MEMORANDA</div>
${this.renderRow([{ label: 'Memoranda:', value: memorandaText, fullWidth: true }])}`;
  }

  private static renderSupersededAssessmentSection(assessment: any): string {
    // Get superseded assessment data from multiple sources
    const supersededData = assessment?.superseded_assessment || 
                          assessment?.land_reference?.superseded_assessment || 
                          {};
    const hasSupersededData = assessment?.isSuperseded || 
                            assessment?.supersededBy || 
                            supersededData?.pin ||
                            Object.keys(supersededData).length > 0;
    
    // Hide section completely if no superseded data
    if (!hasSupersededData) return '';
    
    let supersededContent = '';
    
    // Collect all available fields
    const fields = [];
    
    if (assessment.supersededDate || supersededData?.dateOfEntry || supersededData?.date) {
      fields.push({ label: 'Date of Entry:', value: assessment.supersededDate || supersededData?.dateOfEntry || supersededData?.date });
    }
    
    if (assessment.supersededBy || supersededData?.pin) {
      fields.push({ label: 'Superseded PIN:', value: assessment.supersededBy || supersededData?.pin });
    }
    
    if (supersededData?.previousOwner) {
      fields.push({ label: 'Previous Owner:', value: supersededData.previousOwner });
    }
    
    if (supersededData?.totalAssessedValue) {
      fields.push({ label: 'Previous Assessment:', value: this.formatCurrency(supersededData.totalAssessedValue) });
    }
    
    if (assessment.supersededReason || supersededData?.newValue) {
      fields.push({ label: 'Status:', value: assessment.supersededReason || supersededData?.newValue });
    }
    
    if (supersededData?.recordingPersonnel) {
      fields.push({ label: 'Recording Personnel:', value: supersededData.recordingPersonnel });
    }
    
    if (supersededData?.tdArpNo) {
      fields.push({ label: 'TDN-ARP No:', value: supersededData.tdArpNo });
    }
    
    if (supersededData?.effectivityOfAssessment) {
      fields.push({ label: 'Effectivity:', value: supersededData.effectivityOfAssessment });
    }
    
    // If no fields to display, return empty
    if (fields.length === 0) return '';
    
    // Arrange fields in 2-column layout
    for (let i = 0; i < fields.length; i += 2) {
      const leftField = fields[i];
      const rightField = fields[i + 1];
      
      if (rightField) {
        // Two fields in one row
        supersededContent += this.renderRow([leftField, rightField]);
      } else {
        // Single field takes full width
        supersededContent += this.renderRow([{ ...leftField, fullWidth: true }]);
      }
    }
    
    return `<div class="section-header">RECORD OF SUPERSEDED ASSESSMENT</div>
${supersededContent}`;
  }

  private static renderOfficialFooterSection(): string {
    const renderSigBox = (title: string, role: string, extra = '') => `<div class="signature-box"><b style="margin-bottom:10px">${title}</b><div class="signature-line"></div><div style="font-size:8px;margin-top:5px"><b>Name & Signature</b><div>${role}</div><div>${extra || 'License No.: _____________'}</div></div><div style="margin-top:15px;font-size:8px">Date: _______________</div></div>`;

    return `<div class="footer-section"><div class="legal-notice"><b>LEGAL NOTICE:</b> This is an official government document issued by the Office of the City/Municipal Assessor. Any unauthorized reproduction, alteration, or misuse of this document is punishable by law under the Revised Penal Code and other applicable laws of the Philippines. This document contains confidential information and should be handled accordingly.</div>
<div class="signature-section">${renderSigBox('APPRAISED BY:', 'Real Property Appraiser')}${renderSigBox('REVIEWED BY:', 'Supervising Appraiser')}${renderSigBox('APPROVED BY:', 'City/Municipal Assessor', 'Position: _______________')}</div>
<div style="text-align:center;margin-top:20px;font-size:8px;border:2px solid #000;padding:10px;background:#f0f0f0"><b style="margin-bottom:5px">CERTIFICATION</b><div>I hereby certify that this Field Appraisal and Assessment Sheet (FAAS) has been prepared in accordance with the provisions of Republic Act No. 7160 (Local Government Code) and other applicable laws and regulations.</div><div style="margin-top:10px">This document is valid for official purposes and legal proceedings.</div></div>
<div style="display:flex;justify-content:space-between;margin-top:15px;font-size:7px;color:#666"><div>Form No.: FAAS-2026</div><div>Revision: 6th</div><div>Effective Date: January 1, ${new Date().getFullYear()}</div></div></div>`;
  }

  public static async printDocument(assessment: any): Promise<void> {
    try {
      // Load the base64 logo
      const logoBase64 = await this.getLogoBase64();

      await Print.printAsync({
        html: this.generatePrintHTML(assessment, logoBase64),
      });
    } catch (error) {
      console.error('Error printing document:', error);
      Alert.alert('Error', 'Failed to print document');
    }
  }

  public static async savePDF(assessment: any): Promise<void> {
    try {
      console.log('📄 Starting PDF generation...');

      // Load the base64 logo
      const logoBase64 = await this.getLogoBase64();
      console.log('🖼️ Logo loaded for PDF');

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const ownerName = assessment?.ownerName || assessment?.owner_details?.owner || 'Unknown';
      const sanitizedOwnerName = ownerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const filename = `FAAS_${sanitizedOwnerName}_${timestamp}.pdf`;

      console.log('📝 Generating PDF with filename:', filename);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: this.generatePrintHTML(assessment, logoBase64),
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

      console.log('✅ PDF generated at:', uri);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('📤 Sharing available:', isAvailable);

      if (isAvailable) {
        console.log('📤 Opening share dialog...');
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save FAAS Report PDF',
          UTI: 'com.adobe.pdf',
        });
        console.log('✅ Share dialog opened successfully');
      } else {
        // Fallback: Show success message with file location
        Alert.alert(
          'PDF Generated',
          `PDF has been generated successfully!\n\nFile location: ${uri}\n\nNote: Sharing is not available on this device. The PDF is saved in the app's temporary directory.`,
          [
            {
              text: 'OK',
              onPress: () => console.log('PDF generation acknowledged by user')
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error saving PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'PDF Generation Failed',
        `Failed to generate PDF: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
        [
          {
            text: 'OK',
            onPress: () => console.log('PDF error acknowledged by user')
          }
        ]
      );
    }
  }

  // Enhanced PDF save method with better file management
  public static async savePDFToDevice(assessment: any): Promise<void> {
    try {
      console.log('💾 Starting enhanced PDF save to device...');

      // Load the base64 logo
      const logoBase64 = await this.getLogoBase64();
      console.log('🖼️ Logo loaded for PDF');

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const ownerName = assessment?.ownerName || assessment?.owner_details?.owner || 'Unknown';
      const sanitizedOwnerName = ownerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const filename = `FAAS_${sanitizedOwnerName}_${timestamp}.pdf`;

      console.log('📝 Generating PDF with filename:', filename);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: this.generatePrintHTML(assessment, logoBase64),
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

      console.log('✅ PDF generated at:', uri);

      // Use sharing for now since MediaLibrary is not available
      console.log('🔄 Using share method (MediaLibrary not available)...');
      await FaasPrintService.sharePDF(uri, filename);
      return;

      /* TODO: Uncomment when expo-media-library is installed
      if (Platform.OS === 'android') {
        // For Android, save to Downloads folder
        try {
          console.log('📱 Android detected, requesting media library permissions...');
          const { status } = await MediaLibrary.requestPermissionsAsync();
          
          if (status === 'granted') {
            console.log('✅ Permissions granted, saving to Downloads...');
            
            // Create asset from the generated PDF
            const asset = await MediaLibrary.createAssetAsync(uri);
            console.log('📄 Asset created:', asset.id);
            
            // Try to get Downloads album, create if it doesn't exist
            let album = await MediaLibrary.getAlbumAsync('Downloads');
            if (album == null) {
              console.log('📁 Creating Downloads album...');
              album = await MediaLibrary.createAlbumAsync('Downloads', asset, false);
            } else {
              console.log('📁 Adding to existing Downloads album...');
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
            
            Alert.alert(
              '✅ PDF Saved Successfully!',
              `The FAAS report has been saved to your Downloads folder:\n\n📄 ${filename}\n\nYou can find it in your device's Downloads folder or file manager.`,
              [{ 
                text: 'OK', 
                onPress: () => console.log('✅ PDF save to Downloads confirmed by user') 
              }]
            );
          } else {
            console.log('❌ Media library permissions denied, falling back to sharing...');
            Alert.alert(
              'Permission Required',
              'To save PDF to Downloads folder, please grant storage permission. Using share dialog instead.',
              [{ text: 'OK' }]
            );
            await this.sharePDF(uri, filename);
          }
        } catch (mediaError) {
          console.log('❌ Media library error, falling back to sharing:', mediaError);
          Alert.alert(
            'Save to Downloads Failed',
            'Could not save to Downloads folder. Using share dialog instead.',
            [{ text: 'OK' }]
          );
          await this.sharePDF(uri, filename);
        }
      } else if (Platform.OS === 'ios') {
        // For iOS, save to Files app
        try {
          console.log('📱 iOS detected, saving to Files app...');
          
          // Create a permanent file in the document directory
          const documentsDir = FileSystem.documentDirectory;
          const permanentUri = `${documentsDir}${filename}`;
          
          // Copy the temporary file to permanent location
          await FileSystem.copyAsync({
            from: uri,
            to: permanentUri
          });
          
          console.log('📄 File copied to permanent location:', permanentUri);
          
          // Share the permanent file
          await Sharing.shareAsync(permanentUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Save ${filename} to Files`,
            UTI: 'com.adobe.pdf',
          });
          
          console.log('✅ iOS save completed');
        } catch (iosError) {
          console.log('❌ iOS save error, falling back to sharing:', iosError);
          await this.sharePDF(uri, filename);
        }
      } else {
        // For other platforms, use sharing
        console.log('🌐 Other platform detected, using share dialog...');
        await this.sharePDF(uri, filename);
      }
      */ // End of MediaLibrary TODO comment block
    } catch (error) {
      console.error('❌ Error saving PDF to device:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'PDF Save Failed',
        `Failed to save PDF: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
        [
          {
            text: 'OK',
            onPress: () => console.log('PDF save error acknowledged by user')
          }
        ]
      );
    }
  }

  // Enhanced save method that actually downloads to device Downloads folder
  public static async saveToDownloads(assessment: any): Promise<void> {
    try {
      console.log('💾 Starting Downloads save...');

      // Load the base64 logo
      const logoBase64 = await this.getLogoBase64();
      console.log('🖼️ Logo loaded for PDF');

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const ownerName = assessment?.ownerName || assessment?.owner_details?.owner || 'Unknown';
      const sanitizedOwnerName = ownerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const filename = `FAAS_${sanitizedOwnerName}_${timestamp}.pdf`;

      console.log('📝 Generating PDF with filename:', filename);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: this.generatePrintHTML(assessment, logoBase64),
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

      console.log('✅ PDF generated at:', uri);

      // Use sharing with specific instructions for downloading
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        console.log('📤 Opening enhanced share dialog for download...');

        Alert.alert(
          '📄 Save PDF to Downloads',
          `Ready to save: ${filename}\n\nTap "Share" then choose:\n• "Save to Files" (iOS)\n• "Download" or file manager (Android)\n• Cloud storage (Google Drive, OneDrive, etc.)`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => console.log('Download cancelled by user')
            },
            {
              text: 'Share & Download',
              onPress: async () => {
                try {
                  await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Download ${filename}`,
                    UTI: 'com.adobe.pdf',
                  });

                  // Show follow-up instructions
                  setTimeout(() => {
                    Alert.alert(
                      '📥 Download Instructions',
                      'To save to Downloads folder:\n\n📱 Android: Choose "Download" or your file manager\n🍎 iOS: Choose "Save to Files" > "Downloads"\n☁️ Cloud: Choose your preferred cloud storage',
                      [{ text: 'Got it!' }]
                    );
                  }, 1000);
                } catch (shareError) {
                  console.error('Share error:', shareError);
                  Alert.alert('Share Failed', 'Could not open share dialog. Please try again.');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Download Not Available',
          `PDF generated successfully but sharing is not available on this device.\n\nFile location: ${uri}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error in saveToDownloads:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Download Failed',
        `Failed to generate PDF for download: ${errorMessage}\n\nPlease try again.`,
        [{ text: 'OK' }]
      );
    }
  }

  // Simplified download method with enhanced sharing
  public static async downloadPDFDirect(assessment: any): Promise<void> {
    try {
      console.log('📥 Starting PDF download...');

      // Load the base64 logo
      const logoBase64 = await this.getLogoBase64();
      console.log('🖼️ Logo loaded for PDF');

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const ownerName = assessment?.ownerName || assessment?.owner_details?.owner || 'Unknown';
      const sanitizedOwnerName = ownerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const filename = `FAAS_${sanitizedOwnerName}_${timestamp}.pdf`;

      console.log('📝 Generating PDF with filename:', filename);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: this.generatePrintHTML(assessment, logoBase64),
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

      console.log('✅ PDF generated at:', uri);

      // Show download instructions and open share dialog
      Alert.alert(
        '📥 Download PDF to Device',
        `File: ${filename}\n\nChoose where to save your PDF:\n\n📱 Android: Select "Downloads" or file manager\n🍎 iOS: Choose "Save to Files" > "Downloads"\n☁️ Cloud: Save to Google Drive, OneDrive, etc.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Download cancelled by user')
          },
          {
            text: 'Open Download Options',
            onPress: async () => {
              try {
                console.log('📤 Opening share dialog for download...');
                await Sharing.shareAsync(uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Download ${filename}`,
                  UTI: 'com.adobe.pdf',
                });

                // Show success tip after a delay
                setTimeout(() => {
                  Alert.alert(
                    '✅ Download Tip',
                    'PDF shared successfully!\n\nTo find your downloaded file:\n• Check your Downloads folder\n• Look in your chosen app (Files, Drive, etc.)\n• Check your device\'s file manager',
                    [{ text: 'Got it!' }]
                  );
                }, 2000);

              } catch (shareError) {
                console.error('Share error:', shareError);
                Alert.alert(
                  'Share Failed',
                  'Could not open download options. Please try again or use the Share PDF button instead.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error in downloadPDFDirect:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Download Failed',
        `Failed to prepare PDF for download: ${errorMessage}\n\nPlease try the Share PDF button instead.`,
        [{ text: 'OK' }]
      );
    }
  }

  // Helper method to share PDF
  private static async sharePDF(uri: string, filename: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    console.log('📤 Sharing available:', isAvailable);

    if (isAvailable) {
      console.log('📤 Opening share dialog...');
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Save ${filename}`,
        UTI: 'com.adobe.pdf',
      });
      console.log('✅ Share dialog opened successfully');
    } else {
      Alert.alert(
        'PDF Generated',
        `PDF has been generated successfully!\n\nFilename: ${filename}\nLocation: ${uri}\n\nNote: Sharing is not available on this device.`,
        [{ text: 'OK', onPress: () => console.log('PDF generation acknowledged by user') }]
      );
    }
  }

  // Enhanced PDF save method that uploads to Appwrite Storage
  public static async savePDFToAppwrite(assessment: any): Promise<{ success: boolean; fileId?: string; url?: string; error?: string }> {
    try {
      console.log('☁️ Starting PDF save to Appwrite Storage...');

      // Load the base64 logo
      const logoBase64 = await this.getLogoBase64();
      console.log('🖼️ Logo loaded for PDF');

      // Generate a unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const ownerName = assessment?.ownerName || assessment?.owner_details?.owner || 'Unknown';
      const sanitizedOwnerName = ownerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const pin = assessment?.pin || assessment?.owner_details?.pin || 'NoPin';
      const filename = `FAAS_${sanitizedOwnerName}_${pin}_${timestamp}.pdf`;

      console.log('📝 Generating PDF with filename:', filename);

      // Generate PDF to temporary file
      const { uri } = await Print.printToFileAsync({
        html: this.generatePrintHTML(assessment, logoBase64),
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

      console.log('✅ PDF generated at temporary location:', uri);

      // Upload PDF to Appwrite Storage
      console.log('☁️ Uploading PDF to Appwrite Storage...');
      const uploadResult = await uploadSingleForDebug(uri);
      
      if (!uploadResult.ok) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      console.log('✅ PDF uploaded successfully:', uploadResult.url);

      // Show success message with options
      Alert.alert(
        '✅ PDF Saved to Cloud',
        `PDF successfully saved to Appwrite Storage!\n\nFile: ${filename}\nURL: ${uploadResult.url}\n\nThe PDF is now accessible from any device and backed up in the cloud.`,
        [
          {
            text: 'Share PDF',
            onPress: async () => {
              try {
                await Sharing.shareAsync(uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Share ${filename}`,
                  UTI: 'com.adobe.pdf',
                });
              } catch (shareError) {
                console.error('Share error:', shareError);
              }
            }
          },
          {
            text: 'OK',
            style: 'default',
            onPress: () => console.log('✅ PDF save to Appwrite acknowledged by user')
          }
        ]
      );

      return {
        success: true,
        url: uploadResult.url
      };

    } catch (error) {
      console.error('❌ Error saving PDF to Appwrite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      Alert.alert(
        'Cloud Save Failed',
        `Failed to save PDF to Appwrite Storage: ${errorMessage}\n\nThe PDF may have been generated locally but could not be uploaded to the cloud. Please check your internet connection and try again.`,
        [
          {
            text: 'Try Local Save',
            onPress: () => this.savePDF(assessment)
          },
          {
            text: 'OK',
            onPress: () => console.log('PDF Appwrite save error acknowledged by user')
          }
        ]
      );

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Enhanced method that saves both locally and to Appwrite
  public static async savePDFBoth(assessment: any): Promise<void> {
    try {
      console.log('💾☁️ Starting dual PDF save (local + Appwrite)...');

      // Load the base64 logo
      const logoBase64 = await this.getLogoBase64();
      console.log('🖼️ Logo loaded for PDF');

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const ownerName = assessment?.ownerName || assessment?.owner_details?.owner || 'Unknown';
      const sanitizedOwnerName = ownerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const pin = assessment?.pin || assessment?.owner_details?.pin || 'NoPin';
      const filename = `FAAS_${sanitizedOwnerName}_${pin}_${timestamp}.pdf`;

      console.log('📝 Generating PDF with filename:', filename);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: this.generatePrintHTML(assessment, logoBase64),
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

      console.log('✅ PDF generated at:', uri);

      // Try to upload to Appwrite in parallel with local sharing
      let appwriteResult: { success: boolean; fileId?: string; url?: string } = { success: false };
      
      try {
        console.log('☁️ Uploading to Appwrite Storage...');
        const uploadResult = await uploadSingleForDebug(uri);
        if (uploadResult.ok) {
          appwriteResult = {
            success: true,
            url: uploadResult.url
          };
          console.log('✅ Appwrite upload successful:', uploadResult.url);
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      } catch (uploadError) {
        console.warn('⚠️ Appwrite upload failed, continuing with local save:', uploadError);
        appwriteResult = { success: false };
      }

      // Show local sharing dialog
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        const statusMessage = appwriteResult.success 
          ? `✅ Saved to Cloud Storage\n📱 Choose local save option below:`
          : `⚠️ Cloud save failed, but PDF is ready for local save:`;

        Alert.alert(
          '📄 Save PDF',
          `${statusMessage}\n\nFile: ${filename}\n\n📱 Android: Choose "Download" or file manager\n🍎 iOS: Choose "Save to Files" > "Downloads"\n☁️ Cloud: Save to Google Drive, OneDrive, etc.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => console.log('PDF save cancelled by user')
            },
            {
              text: 'Save Locally',
              onPress: async () => {
                try {
                  await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Save ${filename}`,
                    UTI: 'com.adobe.pdf',
                  });

                  // Show final status
                  setTimeout(() => {
                    const finalMessage = appwriteResult.success
                      ? `✅ PDF saved successfully!\n\n☁️ Cloud: Backed up to Appwrite Storage\n📱 Local: Available in your chosen location\n\nURL: ${appwriteResult.url}`
                      : `📱 PDF saved locally!\n\n⚠️ Note: Cloud backup failed, but your PDF is saved on this device.`;

                    Alert.alert('Save Complete', finalMessage, [{ text: 'Got it!' }]);
                  }, 1000);
                } catch (shareError) {
                  console.error('Share error:', shareError);
                  Alert.alert('Share Failed', 'Could not open save dialog. Please try again.');
                }
              }
            }
          ]
        );
      } else {
        // Fallback when sharing is not available
        const message = appwriteResult.success
          ? `✅ PDF saved to Appwrite Storage!\n\nURL: ${appwriteResult.url}\nLocal file: ${uri}\n\nNote: Local sharing not available on this device, but PDF is backed up in the cloud.`
          : `PDF generated but could not be saved!\n\nLocal file: ${uri}\nSharing not available and cloud save failed.`;

        Alert.alert('PDF Status', message, [{ text: 'OK' }]);
      }

    } catch (error) {
      console.error('❌ Error in dual PDF save:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'PDF Save Failed',
        `Failed to generate or save PDF: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`,
        [{ text: 'OK' }]
      );
    }
  }

  // Method to retrieve saved PDFs from Appwrite
  public static async listSavedPDFs(): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      console.log('📋 Fetching saved PDFs from Appwrite Storage...');
      
      if (!config.bucketId) {
        throw new Error('Storage bucket not configured');
      }

      // List files in the bucket (PDFs will be mixed with other files)
      const result = await storage.listFiles(config.bucketId);
      
      // Filter for PDF files
      const pdfFiles = result.files.filter((file: any) => 
        file.name.toLowerCase().includes('.pdf') || 
        file.name.toLowerCase().includes('faas') ||
        file.mimeType === 'application/pdf'
      );

      console.log(`✅ Found ${pdfFiles.length} PDF files in storage`);

      return {
        success: true,
        files: pdfFiles
      };

    } catch (error) {
      console.error('❌ Error listing PDFs from Appwrite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Method to download a specific PDF from Appwrite
  public static async downloadPDFFromAppwrite(fileId: string, fileName?: string): Promise<void> {
    try {
      console.log('📥 Downloading PDF from Appwrite Storage:', fileId);
      
      if (!config.bucketId) {
        throw new Error('Storage bucket not configured');
      }

      // Get the file view URL
      const fileUrl = storage.getFileView(config.bucketId, fileId).toString();
      console.log('📄 PDF URL generated:', fileUrl);

      // Use the sharing system to let user save the PDF
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        Alert.alert(
          '📥 Download PDF from Cloud',
          `Ready to download: ${fileName || fileId}\n\nThis will open your device's save options.`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Download',
              onPress: async () => {
                try {
                  // Open the URL which should trigger download/save options
                  await WebBrowser.openBrowserAsync(fileUrl);
                } catch (browserError) {
                  console.error('Browser open error:', browserError);
                  Alert.alert('Download Failed', 'Could not open PDF for download. Please try again.');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'PDF Available',
          `PDF URL: ${fileUrl}\n\nCopy this URL to download the PDF in your browser.`,
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('❌ Error downloading PDF from Appwrite:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert(
        'Download Failed',
        `Failed to download PDF: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    }
  }

  // Silent PDF generation method for sync operations (no user dialogs)
  public static async generatePDFForSync(assessment: any): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log('🔄 Generating PDF for sync operation...');

      // Load the base64 logo with timeout
      let logoBase64 = '';
      try {
        logoBase64 = await Promise.race([
          this.getLogoBase64(),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('Logo loading timeout')), 5000)
          )
        ]);
      } catch (logoError) {
        console.warn('⚠️ Logo loading failed, continuing without logo:', logoError);
        logoBase64 = ''; // Continue without logo
      }

      // Generate a unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const ownerName = assessment?.ownerName || assessment?.owner_details?.owner || 'Unknown';
      const sanitizedOwnerName = ownerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
      const pin = assessment?.pin || assessment?.owner_details?.pin || 'NoPin';
      const filename = `FAAS_${sanitizedOwnerName}_${pin}_${timestamp}.pdf`;

      console.log('📝 Generating PDF with filename:', filename);

      // Generate HTML with error handling
      let htmlContent = '';
      try {
        htmlContent = this.generatePrintHTML(assessment, logoBase64);
        console.log('✅ HTML generated successfully, length:', htmlContent.length);
      } catch (htmlError) {
        console.error('❌ HTML generation failed:', htmlError);
        throw new Error(`HTML generation failed: ${htmlError instanceof Error ? htmlError.message : String(htmlError)}`);
      }

      // Generate PDF with multiple attempts and different configurations
      let pdfUri = '';
      const pdfConfigs = [
        // First attempt: Standard configuration
        {
          html: htmlContent,
          width: 612,
          height: 792,
          base64: false,
          margins: { left: 36, top: 36, right: 36, bottom: 36 }
        },
        // Second attempt: Smaller margins
        {
          html: htmlContent,
          width: 612,
          height: 792,
          base64: false,
          margins: { left: 20, top: 20, right: 20, bottom: 20 }
        },
        // Third attempt: Base64 format
        {
          html: htmlContent,
          width: 612,
          height: 792,
          base64: true,
          margins: { left: 36, top: 36, right: 36, bottom: 36 }
        }
      ];

      for (let i = 0; i < pdfConfigs.length; i++) {
        try {
          console.log(`📄 PDF generation attempt ${i + 1}/${pdfConfigs.length}...`);
          
          const result = await Promise.race([
            Print.printToFileAsync(pdfConfigs[i]),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('PDF generation timeout')), 15000)
            )
          ]);

          pdfUri = result.uri;
          console.log(`✅ PDF generated successfully on attempt ${i + 1}:`, pdfUri);
          break;
        } catch (pdfError) {
          console.warn(`⚠️ PDF generation attempt ${i + 1} failed:`, pdfError);
          if (i === pdfConfigs.length - 1) {
            throw new Error(`All PDF generation attempts failed. Last error: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`);
          }
        }
      }

      if (!pdfUri) {
        throw new Error('PDF generation failed - no URI returned');
      }

      // Verify the PDF file exists and has content
      try {
        const fileInfo = await FileSystem.getInfoAsync(pdfUri);
        if (!fileInfo.exists) {
          throw new Error('PDF file was not created');
        }
        if (fileInfo.size === 0) {
          throw new Error('PDF file is empty');
        }
        console.log('✅ PDF file verified:', { size: fileInfo.size, uri: pdfUri });
      } catch (verifyError) {
        console.warn('⚠️ PDF file verification failed:', verifyError);
        // Continue anyway, maybe the file system check is unreliable
      }

      // Upload PDF to Appwrite Storage with retry
      console.log('☁️ Uploading PDF to Appwrite Storage...');
      let uploadResult;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`📤 Upload attempt ${attempt}/3...`);
          uploadResult = await uploadSingleForDebug(pdfUri);
          
          if (uploadResult.ok) {
            console.log(`✅ Upload successful on attempt ${attempt}:`, uploadResult.url);
            break;
          } else {
            throw new Error(uploadResult.error || 'Upload failed');
          }
        } catch (uploadError) {
          console.warn(`⚠️ Upload attempt ${attempt} failed:`, uploadError);
          if (attempt === 3) {
            throw new Error(`Upload failed after 3 attempts: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (!uploadResult?.ok || !uploadResult?.url) {
        throw new Error('Upload failed - no URL returned');
      }

      console.log('✅ PDF uploaded successfully for sync:', uploadResult.url);

      return {
        success: true,
        url: uploadResult.url
      };

    } catch (error) {
      console.error('❌ Error generating PDF for sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log additional debugging information
      console.error('📊 PDF Generation Debug Info:', {
        assessmentKeys: Object.keys(assessment || {}),
        hasOwnerDetails: !!assessment?.owner_details,
        hasOwnerName: !!(assessment?.ownerName || assessment?.owner_details?.owner),
        platform: Platform.OS,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Test method to debug image loading
  public static async testImageLoading(): Promise<void> {
    try {
      console.log('🧪 Testing image loading...');
      const logoBase64 = await this.getLogoBase64();

      console.log('🎯 Test Results:');
      console.log('- Logo loaded:', logoBase64 ? 'YES' : 'NO');
      console.log('- Data URI length:', logoBase64.length);
      console.log('- Starts with data:', logoBase64.startsWith('data:'));
      console.log('- Contains base64:', logoBase64.includes('base64'));

      Alert.alert(
        'Image Loading Test',
        `Logo loaded: ${logoBase64 ? 'YES' : 'NO'}\nLength: ${logoBase64.length}\nCheck console for details`
      );
    } catch (error) {
      console.error('❌ Test failed:', error);
      Alert.alert('Test Failed', 'Check console for error details');
    }
  }
}
