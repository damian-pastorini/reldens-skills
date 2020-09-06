
const { ErrorManager, sc } = require('@reldens/utils');

class Level
{

    constructor(props)
    {
        // @NOTE: Level.key will be a unique value in the Levels class and the value must be an integer.
        if(!sc.hasOwn(props, 'key') || isNaN(props.key)){
            ErrorManager.error('Invalid Level key.');
        }
        if(!sc.hasOwn(props, 'modifiers') || !props.modifiers.length){
            ErrorManager.error('Modifiers were not specified.');
        }
        this.key = parseInt(props.key);
        this.modifiers = props.modifiers;
        // label could be used for messages like "you have reached level X!":
        this.label = sc.hasOwn(props, 'label') ? props.label : props.key;
        this.requiredExperience = sc.hasOwn(props, 'requiredExperience') ?
            props.requiredExperience : sc.hasOwn(props, 'required_experience') ? props['required_experience'] : 0;
    }

}

module.exports = Level;
