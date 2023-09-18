import * as dotenv from 'dotenv';
import { parse } from 'node-html-parser';
import makeFetchCookie from 'fetch-cookie';
import { LeveradeLicense, LeveradeResponseContent } from './types';

dotenv.config();

const AUTHORIZATION_URL = 'https://accounts.leverade.com/oauth/authorize';
const LOGIN_URL = 'https://accounts.leverade.com/login';
const TOKEN_URL = 'https://api.leverade.com/oauth/token';
const API_URL = 'https://api.leverade.com';

export default class Leverade {
  private clientId: string;
  private clientSecret: string;
  private userId: string;
  private userEmail: string;
  private userPassword: string;
  private fetchCookie: ReturnType<typeof makeFetchCookie<RequestInfo | URL, RequestInit, Response>>;
  private accessToken: string = '';

  constructor() {
    if (process.env.LEVERADE_CLIENT_ID) {
      this.clientId = process.env.LEVERADE_CLIENT_ID;
    } else {
      console.error('Client ID is missing');
      process.exit(1);
    }

    if (process.env.LEVERADE_CLIENT_SECRET) {
      this.clientSecret = process.env.LEVERADE_CLIENT_SECRET;
    } else {
      console.error('Client secret is missing');
      process.exit(1);
    }

    if (process.env.LEVERADE_USER_ID) {
      this.userId = process.env.LEVERADE_USER_ID;
    } else {
      console.error('User ID is missing');
      process.exit(1);
    }

    if (process.env.LEVERADE_USER_EMAIL) {
      this.userEmail = process.env.LEVERADE_USER_EMAIL;
    } else {
      console.error('User email is missing');
      process.exit(1);
    }

    if (process.env.LEVERADE_USER_PASSWORD) {
      this.userPassword = process.env.LEVERADE_USER_PASSWORD;
    } else {
      console.error('User password is missing');
      process.exit(1);
    }

    this.fetchCookie = makeFetchCookie(fetch);
  }

  public initialise = async (): Promise<void> => {
    await this.logIn();
    const requestToken = await this.getRequestToken();
    this.accessToken = await this.getAccessToken(requestToken);
  };

  private logIn = async (): Promise<void> => {
    console.log('Retrieving login token...');
    const loginPageResponse = await this.fetchCookie(LOGIN_URL);
    const parsedLoginPageBody = parse(await loginPageResponse.text());
    const loginTokenInput = parsedLoginPageBody.querySelector('[name=_token]');
    if (!loginTokenInput?.attrs?.value) {
      console.error('No login token found');
      process.exit(1);
    }
    const loginToken = loginTokenInput.attrs.value;
    // console.debug({ loginToken });

    console.log('Logging in...');
    await this.fetchCookie(LOGIN_URL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: new URLSearchParams({
        _token: loginToken,
        email: this.userEmail,
        password: this.userPassword,
      }),
      redirect: 'manual',
    });
    console.log('Successfully logged in.');
  };

  private getRequestToken = async (): Promise<string> => {
    let requestToken: string | undefined;

    console.log('Retrieving authorization token...');
    const authorizePageResponse = await this.fetchCookie(
      `${AUTHORIZATION_URL}?` +
        new URLSearchParams({
          client_id: this.clientId,
          redirect_uri: 'https://tchoukball.ch',
          response_type: 'code',
          user_id: this.userId,
        }),
      {
        redirect: 'manual',
      }
    );

    // Checking if the response already contains the request token. This can happen if we're already authorized.
    try {
      requestToken = this.getRequestTokenFromResponse(authorizePageResponse);
    } catch (error) {
      // No request token yet. That's okay we'll get it further down.
    }

    if (requestToken) {
      console.log('Already authorized. Skipping authorizing');
    } else {
      const parsedAuthorizationPageBody = parse(await authorizePageResponse.text());
      const authorizationTokenInput = parsedAuthorizationPageBody.querySelector('[name=_token]');
      if (!authorizationTokenInput?.attrs?.value) {
        console.error('No authorization token found');
        process.exit(1);
      }
      const authorizationToken = authorizationTokenInput.attrs.value;
      // console.debug({ authorizationToken });

      console.log('Authorizing...');
      const authorizingResponse = await this.fetchCookie(AUTHORIZATION_URL, {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        credentials: 'include',
        body: new URLSearchParams({
          _token: authorizationToken,
          state: '',
          client_id: this.clientId,
        }),
        redirect: 'manual',
      });

      requestToken = this.getRequestTokenFromResponse(authorizingResponse);
    }
    console.log('Request token retrieved.');

    return requestToken;
  };

  private getAccessToken = async (requestToken: string) => {
    console.log('Retrieving access token...');
    const tokenResponse = await this.fetchCookie(TOKEN_URL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
      body: new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: 'https://tchoukball.ch',
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: requestToken,
      }),
    });
    const data = await tokenResponse.json();
    console.log('Access token retrieved.');
    return data.access_token;
  };

  /**
   * Checks the Location header of a response for a `code` query string, which represents the request token
   */
  private getRequestTokenFromResponse = (response: Response): string => {
    const locationHeader = response.headers.get('location');
    if (!locationHeader) {
      throw new Error('No location header');
    }

    // console.debug({ locationHeader });

    const locationUrl = new URL(locationHeader);
    const requestToken = locationUrl.searchParams.get('code');

    // console.debug({ requestToken });

    if (!requestToken) {
      throw new Error('No code in redirect URL');
    }

    return requestToken;
  };

  public sendRequest = async <T = any>(
    endpoint: string,
    options?: {
      method?: string;
      body?: string;
      headers?: HeadersInit;
      filter?: string;
      pageNumber?: number;
      pageSize?: number;
    }
  ): Promise<LeveradeResponseContent<T>> => {
    console.log(`Sending request to /${endpoint}...`);

    let searchParams: any = {};
    if (options?.filter) {
      searchParams.filter = options.filter;
    }
    if (options?.pageNumber) {
      searchParams['page[number]'] = options.pageNumber.toString();
    }
    if (options?.pageSize) {
      searchParams['page[size]'] = options.pageSize.toString();
    }

    const fetchRequestInit = {
      method: options?.method || 'GET',
      body: options?.body,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/vnd.api+json',
        ...options?.headers,
      },
    };

    const url = `${API_URL}/${endpoint}?` + new URLSearchParams(searchParams);

    // For debugging
    // console.debug({url});
    // console.debug({fetchRequestInit});

    const response = await fetch(url, fetchRequestInit);

    if (response.status >= 400) {
      console.log(await response.text());
    }

    return (await response.json()) as LeveradeResponseContent<T>;
  };
}
