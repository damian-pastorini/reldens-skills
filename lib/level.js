/**
 *
 * Reldens - Skills - Level
 *
 */

const { ErrorManager, Logger, sc } = require('@reldens/utils');

class Level
{

    constructor(props)
    {
        // @NOTE: Level.key will be a unique value in the Levels class and the value must be an integer.
        if(!sc.hasOwn(props, 'key') || isNaN(props.key)){
            ErrorManager.error('Invalid Level key.');
        }
        if(!sc.hasOwn(props, 'modifiers') || 0 >= props.modifiers.length){
            Logger.error('Modifiers were not specified.', 'Level ID:', props.id, ' - Key:', props.key);
        }
        this.key = parseInt(props.key);
        this.modifiers = props.modifiers;
        // label could be used for messages like "you have reached level X!":
        this.label = sc.getDef(props, 'label', props.key);
        this.requiredExperience = sc.getDef(props, 'requiredExperience', sc.getDef(props, 'required_experience', 0));
    }

}

module.exports = Level;
