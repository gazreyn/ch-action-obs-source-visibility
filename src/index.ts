import { CardIO, PropType, PropList, PropItem } from '@casthub/types';
import { Scene } from 'obs-websocket-js';

export default class extends window.casthub.card.action {

    constructor() {
        super();

        this.sceneItemMap = {};

        /**
         * The OBS WebSocket Instance for the action.
         *
         * @type {WS|null}
         */
        this.ws = null;
    }

    /**
     * Called once when the Action is booted on App
     * launch or when installed for the first time.
     *
     * @return {Promise}
     */
    public async mounted(): Promise<void> {

        const { id } = this.identity;
        this.ws = await window.casthub.ws(id);

        await this.refresh();
        await super.mounted();
    }

    async refresh(): Promise<void> {

        const scenes = await this.getScenes();
        
        scenes.forEach(scene => {
            const { sources } = scene;
            sources.forEach(source => {
                const generatedName: string = `${encodeURI(scene.name)}|${encodeURI(source.name)}`;
                this.sceneItemMap[generatedName] = {
                    sceneName: scene.name,
                    sourceName: source.name
                }
            });
        });
    }

    /**
     * Asynchronously builds all of the properties for this Module.
     *
     * @return {Promise}
     */
    async prepareProps(): Promise<PropList> {

        let options = {};

        const items = Object.keys(this.sceneItemMap);
        const itemCount = items.length;

        for(let i = 0; i < itemCount; i++) {
            options[items[i]] = { text: `${this.sceneItemMap[items[i]].sceneName} - ${this.sceneItemMap[items[i]].sourceName} `, icon: 'widgets'};
        }

        const sceneItem : PropItem = {
            type: PropType.Select,
            required: true,
            default: null,
            label: 'Source',
            help: 'Select a source to toggle',
            options
        };

        const visibility : PropItem = {
            type: PropType.Select,
            required: true,
            default: 'toggle',
            label: 'State',
            help: 'Hide, show or toggle the source visibilty',
            options: {
                toggle: { text: 'Toggle', icon: 'code' },
                show: { text: 'Show', icon: 'visibility_on' },
                hide: { text: 'Hide', icon: 'visibility_off' },
            }  
        };

        return {
            sceneItem,
            visibility,
        };
    }

    /**
     * Called when a Trigger has executed and all Conditions have passed.
     *
     * @param {Object} input The output, if any, from the Trigger.
     */
    public async run(input: CardIO): Promise<void> {

        if(this.props.sceneItem === null) return; // Do nothing
        if(!this.sceneItemMap.hasOwnProperty(this.props.sceneItem)) return;

        const { sceneName, sourceName } = this.sceneItemMap[`${this.props.sceneItem}`];

        await this.setSourceVisibility(sceneName, sourceName, this.props.visibility);
    }

    async getScenes(): Promise<Scene[]> {

        const { scenes } = await this.ws.send('GetSceneList');

        return scenes;
    }

    async setSourceVisibility(scene, source, visibility): Promise<void> {
        
        const sourceSettings = await this.ws.send('GetSceneItemProperties', { 
            'scene-name': scene,
            'item': source 
        });
        
        switch(visibility) {
            case 'hide':
                await this.ws.send('SetSceneItemProperties', {
                    'scene-name': scene, 
                    'item': source, 
                    'visible': false
                });
                break;
            case 'show':
                await this.ws.send('SetSceneItemProperties', {
                    'scene-name': scene, 
                    'item': source, 
                    'visible': true
                });
                break;
            case 'toggle':
                await this.ws.send('SetSceneItemProperties', {
                    'scene-name': scene, 
                    'item': source, 
                    'visible': !sourceSettings.visible
                });
                break;
            default:
                break;
        }
    }

};
