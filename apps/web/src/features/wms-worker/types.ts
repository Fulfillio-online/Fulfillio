export type WorkerTab = 'pick' | 'pack' | 'courier' | 'dock';

export type WorkerOrderStage = 'READY_TO_PICK' | 'PICKED' | 'PACKED' | 'DISPATCHED';

export interface WorkerProfile {
  name: string;
  id: string;
  station: string;
  shift: string;
}

export interface WorkerOrder {
  id: string;
  date: string;
  customer: string;
  phone: string;
  address: string;
  itemTitle: string;
  variant: string;
  sku: string;
  bin: string;
  qty: number;
  memoCode: string;
  reseller: string;
  courier: string;
  amount: number;
  stage: WorkerOrderStage;
  selectedForPack?: boolean;
}
