import axios from "axios";
import { Toast } from "antd-mobile";

// 创建 axios 实例
const instance = axios.create({
  baseURL: '/api',
  timeout: 5000
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 这里脱掉皮，只返回 data
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      const message = data.message || '请求出错了'

      if (status === 401) {
        // 跳转回登录页面
      }

      Toast.show({ content: message, icon: 'fail' })
    } else {
      Toast.show({ content: '网络连接异常', icon: 'fail' })
    }
    return Promise.reject(error)
  }
)

// 专业技巧：
// 通过这种方式，告诉 TS：这个 request 函数返回的是 Promise<any>（或者是具体的业务数据），
// 而不再是 Axios 原生的 AxiosResponse。
const request = <T = any>(config: any): Promise<T> => {
  return instance(config) as unknown as Promise<T>
}

export default request