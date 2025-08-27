import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class TumblrOAuth2Api implements ICredentialType {
    name = 'tumblrOAuth2Api';
    extends = ['oAuth2Api'];
    displayName = 'Tumblr OAuth2 API';
    documentationUrl = 'https://www.tumblr.com/docs/api/v2';
    properties: INodeProperties[] = [
        {
            displayName: 'Grant Type',
            name: 'grantType',
            type: 'hidden',
            default: 'authorizationCode',
        },
        {
            displayName: 'Authorization URL',
            name: 'authUrl',
            type: 'hidden',
            default: 'https://www.tumblr.com/oauth2/authorize',
        },
        {
            displayName: 'Access Token URL',
            name: 'accessTokenUrl',
            type: 'hidden',
            default: 'https://api.tumblr.com/v2/oauth2/token',
        },
        {
            displayName: 'Client ID',
            name: 'clientId',
            type: 'string',
            required: true,
            default: '',
        },
        {
            displayName: 'Client Secret',
            name: 'clientSecret',
            type: 'string',
            typeOptions: {
                password: true,
            },
            required: true,
            default: '',
        },
        {
            displayName: 'Scope',
            name: 'scope',
            type: 'hidden',
            default: 'write',
        },
        {
            displayName: 'Auth URI Query Parameters',
            name: 'authQueryParameters',
            type: 'hidden',
            default: '',
        },
        {
            displayName: 'Authentication',
            name: 'authentication',
            type: 'hidden',
            default: 'body',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.accessToken}}',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: 'https://api.tumblr.com/v2',
            url: '/user/info',
            method: 'GET',
        },
    };
}