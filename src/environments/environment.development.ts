const apiPath = '/api/';
const backendHost = '127.0.0.1:8000';
const backendUrl = `http://${backendHost}`;
const apiUrl = `${backendUrl}${apiPath}`;

const title = 'Provetrina';

export const environment = { title, apiUrl, apiPath, backendUrl, backendHost };
