import request from '@/utils/https';

export default {
  getMaterialDetail(params) {
    return request({
      url: '/blade-erp/material/search-material-code',
      method: 'get',
      params,
    });
  },
};
