/**
 *
 * Reldens - Mock Owner
 *
 */

const { EventsManagerSingleton } = require('@reldens/utils');

class MockOwner
{

    constructor(id = 'mock-owner-1', position = { x: 100, y: 100 })
    {
        this.id = id;
        this.events = EventsManagerSingleton;
        this.eventsPrefix = 'skills.ownerId.'+id;
        this.position = position;
        this.stats = {
            atk: 10,
            def: 5,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            aim: 15,
            dodge: 8,
            stamina: 100
        };
        this.isCasting = false;
        this.castingTimer = false;
        this.currentSkills = {};
    }

    getPosition()
    {
        return this.position;
    }

    setPosition(x, y)
    {
        this.position.x = x;
        this.position.y = y;
    }

    updateStat(key, value)
    {
        if(!this.stats[key]){
            this.stats[key] = 0;
        }
        this.stats[key] = value;
    }

    eventUniqueKey()
    {
        return 'skills.ownerId.'+this.id+'.uKey.'+Date.now();
    }

}

module.exports.MockOwner = MockOwner;
