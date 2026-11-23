import { WmsOrder, WmsStationProfile } from './types';

export const INITIAL_STATION_PROFILE: WmsStationProfile = {
  stationId: 'PACK-01',
  stationName: 'Pack Station 01',
  zone: 'Zone A',
  operatorId: 'OP-01',
  operatorName: 'Warehouse Operator',
  shift: 'Active Shift',
};

export const INITIAL_WMS_ORDERS: WmsOrder[] = [];
