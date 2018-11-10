module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	globalSetup: './test/setup.ts',
	// globalTeardown: './test/testStop.ts',
	testMatch: null,
	testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
	testPathIgnorePatterns: ['/node_modules/', '/dist/', '/node_modules/', '/typings/'],
	verbose: true,
	// collectCoverage: true,
	// clearMocks: true,
};
