/**
 *
 * Reldens - Effect
 *
 * This class provides a skill with modifiers that will be applied on the target object when the skill is executed.
 *
 */

const { ErrorManager } = require('@reldens/utils');
const Skill = require('../skill');
const SkillsConst = require('../constants');

class Effect extends Skill
{

    constructor(props)
    {
        super(props);
        this.type = SkillsConst.SKILL_TYPE_EFFECT;
        if(!{}.hasOwnProperty.call(props, 'targetEffects')){
            ErrorManager.error('Missing targetEffects for skill.');
        }
        this.targetEffects = props.targetEffects;
    }

    runSkillLogic()
    {
        return this.applyModifiers(this.target);
    }

    applyTargetModifiers(target)
    {
        this.applyModifiers(this.targetEffects, target);
    }

}

module.exports = Effect;
