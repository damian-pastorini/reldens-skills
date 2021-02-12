/**
 *
 * Reldens - Physical Attack
 *
 * This attack will require a world object and collisions to validate the target and execute the skill on hit.
 *
 */

const { ErrorManager, sc } = require('@reldens/utils');
const Attack = require('./attack');
const SkillsConst = require('../constants');
const SkillsEvents = require('../skills-events');

class PhysicalAttack extends Attack
{

    constructor(props)
    {
        super(props);
        this.type = SkillsConst.SKILL_TYPE_PHYSICAL_ATTACK;
        if(typeof props.owner.executePhysicalSkill !== 'function'){
            ErrorManager.error('Missing executePhysicalAttack required method.');
        }
        if(!sc.hasOwn(props, 'magnitude')){
            ErrorManager.error('Missing magnitude property.');
        }
        if(!sc.hasOwn(props, 'objectWidth')){
            ErrorManager.error('Missing objectWidth property.');
        }
        if(!sc.hasOwn(props, 'objectHeight')){
            ErrorManager.error('Missing objectHeight property.');
        }
        this.magnitude = props.magnitude;
        this.objectWidth = props.objectWidth;
        this.objectHeight = props.objectHeight;
        this.validateTargetOnHit = sc.hasOwn(props, 'validateTargetOnHit') ?
            props.validateTargetOnHit : false;
        // @TODO - BETA - Include range limit validation and automatic physic body destroy.
    }

    async runSkillLogic()
    {
        if(!this.validateRange(this.target)){
            // out of range, the owner or the target could moved away
            return false;
        }
        await this.owner.executePhysicalSkill(this.target, this);
        return false;
    }

    async executeOnHit(target)
    {
        await this.fireEvent(SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT, this, target);
        if(!this.validateTargetOnHit || target === this.target){
            return await super.runSkillLogic(target);
        }
        return false;
    }

}

module.exports = PhysicalAttack;
