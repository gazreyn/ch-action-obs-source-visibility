import { CardIO, PropType, PropList, PropItem, PropOptions, WS } from '@casthub/types';
//
import { Scene } from 'obs-websocket-js';


export default class extends window.casthub.card.action {

    ws: WS;

    constructor() {
        super();

        this.ws = null;
    }

    public async mounted(): Promise<void> {

        const { id } = this.identity;
        this.ws = await window.casthub.ws(id);

        await super.mounted();
    }

    public async run(input: CardIO): Promise<void> {

        if(!this.props.scene || !this.props.source) return; // Do nothing

        await this.setSourceVisibility(this.props.scene, this.props.source, this.props.visibility);
    }

    /**
     * Asynchronously builds all of the properties for this Module.
     *
     * @return {Promise}
     */
    async prepareProps(stage): Promise<PropList> {

        /**
         * Dynamic Props
         */
        const dynamicProps: PropList = {};

        if(stage.scene !== undefined && stage.scene !== null) {
            // Get list of sources
            const sources = await this.fetchSourcesFromScene(stage.scene);
            const sourceOptions = this.generateSourcePropOptions(sources);

            dynamicProps['source'] = {
                type: PropType.Select,
                default: '',
                label: 'Source',
                required: true,
                /// @ts-ignore
                watch: true,
                help: 'Choose the channel where you would like to send the message',
                options: sourceOptions
            };
        }

        
        const scenes = await this.fetchScenes();
        const sceneOptions = this.generateScenePropOptions(scenes);
        
        return {
            visibility: {
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
            },
            scene: {
                type: PropType.Select,
                required: true,
                default: null,
                label: 'Scene',
                /// @ts-ignore
                watch: true,
                help: 'Select the scene where your source is.',
                options: sceneOptions
            },
            ...dynamicProps
        }
    }

    async fetchScenes(): Promise<Scene[]> {

        /// @ts-ignore
        const { scenes } = await this.ws.send('GetSceneList');

        return scenes;
    }

    async fetchSourcesFromScene(sceneName: string): Promise<any> {
        const scenes = await this.fetchScenes();
        const targetScene = scenes.filter(scene => {
            return scene.name === sceneName;
        });

        return targetScene[0].sources;
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

    generateSourcePropOptions(sources): PropOptions {
        let options: PropOptions = {};

        sources.forEach(source => {
            options[source.name] = {
                text: source.name
            }
        })

        return options;
    }

    async setSourceVisibility(scene, source, visibility): Promise<void> {

        console.log(scene, source);
        
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
