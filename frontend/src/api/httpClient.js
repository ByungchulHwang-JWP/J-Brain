import axios from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.1 });

export const AUTH_SESSION_MESSAGE_KEY = 'jbrain-auth-session-message';

let isRedirectingToLogin = false;

const isApiRequest = (url = '') => {
  if (typeof url !== 'string') return false;
  return url.startsWith('/api/') || url.includes('/api/');
};

export const isAuthError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

export const consumeAuthSessionMessage = () => {
  const message = sessionStorage.getItem(AUTH_SESSION_MESSAGE_KEY);
  if (message) {
    sessionStorage.removeItem(AUTH_SESSION_MESSAGE_KEY);
  }
  return message;
};

axios.interceptors.request.use((config) => {
  NProgress.start();
  const token = localStorage.getItem('ai_access_token');
  if (!token || !isApiRequest(config.url)) return config;

  config.headers = config.headers || {};
  if (!config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    NProgress.done();
    return response;
  },
  (error) => {
    NProgress.done();
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const isLoginRequest = requestUrl.includes('/auth/login');

    if ((status === 401 || status === 403) && isApiRequest(requestUrl) && !isLoginRequest) {
      localStorage.removeItem('ai_access_token');
      sessionStorage.setItem(
        AUTH_SESSION_MESSAGE_KEY,
        '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.'
      );

      if (!isRedirectingToLogin && window.location.pathname !== '/login') {
        isRedirectingToLogin = true;
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);
