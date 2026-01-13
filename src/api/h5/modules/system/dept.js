import request from '@/api/h5/request';

export default {
  getAllChildTree(params) {
    return request({
      url: '/blade-system/dept/tree-all-child',
      method: 'get',
      params,
    });
  },
};
