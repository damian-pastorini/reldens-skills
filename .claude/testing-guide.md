# Testing Guide

## Overview

The `@reldens/skills` package uses Node.js built-in test runner for all unit tests. This guide explains how to write and run tests effectively.

## Test Runner

The test runner is located at `tests/run-tests.js` and provides:

- Automatic test file discovery (files starting with `test-` in `tests/unit/`)
- Concurrent test execution
- Filtering support for running specific tests
- Proper error handling and exit codes

## Running Tests

```bash
# Run all tests
npm test

# Watch mode - auto-runs tests on file changes
npm run test:watch

# Filter tests - only runs files containing the filter string
npm run test:filter=attack      # Run attack skill tests
npm run test:filter=level       # Run level-related tests
npm run test:filter=skill       # Run skill tests

# Coverage report
npm run test:coverage
```

## Writing Tests

### Basic Test Structure

```javascript
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const Skill = require('../../lib/skill');
const { TestHelpers } = require('../utils/test-helpers');
const { MockOwner } = require('../fixtures/mocks/mock-owner');

describe('Skill', () => {
    let mockOwner;

    beforeEach(() => {
        mockOwner = new MockOwner();
        TestHelpers.clearEventListeners();
    });

    afterEach(() => {
        TestHelpers.clearEventListeners();
    });

    describe('Constructor', () => {
        it('should initialize with basic properties', () => {
            let skill = new Skill({key: 'test', owner: mockOwner});
            assert.strictEqual(skill.key, 'test');
        });
    });
});
```

### Using Test Helpers

```javascript
const { TestHelpers } = require('../utils/test-helpers');

// Create mock owner
let owner = TestHelpers.createMockOwner('owner-1');

// Create mock target
let target = TestHelpers.createMockTarget('target-1');

// Create mock client for server tests
let client = TestHelpers.createMockClient();

// Clear event listeners (important in beforeEach and afterEach)
TestHelpers.clearEventListeners();

// Wait for condition
await TestHelpers.waitForCondition(() => skill.canActivate, 1500);

// Sleep for specific time
await TestHelpers.sleep(100);
```

### Using Fixtures

```javascript
const { BaseSkillsFixtures } = require('../fixtures/skills/base-skills');
const { BaseLevelsFixtures } = require('../fixtures/levels/base-levels');

// Use predefined skill data
let skillData = {...BaseSkillsFixtures.attackSkill, owner: mockOwner};
let skill = new Attack(skillData);

// Create level with modifiers
let level = BaseLevelsFixtures.createLevelWithModifiers(5, 500);

// Get complete level set
let levels = BaseLevelsFixtures.createLevelSet();
```

### Testing Async Methods

```javascript
it('should execute skill successfully', async () => {
    let skill = new Skill({key: 'test', owner: mockOwner});
    let result = await skill.execute(mockTarget);
    assert.strictEqual(result, true);
});
```

### Testing Events

```javascript
it('should fire LEVEL_UP event', async () => {
    let eventFired = false;
    let eventData = null;

    levelsSet.listenEvent(SkillsEvents.LEVEL_UP, (data) => {
        eventFired = true;
        eventData = data;
    }, 'test-listener');

    await levelsSet.levelUp();

    assert.strictEqual(eventFired, true);
    assert.ok(eventData);
});
```

### Testing Error Conditions

```javascript
it('should return false when skill is not ready', () => {
    let skill = new Skill({owner: mockOwner}); // Missing key
    let result = skill.validate();
    assert.strictEqual(result, false);
    assert.strictEqual(skill.isReady, false);
});
```

## Mock Objects

### MockOwner

Simulates a skill owner (player, NPC, etc.):

```javascript
const { MockOwner } = require('../fixtures/mocks/mock-owner');

let owner = new MockOwner('player-1', {x: 100, y: 100});
owner.stats.atk = 20;
owner.updateStat('hp', 80);
owner.setPosition(150, 150);
```

Properties:
- `id`: Owner identifier
- `position`: {x, y} coordinates
- `stats`: Object with atk, def, hp, mp, aim, dodge, stamina
- `isCasting`: Boolean casting state
- `castingTimer`: Timer reference
- `currentSkills`: Object of available skills
- `events`: EventsManagerSingleton
- `eventsPrefix`: Event namespace

### MockTarget

Simulates a skill target:

```javascript
const { MockTarget } = require('../fixtures/mocks/mock-target');

let target = new MockTarget('enemy-1', {x: 110, y: 110});
target.stats.hp = 50;
target.setPosition(120, 120);
```

Properties:
- `id`: Target identifier
- `position`: {x, y} coordinates
- `stats`: Object with atk, def, hp, mp, aim, dodge, stamina

### MockClient

Simulates a client connection for server-side tests:

```javascript
const { MockClient } = require('../fixtures/mocks/mock-client');

let client = new MockClient();
sender.send({act: 'test', data: 'value'});
sender.broadcast({act: 'test', data: 'value'});

assert.strictEqual(client.sentMessages.length, 1);
assert.strictEqual(client.broadcastMessages.length, 1);

let lastMsg = client.getLastSentMessage();
client.clearMessages();
```

## Assertions

Common assertion patterns:

```javascript
// Equality
assert.strictEqual(skill.key, 'test-skill');
assert.deepStrictEqual(obj1, obj2);

// Truthiness
assert.ok(skill.isReady);
assert.ok(!skill.canActivate);

// Type checking
assert.strictEqual(typeof skill.key, 'string');

// Array/Object checks
assert.ok(Array.isArray(skill.ownerConditions));
assert.strictEqual(modifiers.length, 2);

// Comparison
assert.ok(damage > 0);
assert.ok(newHp < initialHp);
```

## Best Practices

1. **Always clear event listeners** in `beforeEach` and `afterEach` to prevent test interference
2. **Use fixtures** for complex test data instead of creating inline
3. **Test edge cases**: null/undefined inputs, boundary values, error states
4. **Test async properly**: Always use `async/await` for async methods
5. **One assertion per test** when possible for clarity
6. **Descriptive test names**: Use clear, action-oriented descriptions
7. **Mock external dependencies**: Don't rely on external systems in unit tests
8. **Test events**: Verify events are fired with correct data
9. **Test state changes**: Verify object state before and after operations
10. **Use beforeEach**: Set up fresh state for each test

## Test File Naming

All test files must:
- Start with `test-` prefix
- End with `.js` extension
- Be located in `tests/unit/` or subdirectories
- Match the source file they're testing

Examples:
- `lib/skill.js` → `tests/unit/test-skill.js`
- `lib/types/attack.js` → `tests/unit/types/test-attack.js`
- `lib/server/sender.js` → `tests/unit/server/test-sender.js`

## Debugging Tests

```bash
# Run specific test file
npm run test:filter=skill

# Add console.log or debugger in test code
it('should do something', () => {
    console.log('Debug value:', someValue);
    debugger; // Use with --inspect flag
    assert.ok(true);
});

# Run with Node debugger
node --inspect tests/run-tests.js --filter=skill
```

## Common Patterns

### Testing with Modifiers

```javascript
const { Modifier, ModifierConst } = require('@reldens/modifiers');

let modifier = new Modifier({
    key: 'hp-boost',
    propertyKey: 'stats/hp',
    operation: ModifierConst.OPS.INC,
    value: 10
});

// Test modifier application
modifier.apply(mockOwner);
assert.strictEqual(mockOwner.stats.hp, 110);

// Test modifier reversion
modifier.revert(mockOwner);
assert.strictEqual(mockOwner.stats.hp, 100);
```

### Testing with Conditions

```javascript
const { Condition } = require('@reldens/modifiers');

let condition = new Condition({
    key: 'hp-check',
    propertyKey: 'stats/hp',
    conditional: 'gt',
    value: 50
});

assert.strictEqual(condition.isValidOn(mockOwner), true);
```

### Testing Range Validation

```javascript
it('should validate range correctly', () => {
    let skill = new Skill({
        key: 'test',
        owner: mockOwner,
        range: 50
    });

    // In range
    let inRange = skill.isInRange(
        {x: 100, y: 100},
        {x: 110, y: 110}
    );
    assert.strictEqual(inRange, true);

    // Out of range
    let outOfRange = skill.isInRange(
        {x: 0, y: 0},
        {x: 1000, y: 1000}
    );
    assert.strictEqual(outOfRange, false);
});
```

## Coverage

Generate coverage reports to identify untested code:

```bash
npm run test:coverage
```

Coverage reports show:
- Line coverage: Percentage of code lines executed
- Branch coverage: Percentage of conditional branches tested
- Function coverage: Percentage of functions called
- Statement coverage: Percentage of statements executed

Aim for:
- Minimum 80% overall coverage
- 100% coverage for critical paths (damage calculation, level progression)
- All error paths tested
