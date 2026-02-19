/**
 *
 * Reldens - Skills - Level
 *
 */

const { Logger, sc } = require('@reldens/utils');

class Level
{

    constructor(props)
    {
        // @NOTE: Level.key will be a unique value in the Levels class and the value must be an integer.
        if(!sc.hasOwn(props, 'key') || isNaN(props.key)){
            Logger.critical('Invalid Level key.');
            return false;
        }
        if(!sc.hasOwn(props, 'modifiers') || 0 >= props.modifiers.length){
            Logger.warning('Level modifiers were not specified.', 'Level ID:', props.id, ' - Key:', props.key);
        }
        this.key = parseInt(props.key);
        this.modifiers = props.modifiers;
        // label could be used for messages like "you have reached level X!":
        this.label = sc.get(props, 'label', props.key);
        this.requiredExperience = sc.get(props, 'requiredExperience', sc.get(props, 'required_experience', 0));
    }

}

module.exports = Level;
