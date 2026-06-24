import { defineConfig } from 'vite'

// 赠礼发放策略页面 - 本地开发环境
// 将 API 请求代理到正式环境以解决 CORS 和 Cookie 问题
export default defineConfig({
  // 使用 custom 模式，避免 Vite 尝试解析 HTML 中的 Vue 模板语法
  appType: 'custom',
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 将所有 /api/vip-admin 请求代理到正式环境
      '/api/vip-admin': {
        target: 'https://sub-admin.seeyouyima.com',
        changeOrigin: true,
        // 保留 Cookie 以通过认证
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // 打印代理请求日志（调试用）
            console.log(`[Proxy] ${proxyReq.method} ${proxyReq.path}`);
          });
        }
      }
    }
  }
})