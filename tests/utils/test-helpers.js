/**
 *
 * Reldens - Test Helpers
 *
 */

const { EventsManagerSingleton } = require('@reldens/utils');

class TestHelpers
{

    static createMockOwner(id = 'test-owner', additionalProps = {})
    {
        return {
            id: id,
            events: EventsManagerSingleton,
            eventsPrefix: 'skills.ownerId.'+id,
            getPosition: () => ({ x: 100, y: 100 }),
            stats: {
                atk: 10,
                def: 5,
                hp: 100,
                mp: 50,
                aim: 15,
                dodge: 8
            },
            isCasting: false,
            castingTimer: false,
            ...additionalProps
        };
    }

    static createMockTarget(id = 'test-target', additionalProps = {})
    {
        return {
            id: id,
            getPosition: () => ({ x: 110, y: 110 }),
            stats: {
                atk: 8,
                def: 6,
                hp: 80,
                mp: 40,
                aim: 12,
                dodge: 10
            },
            ...additionalProps
        };
    }

    static createMockClient()
    {
        let sentMessages = [];
        let broadcastMessages = [];
        return {
            sentMessages: sentMessages,
            broadcastMessages: broadcastMessages,
            send: (message) => {
                sentMessages.push(message);
            },
            broadcast: (message) => {
                broadcastMessages.push(message);
            },
            clearMessages: () => {
                sentMessages.length = 0;
                broadcastMessages.length = 0;
            }
        };
    }

    static createMockModifier(key, operation, value, propertyKey = null)
    {
        return {
            key: key,
            operation: operation,
            value: value,
            propertyKey: propertyKey || key,
            apply: function(target){
                if(!target){
                    return false;
                }
                return true;
            },
            revert: function(target){
                if(!target){
                    return false;
                }
                return true;
            }
        };
    }

    static clearEventListeners()
    {
        EventsManagerSingleton.removeAllListeners();
    }

    static generateUniqueId(prefix = 'test')
    {
        return prefix+'-'+Date.now()+'-'+Math.random().toString(36).substring(2, 9);
    }

    static async waitForCondition(condition, timeout = 1000, interval = 50)
    {
        let elapsed = 0;
        while(elapsed < timeout){
            if(condition()){
                return true;
            }
            await this.sleep(interval);
            elapsed = elapsed + interval;
        }
        return false;
    }

    static sleep(ms)
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

module.exports.TestHelpers = TestHelpers;
