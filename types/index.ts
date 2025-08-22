export interface AppraisalItem {
  id: string;
  description: string;
  buildingCore: string;
  type: string;
  areaInSqm: string;
  unitValue: string;
  percentOfBUCC: string;
  baseMarketValue: string;
  percentDepreciation: string;
  depreciationCost: string;
  marketValue: string;
}

export interface AdministratorBeneficiary {
  name: string;
  address: string;
  tin: string;
  telNo: string;
}

export interface FloorArea {
  id: string;
  floorNumber: string;
  area: string;
}

export interface FloorMaterial {
  id: string;
  floorName: string;
  material: string;
  otherSpecify: string;
}

export interface WallPartition {
  id: string;
  wallName: string;
  material: string;
  otherSpecify: string;
}