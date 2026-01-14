import request from '@/utils/https';

export default {
  getAllChildTree(params) {
    return request({
      url: '/blade-system/dept/tree-all-child',
      method: 'get',
      params,
    });
  },
};
