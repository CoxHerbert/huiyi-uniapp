import request from '@/api/h5/request';

export default {
  getMaterialDetail(params) {
    return request({
      url: '/blade-erp/material/search-material-code',
      method: 'get',
      params,
    });
  },
};
