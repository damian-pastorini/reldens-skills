
const { ErrorManager } = require('@reldens/utils');
const Skill = require('../skill');

class Effect extends Skill
{

    constructor(props)
    {
        super(props);
        if(!{}.hasOwnProperty.call(props, 'targetEffects')){
            ErrorManager.error('Missing targetEffects for skill.');
        }
        this.targetEffects = props.targetEffects;
    }

    runSkillLogic(target)
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
