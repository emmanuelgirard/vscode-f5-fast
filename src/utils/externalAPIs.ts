'use strict';

import * as vscode from 'vscode';
import { request } from 'https';
import axios, { AxiosRequestConfig } from 'axios';
var https = require('https');
// import { ext } from './extensionVariables';

/**
 * external API commands
 */


/**
 * calls external HTTP APIs based on axsios.request parameters
 * https://github.com/axios/axios#request-config
 * 
 * @param req AxiosRequestConfig options
 */
export async function makeRequest(req: AxiosRequestConfig) {

    console.log('external http pre-Opts', JSON.stringify(req));

    // const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    
    // rewrite req object with defaults
    req = {
        url: req.url,
        method: req['method'] || 'GET',
        data: req['data'] || null,
        httpsAgent: new https.Agent({
            rejectUnauthorized: false
        }),
    };

    console.log('external http defaults-Opts', JSON.stringify(req));

    const resp = await axios.request(req)
    .then( resp => {
        return resp;
    })
    .catch(function (error) {
        // debugger;
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            // console.error(error.response.data);
            // console.error(error.response.status);
            // console.error(error.response.headers);

            const status = error.response.status;
            const message = error.response.data.message;

            vscode.window.showErrorMessage(`HTTP_FAILURE: ${status} - ${message}`);
            console.error(`HTTP_FAILURE: ${status} - ${message} - ${JSON.stringify(error.response.data)}`);
            throw new Error(`HTTP_FAILURE: ${status} - ${message}`);
        // } else if (error.request) {
        //   // The request was made but no response was received
        //   // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        //   // http.ClientRequest in node.js
        //   console.log('AuthHttpErrorRequest', error.request);
        } else if (error.code && error.message){
            // console.error('HTTP-response-error:', error);
            console.error(`HTTP_response_error: ${error.code} - ${error.message}`);
            vscode.window.showErrorMessage(`${error.code} - ${error.message}`);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('AuthHttpError', error.message);
        }
        // console.error('AuthHttpConfigError',error.config);
        console.error('AuthHttpFULLError',error);
    });

    return resp;
}


export function callHTTPS(opts: object, payload: object = {}): Promise<any> {


    console.log('callHTTPS---OPTS: ' + JSON.stringify(opts));
    console.log('callHTTTS---payload: ' + JSON.stringify(payload));
    
    // console.log('Bout to call API token request')
    return new Promise((resolve, reject) => {
        const req = request(opts, (res) => {
            const buffer: any = [];
            res.setEncoding('utf8');
            // console.log('Sending::: ' )
            res.on('data', (data) => {
                buffer.push(data);
            });
            res.on('end', () => {
                let body = buffer.join('');
                body = body || '{}';

                try {
                    body = JSON.parse(body);
                } catch (e) {
                    return reject(new Error(`Invalid response object ${opts}`));
                };
                
                 // configure global logging parameters
                console.log('callHTTPS***STATUS: ' + res.statusCode);
                console.log('callHTTPS***HEADERS: ' + JSON.stringify(res.headers));
                console.log('callHTTPS***BODY: ' + JSON.stringify(body));
                // console.log('callHTTPS***BODY: ' + body);

                // if (res.statusCode == 401) {
                //     console.log(`GOT 401!!!!!`)
                // }
                
                const goodResp: Array<number> = [200, 201, 202];
                // was trying to check against array above with arr.includes or arr.indexOf
                if (res.statusCode === 200 ) {
                    // console.log(`CAUGHT 200: `)
                    return resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body
                    });
                } else {

                    console.error(`HTTP FAILURE: ${res.statusCode} - ${res.statusMessage}`);
                    return reject(new Error(`HTTP - ${res.statusCode} - ${res.statusMessage}`));
                }
            });
        });
        console.log(`req in callHTTPS: ${JSON.stringify(req)}`);

        req.on('error', (e) => {
            // might need to stringify combOpts for proper log output
            // reject(new Error(`${opts}:${e.message}`));
            reject(new Error(`${opts}:${e.message}`));
        });

        // if a payload was passed in, post it!
        if (payload) {
            req.write(JSON.stringify(payload));
        }
        req.end();
    });
};

export function callHTTPSsync(opts: object, payload: object = {}) {


    console.log('callHTTPS---OPTS: ' + JSON.stringify(opts));
    console.log('callHTTTS---payload: ' + JSON.stringify(payload));
    
    // console.log('Bout to call API token request')
    // return new Promise((resolve, reject) => {
        const req = request(opts, (res) => {
            const buffer: any = [];
            res.setEncoding('utf8');
            // console.log('Sending::: ' )
            res.on('data', (data) => {
                buffer.push(data);
            });
            res.on('end', () => {
                let body = buffer.join('');
                body = body || '{}';

                // try {
                //     body = JSON.parse(body);
                // } catch (e) {
                //     return reject(new Error(`Invalid response object ${opts}`));
                // };
                
                 // configure global logging parameters
                console.log('callHTTPS***STATUS: ' + res.statusCode);
                console.log('callHTTPS***HEADERS: ' + JSON.stringify(res.headers));
                // console.log('callHTTPS***BODY: ' + JSON.stringify(body));
                console.log('callHTTPS***BODY: ' + body);

                // if (res.statusCode == 401) {
                //     console.log(`GOT 401!!!!!`)
                // }
                
                const goodResp: Array<number> = [200, 201, 202];
                // was trying to check against array above with arr.includes or arr.indexOf
                if (res.statusCode === 200 ) {
                    console.log(`CAUGHT 200: `);
                    return {
                        status: res.statusCode,
                        headers: res.headers,
                        body
                    };
                } else {

                    console.error(`HTTP FAILURE: ${res.statusCode} - ${res.statusMessage}`);
                    new Error(`HTTP - ${res.statusCode} - ${res.statusMessage}`);
                }
            });
        });
        console.log(`req in callHTTPS: ${req}`);

        req.on('error', (e) => {
            // might need to stringify combOpts for proper log output
            // reject(new Error(`${opts}:${e.message}`));
            new Error(`${opts}:${e.message}`);
        });

        // if a payload was passed in, post it!
        if (payload) {
            req.write(JSON.stringify(payload));
        }
        req.end();
    // });
};



// const getAuthToken = async (host: string, username: string, password: string) => callHTTPS({
//     host,
//     path: '/mgmt/shared/authn/login',
//     method: 'POST',
// }, 
// { 
//     username,
//     password
// })
// .then( response => {
//     if (response.status === 200) {
//         return { 
//             host: host, 
//             token: response.body.token.token 
//         }
//     } else {
//         // clear cached password for this device
//         // ext.keyTar.deletePassword(
//         //     'f5Hosts',
//         //     `${username}@${host}`
//         //     )
//         //     throw new Error(`error from getAuthTokenNOT200: ${response}`);
//     }
    
//     // if (response.status != 200) {
//     //     // clear cached password for this device
//     //     ext.keyTar.deletePassword(
//     //         'f5Hosts',
//     //         `${username}@${host}`
//     //         )
//     //     throw new Error(`error from getAuthTokenNOT200: ${response}`);
//     // }
//     // return { 
//     //     host: host, 
//     //     token: response.body.token.token 
//     // };
// });


const callHTTP = (method: string, host: string, path: string, token: string, payload: object = {}) => callHTTPS(
    {
        method,
        host,
        path,
        headers: {
            'Content-Type': 'application/json',
            'X-F5-Auth-Token': token
        }
    },
    payload
)
.then( response => {
    console.log('response from callHTTP: ' + JSON.stringify(response));
    // Promise.resolve(value.body.token);
    return response;
});


