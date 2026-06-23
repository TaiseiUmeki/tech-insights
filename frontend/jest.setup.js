import '@testing-library/jest-dom';

// MSW サーバーのセットアップ
import { server } from './src/__tests__/mocks/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
