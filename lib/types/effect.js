/**
 *
 * Reldens - Effect
 *
 * This class provides a skill with modifiers that will be applied on the target object when the skill is executed.
 *
 */

const { ErrorManager } = require('@reldens/utils');
const Skill = require('../skill');
const SkillConst = require('../constants');

class Effect extends Skill
{

    constructor(props)
    {
        super(props);
        this.type = SkillConst.SKILL_TYPE_EFFECT;
        if(!{}.hasOwnProperty.call(props, 'targetEffects')){
            ErrorManager.error('Missing targetEffects for skill.');
        }
        this.targetEffects = props.targetEffects;
    }

    runSkillLogic()
    {
        return this.applyModifiers(this.target);
    }

    applyModifiers(target)
    {
        for(let i of Object.keys(this.targetEffects)){
            let modifier = this.targetEffects[i];
            modifier.target = target;
            let modifierValue = modifier.getModifiedValue();
            let newValue = modifier.applyCriticalValue(modifierValue);
            modifier.setOwnerProperty(modifier.propertyKey, newValue);
        }
    }

}

module.exports = Effect;
