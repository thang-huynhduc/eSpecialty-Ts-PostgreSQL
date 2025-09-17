import { Ghn } from 'giaohangnhanh';


const ghnConfig = {
  token: process.env.GHN_TOKEN,
  shopId: parseInt(process.env.GHN_SHOP_ID),
  host: 'https://dev-online-gateway.ghn.vn',
  trackingHost: 'https://tracking.ghn.dev/',
  testMode: process.env.NODE_ENV !== 'production'
};

const ghn = new Ghn(ghnConfig);

export { ghn, ghnConfig };
