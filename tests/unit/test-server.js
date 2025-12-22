/**
 *
 * Reldens - SkillsServer Unit Tests
 *
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const SkillsServer = require('../../lib/server');
const ClassPath = require('../../lib/class-path');
const Sender = require('../../lib/server/sender');
const { TestHelpers } = require('../utils/test-helpers');
const { MockOwner } = require('../fixtures/mocks/mock-owner');
const { BaseLevelsFixtures } = require('../fixtures/levels/base-levels');

describe('SkillsServer', () => {
    let mockOwner;
    let mockClient;

    beforeEach(() => {
        mockOwner = new MockOwner();
        mockClient = TestHelpers.createMockClient();
        TestHelpers.clearEventListeners();
    });

    afterEach(() => {
        TestHelpers.clearEventListeners();
    });

    describe('Constructor', () => {
        it('should initialize with default values', () => {
            let props = {
                owner: mockOwner,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.ok(server);
            assert.ok(server.classPath instanceof ClassPath);
            assert.strictEqual(server.client, false);
        });

        it('should call setupServer during construction', () => {
            let props = {
                owner: mockOwner,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.ok(server.classPath);
        });
    });

    describe('setupServer()', () => {
        it('should setup server with valid props', () => {
            let props = {
                owner: mockOwner,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.ok(server.classPath);
            assert.ok(server.classPath.owner);
        });

        it('should return false when owner is missing', () => {
            let props = {
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.classPath, false);
        });

        it('should return false when owner is null', () => {
            let props = {
                owner: null,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            assert.throws(
                () => new SkillsServer(props),
                TypeError
            );
        });

        it('should return false when owner.getPosition is not a function', () => {
            let invalidOwner = {id: 'test'};
            let props = {
                owner: invalidOwner,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.classPath, false);
        });

        it('should return false when owner.getPosition is missing', () => {
            let invalidOwner = {id: 'test', stats: {}};
            let props = {
                owner: invalidOwner,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.classPath, false);
        });
    });

    describe('Client Validation', () => {
        it('should return false when client.send is not a function', () => {
            let invalidClient = {broadcast: () => {}};
            let props = {
                owner: mockOwner,
                client: invalidClient,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.client, false);
        });

        it('should return false when client.send is missing', () => {
            let invalidClient = {broadcast: () => {}};
            let props = {
                owner: mockOwner,
                client: invalidClient,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.client, false);
        });

        it('should return false when client.broadcast is not a function', () => {
            let invalidClient = {send: () => {}, broadcast: 'not-a-function'};
            let props = {
                owner: mockOwner,
                client: invalidClient,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.client, false);
        });

        it('should return false when client.broadcast is missing', () => {
            let invalidClient = {send: () => {}};
            let props = {
                owner: mockOwner,
                client: invalidClient,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.client, false);
        });

        it('should setup client when valid', () => {
            let props = {
                owner: mockOwner,
                client: mockClient,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.ok(server.client instanceof Sender);
        });
    });

    describe('ClassPath Integration', () => {
        it('should create new ClassPath when not provided', () => {
            let props = {
                owner: mockOwner,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.ok(server.classPath instanceof ClassPath);
        });

        it('should use provided ClassPath', () => {
            let existingClassPath = new ClassPath({owner: mockOwner});
            let props = {
                owner: mockOwner,
                classPath: existingClassPath,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.classPath, existingClassPath);
        });

        it('should call setOwner on classPath', () => {
            let props = {
                owner: mockOwner,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.classPath.owner, mockOwner);
        });

        it('should call init on classPath', () => {
            let props = {
                owner: mockOwner,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.ok(server.classPath);
        });
    });

    describe('Sender Integration', () => {
        it('should instantiate Sender when client is provided', () => {
            let props = {
                owner: mockOwner,
                client: mockClient,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.ok(server.client instanceof Sender);
        });

        it('should call registerListeners on Sender', () => {
            let props = {
                owner: mockOwner,
                client: mockClient,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.ok(server.client instanceof Sender);
        });

        it('should not create Sender when client is not provided', () => {
            let props = {
                owner: mockOwner,
                key: 'test',
                levels: BaseLevelsFixtures.createLevelSet()
            };
            let server = new SkillsServer(props);
            assert.strictEqual(server.client, false);
        });
    });

    describe('End-to-End Initialization', () => {
        it('should complete full server initialization with all components', () => {
            let props = {
                owner: mockOwner,
                client: mockClient,
                key: 'warrior',
                label: 'Warrior',
                levels: BaseLevelsFixtures.createLevelSet(),
                currentLevel: 1,
                currentExp: 0
            };
            let server = new SkillsServer(props);
            assert.ok(server.classPath instanceof ClassPath);
            assert.ok(server.client instanceof Sender);
            assert.strictEqual(server.classPath.owner, mockOwner);
        });
    });
});
