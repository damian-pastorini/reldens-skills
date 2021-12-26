/**
 *
 * Reldens - Skills - Physical Attack
 *
 * This attack will require a world object and collisions to validate the target and execute the skill on hit.
 *
 */

const Attack = require('./attack');
const { PhysicalPropertiesValidator } = require('./physical-properties-validator');
const { PhysicalSkillRunner } = require('./physical-skill-runner');
const SkillsConst = require('../constants');
const SkillsEvents = require('../skills-events');
const { sc } = require('@reldens/utils');

class PhysicalAttack extends Attack
{

    constructor(props)
    {
        super(props);
        this.type = SkillsConst.SKILL_TYPE_PHYSICAL_ATTACK;
        PhysicalPropertiesValidator.validate(props);
        this.magnitude = props.magnitude;
        this.objectWidth = props.objectWidth;
        this.objectHeight = props.objectHeight;
        this.validateTargetOnHit = sc.getDef(props, 'validateTargetOnHit', false);
        // @TODO - BETA - Include range limit validation and automatic physic body destroy.
    }

    async runSkillLogic()
    {
        return PhysicalSkillRunner.runSkillLogic(this);
    }

    async executeOnHit(target)
    {
        return PhysicalSkillRunner.executeOnHit(target, this, SkillsEvents.SKILL_PHYSICAL_ATTACK_HIT, (target) => {
            super.runSkillLogic(target);
        });
    }

}

module.exports = PhysicalAttack;
