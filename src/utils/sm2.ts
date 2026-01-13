import { sm2 } from 'sm-crypto'
import website from '@/api/h5/config/website'

export const encrypt = (data: string) => {
  try {
    return sm2.doEncrypt(data, website.oauth2.publicKey, 0)
  }
  catch {
    return ''
  }
}
