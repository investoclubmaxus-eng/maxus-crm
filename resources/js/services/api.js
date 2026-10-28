import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    headers: {
        Accept: "application/json",
    },
});

/*
|--------------------------------------------------------------------------
| Get Authentication Token
|--------------------------------------------------------------------------
|
| Login stores the token as:
| localStorage.auth_token
| OR
| sessionStorage.auth_token
|
*/

const getAuthToken = () => {
    return (
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token")
    );
};

const getActiveCompany = () => {
    try {
        const raw =
            localStorage.getItem("active_company") ||
            sessionStorage.getItem("active_company");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
    (config) => {
        const token = getAuthToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const activeCompany = getActiveCompany();
        if (activeCompany?.id && !config.headers["X-Company-Id"]) {
            config.headers["X-Company-Id"] = String(activeCompany.id);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("auth_token");
            sessionStorage.removeItem("auth_token");
        }
        return Promise.reject(error);
    }
);

export default api;
