import { TumblrOAuth2Api } from '../credentials/TumblrOAuth2Api.credentials';

describe('TumblrOAuth2Api', () => {
    let credentials: TumblrOAuth2Api;

    beforeEach(() => {
        credentials = new TumblrOAuth2Api();
    });

    describe('Credential Configuration', () => {
        it('should have correct name and display name', () => {
            expect(credentials.name).toBe('tumblrOAuth2Api');
            expect(credentials.displayName).toBe('Tumblr OAuth2 API');
        });

        it('should extend oAuth2Api', () => {
            expect(credentials.extends).toEqual(['oAuth2Api']);
        });

        it('should have correct documentation URL', () => {
            expect(credentials.documentationUrl).toBe('https://www.tumblr.com/docs/api/v2');
        });

        it('should have required properties configured', () => {
            const clientIdProperty = credentials.properties.find(p => p.name === 'clientId');
            const clientSecretProperty = credentials.properties.find(p => p.name === 'clientSecret');

            expect(clientIdProperty).toBeDefined();
            expect(clientIdProperty?.required).toBe(true);
            expect(clientSecretProperty).toBeDefined();
            expect(clientSecretProperty?.required).toBe(true);
            expect(clientSecretProperty?.typeOptions?.password).toBe(true);
        });

        it('should have correct OAuth URLs configured', () => {
            const authUrlProperty = credentials.properties.find(p => p.name === 'authUrl');
            const accessTokenUrlProperty = credentials.properties.find(p => p.name === 'accessTokenUrl');

            expect(authUrlProperty?.default).toBe('https://www.tumblr.com/oauth2/authorize');
            expect(accessTokenUrlProperty?.default).toBe('https://api.tumblr.com/v2/oauth2/token');
        });

        it('should have correct scope configured', () => {
            const scopeProperty = credentials.properties.find(p => p.name === 'scope');
            expect(scopeProperty?.default).toBe('write');
        });
    });

    describe('Authentication', () => {
        it('should configure Bearer token authentication', () => {
            expect(credentials.authenticate.type).toBe('generic');
            expect(credentials.authenticate.properties.headers).toBeDefined();
            expect(credentials.authenticate.properties.headers?.Authorization).toBe('=Bearer {{$credentials.accessToken}}');
        });
    });

    describe('Credential Test', () => {
        it('should have correct test configuration', () => {
            expect(credentials.test.request.baseURL).toBe('https://api.tumblr.com/v2');
            expect(credentials.test.request.url).toBe('/user/info');
            expect(credentials.test.request.method).toBe('GET');
        });
    });
});