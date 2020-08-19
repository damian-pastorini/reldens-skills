/**
 *
 * Reldens - Physical Attack
 *
 * This attack will use a world object and collisions to validate the target and execute the skill on hit.
 *
 */

const Effect = require('./effect');
const { ErrorManager } = require('@reldens/utils');

class PhysicalEffect extends Effect
{

    constructor(props)
    {
        super(props);
        if(typeof props.owner.executePhysicalSkill !== 'function'){
            ErrorManager.error('Missing executePhysicalAttack required method.');
        }
        // this is our way to remind the users to implement the onHit method:
        if(typeof props.owner.executeOnHit !== 'function'){
            ErrorManager.error('Missing executeOnHit required method. The method should call skill.onHit().');
        }
        if(!{}.hasOwnProperty.call(props, 'magnitude')){
            ErrorManager.error('Missing magnitude property.');
        }
        if(!{}.hasOwnProperty.call(props, 'objectWidth')){
            ErrorManager.error('Missing objectWidth property.');
        }
        if(!{}.hasOwnProperty.call(props, 'objectHeight')){
            ErrorManager.error('Missing objectHeight property.');
        }
        this.magnitude = props.magnitude;
        this.objectWidth = props.objectWidth;
        this.objectHeight = props.objectHeight;
        this.validateTargetOnHit = {}.hasOwnProperty.call(props, 'validateTargetOnHit') ?
            props.validateTargetOnHit : true;
    }

    async runSkillLogic(target)
    {
        this.target = target;
        this.owner.executePhysicalSkill(target, this);
        return false;
    }

    async onHit(hitData)
    {
        if(!this.validateTargetOnHit || ({}.hasOwnProperty.call(hitData, 'target') && hitData.target === this.target)){
            return super.runSkillLogic(hitData.target);
        }
        return false;
    }

}

module.exports = PhysicalEffect;
