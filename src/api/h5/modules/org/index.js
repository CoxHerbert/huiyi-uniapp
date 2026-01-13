import request from '@/api/h5/request';

export default {
  getOrgList(params) {
    return request({
      url: '/blade-bip/org/list-cache',
      method: 'GET',
      params,
    });
  },
};
