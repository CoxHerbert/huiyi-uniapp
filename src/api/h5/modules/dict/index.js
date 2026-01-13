import request from '@/api/h5/request';

export default {
  getDict(params) {
    return request({
      url: '/blade-system/dict-biz/dictionary',
      method: 'get',
      params,
    });
  },
};
