const GHN = require('giaohangnhanh');

const ghnConfig = {
  token: process.env.GHN_TOKEN,
  shopId: parseInt(process.env.GHN_SHOP_ID),
  testMode: process.env.NODE_ENV !== 'production'
};

const ghn = new GHN(ghnConfig);

module.exports = { ghn, ghnConfig };
