export interface ThermalReceiptItem {
  label: string;
  quantity: number;
  unitPriceMxn: number;
  totalMxn: number;
}

export interface ThermalReceipt {
  id: string;
  walletTxId: string;
  merchantName: string;
  items: ThermalReceiptItem[];
  subtotalMxn: number;
  ivaMxn: number;
  totalMxn: number;
  cashGivenMxn: number;
  changeMxn: number;
  barcode: string;
  createdAt: string;
  isDemo: boolean;
  demoLabel?: string;
  fiscalDisclaimer: string;
}
