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


/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/

api.interceptors.request.use(
    (config) => {

        const token = getAuthToken();

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;
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

            /*
            | Do not redirect automatically here if you
            | already handle authentication in App.jsx.
            |
            | If you want automatic redirect, uncomment:
            |
            | window.location.href = "/login";
            */

        }

        return Promise.reject(error);
    }

);


export default api;