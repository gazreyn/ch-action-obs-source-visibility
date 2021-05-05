import { CardIO, PropType, PropList, PropItem, PropOptions, WS } from '@casthub/types';
//
import { Scene } from 'obs-websocket-js';


export default class extends window.casthub.card.action {

    ws: WS;

    constructor() {
        super();

        // this.sceneItemMap = {};

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

        // this.sceneItemMap = await this.generateSceneItemMap();
        await super.mounted();
    }

    // async generateSceneItemMap(): Promise<any> {

    //     const itemMap = {};

    //     const scenes = await this.getScenes();
        
    //     scenes.forEach(scene => {
    //         const { sources } = scene;
    //         sources.forEach(source => {
    //             const generatedName: string = `${encodeURI(scene.name)}|${encodeURI(source.name)}`;
    //             itemMap[generatedName] = {
    //                 sceneName: scene.name,
    //                 sourceName: source.name
    //             }
    //         });
    //     });

    //     return itemMap;
    // }

    /**
     * Asynchronously builds all of the properties for this Module.
     *
     * @return {Promise}
     */
    async prepareProps(stage): Promise<PropList> {

        console.log(stage);

        const scenes = await this.fetchScenes();
        
        const sceneOptions = this.generateScenePropOptions(scenes)
        

        const scene : PropItem = {
            type: PropType.Select,
            required: true,
            default: null,
            label: 'Scene',
            /// @ts-ignore
            watch: true,
            help: 'Select the scene where your source is.',
            options: sceneOptions
        }

        return {
            scene
        }

        // let options: PropOptions = {};

        // const items: string[] = Object.keys(this.sceneItemMap);
        // const itemCount: number = items.length;

        // for(let i = 0; i < itemCount; i++) {
        //     options[items[i]] = { text: `${this.sceneItemMap[items[i]].sceneName} - ${this.sceneItemMap[items[i]].sourceName} `, icon: 'widgets'};
        // }

        // const sceneItem : PropItem = {
        //     type: PropType.Select,
        //     required: true,
        //     default: null,
        //     label: 'Source',
        //     help: 'Select a source to toggle',
        //     options
        // };

        // const visibility : PropItem = {
        //     type: PropType.Select,
        //     required: true,
        //     default: 'toggle',
        //     label: 'State',
        //     help: 'Hide, show or toggle the source visibilty',
        //     options: {
        //         toggle: { text: 'Toggle', icon: 'code' },
        //         show: { text: 'Show', icon: 'visibility_on' },
        //         hide: { text: 'Hide', icon: 'visibility_off' },
        //     }  
        // };

        // return {
        //     sceneItem,
        //     visibility,
        // };
    }

    /**
     * Called when a Trigger has executed and all Conditions have passed.
     *
     * @param {Object} input The output, if any, from the Trigger.
     */
    public async run(input: CardIO): Promise<void> {

        // if(this.props.sceneItem === null) return; // Do nothing
        // if(!this.sceneItemMap.hasOwnProperty(this.props.sceneItem)) return;

        // const { sceneName, sourceName } = this.sceneItemMap[`${this.props.sceneItem}`];

        // await this.setSourceVisibility(sceneName, sourceName, this.props.visibility);
    }

    generateScenePropOptions(scenes: Scene[]): PropOptions {
        let options: PropOptions = {};

        scenes.forEach(scene => {
            options[scene.name] = {
                text: scene.name
            }
        });

        return options;
    }

    async fetchScenes(): Promise<Scene[]> {

        const { scenes } = await this.ws.send('GetSceneList');

        return scenes;
    }

    async setSourceVisibility(scene, source, visibility): Promise<void> {
        
        // TODO: We can maybe remove this check and only do it IF case is toggle
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
