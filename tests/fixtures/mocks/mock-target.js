/**
 *
 * Reldens - Mock Target
 *
 */

class MockTarget
{

    constructor(id = 'mock-target-1', position = { x: 110, y: 110 })
    {
        this.id = id;
        this.position = position;
        this.stats = {
            atk: 8,
            def: 6,
            hp: 80,
            maxHp: 80,
            mp: 40,
            maxMp: 40,
            aim: 12,
            dodge: 10,
            stamina: 80,
            speed: 0,
            undefinedProp: 0
        };
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

}

module.exports.MockTarget = MockTarget;
